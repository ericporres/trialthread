import Anthropic from "@anthropic-ai/sdk";

export const MODELS = {
  extract: process.env.TT_EXTRACT_MODEL ?? "claude-sonnet-5",
  triage: process.env.TT_TRIAGE_MODEL ?? "claude-haiku-4-5-20251001",
  deep: process.env.TT_DEEP_MODEL ?? "claude-sonnet-5",
};

export const MOCK = process.env.TRIALTHREAD_MOCK === "1";

let _client: Anthropic | null = null;

export function client(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

/**
 * Content-safe error summary for server logs. Patient text and model output
 * must NEVER reach logs, so we keep the error class plus only known-safe,
 * content-free message shapes (HTTP statuses, network verbs, config).
 */
export function safeErr(e: unknown): string {
  const name = e instanceof Error ? e.constructor.name : typeof e;
  const msg = e instanceof Error ? e.message : String(e);
  const SAFE = [
    /^clinicaltrials\.gov returned \d+/,
    /^HTTP \d+/,
    /^\d{3} /,
    /status[: ]\d{3}/i,
    /overloaded/i,
    /rate.?limit/i,
    /timeout|timed out|aborted/i,
    /fetch failed|ECONNRESET|ENOTFOUND|EAI_AGAIN|network/i,
    /^ANTHROPIC_API_KEY/,
    /credit|billing/i,
  ];
  const hit = SAFE.find((p) => p.test(msg));
  const detail = hit ? msg.slice(0, 120) : msg.startsWith("Model returned non-JSON") ? "model-non-json-output" : "msg-suppressed";
  return `${name}: ${detail}`;
}

function transient(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  const status = (e as { status?: number })?.status;
  return (
    status === 429 || status === 500 || status === 529 ||
    /overloaded|rate.?limit|timeout|timed out|fetch failed|ECONNRESET|EAI_AGAIN|network/i.test(msg) ||
    msg.startsWith("Model returned non-JSON") // model hiccup — one re-ask is cheap and usually clean
  );
}

/**
 * Call Claude expecting a single JSON object or array in the reply.
 * Strips code fences. Retries ONCE on transient upstream failures
 * (429/500/529, network, non-JSON hiccup) — the "second try worked" class.
 */
export async function askJson<T>(opts: {
  model: string;
  system: string | Anthropic.TextBlockParam[];
  user: string;
  maxTokens?: number;
}): Promise<T> {
  try {
    return await askJsonOnce<T>(opts);
  } catch (e) {
    if (!transient(e)) throw e;
    console.error("tt_retry", safeErr(e));
    await new Promise((s) => setTimeout(s, 1500));
    return askJsonOnce<T>(opts);
  }
}

async function askJsonOnce<T>(opts: {
  model: string;
  system: string | Anthropic.TextBlockParam[];
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const msg = await client().messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 2000,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // Tolerate prose around the JSON: grab the outermost bracket pair.
  const start = Math.min(
    ...["{", "["].map((c) => {
      const i = cleaned.indexOf(c);
      return i === -1 ? Number.POSITIVE_INFINITY : i;
    })
  );
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  const candidate =
    Number.isFinite(start) && end > start ? cleaned.slice(start, end + 1) : cleaned;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    throw new Error(`Model returned non-JSON output: ${text.slice(0, 300)}`);
  }
}

/** Run promises with bounded concurrency, preserving order of results. */
export async function pool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
