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
 * Call Claude expecting a single JSON object or array in the reply.
 * Strips code fences; throws with the raw text on parse failure so
 * callers can decide whether to retry or degrade.
 */
export async function askJson<T>(opts: {
  model: string;
  system: string;
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
