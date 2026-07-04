import { safeErr } from "@/lib/anthropic";
import { extractProfile } from "@/lib/extract";
import { runMatchLoop } from "@/lib/loop";
import type { StreamEvent } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Best-effort per-instance throttle (serverless instances are ephemeral;
// this is a speed bump, not a wall).
const recent = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 4;

function throttled(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > MAX_PER_WINDOW;
}

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (throttled(ip)) {
    return Response.json(
      { error: "Too many searches in a row. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: { description?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  if (description.length < 20) {
    return Response.json(
      { error: "Please describe the condition in a bit more detail (a sentence or two)." },
      { status: 400 }
    );
  }
  if (description.length > 8000) {
    return Response.json({ error: "Description is too long." }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StreamEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));

      let stage = "start";
      try {
        send({ type: "status", message: "Reading your description" });

        stage = "extract";
        let profile;
        try {
          profile = await extractProfile(description);
        } catch (e) {
          if ((e as Error).message === "NO_CONDITION") {
            send({
              type: "error",
              stage,
              message:
                "We couldn't identify a medical condition in that description. Try including the diagnosis name — for example, \"my mother has stage 4 pancreatic cancer\".",
            });
            controller.close();
            return;
          }
          throw e;
        }

        send({ type: "profile", profile });

        stage = "pipeline";
        for await (const event of runMatchLoop(profile)) {
          send(event);
        }
      } catch (e) {
        // Server-side failure log — stage + content-scrubbed error only.
        // Patient text must never appear here (see safeErr).
        console.error("tt_search_error", stage, safeErr(e));
        send({
          type: "error",
          stage,
          message:
            "Something went wrong during the search — usually a brief hiccup on our side or at clinicaltrials.gov. Please try again in a moment.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
