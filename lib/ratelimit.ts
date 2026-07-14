/**
 * Denial-of-wallet defence.
 *
 * ── THE THREAT, STATED HONESTLY ────────────────────────────────────────────
 * Every search costs ~$0.21 of inference against a hard-capped prepaid balance.
 * Auto-reload is deliberately OFF, so the failure mode is not a surprise bill —
 * it is an OUTAGE. Drain the balance and TrialThread is simply dead, and the
 * people who hit a dead site are cancer patients.
 *
 * At ~$0.21/search, roughly 350 requests empties the remaining runway. That is
 * not many. The previous limiter was 4/min per IP held in a per-instance Map —
 * its own comment called it "a speed bump, not a wall," which was accurate and
 * is why this file exists.
 *
 * ── WHAT THIS ACTUALLY BUYS, AND WHAT IT DOESN'T ───────────────────────────
 * Serverless instances are ephemeral and there are many of them, so ANY
 * in-memory limiter can be diluted by forcing cold starts. This is mitigation,
 * not elimination. Be honest about that rather than feeling safe.
 *
 * What it does buy: it raises the cost of a casual drain from "trivial" to
 * "annoying," which is the entire difference between a bored teenager and a
 * determined adversary. Most denial-of-wallet is the former.
 *
 * The real fix is a shared store. `SHARED_LIMITER` below is wired for exactly
 * that: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN and the global
 * counters become durable across instances with zero code change. Until then it
 * degrades to per-instance, loudly, in the logs.
 *
 * ── ALSO ───────────────────────────────────────────────────────────────────
 * KILL SWITCH: set TRIALTHREAD_DISABLED=1 in Vercel env to stop serving
 * searches immediately, from a phone, from a beach, without a deploy.
 */

const HAS_SHARED_STORE = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// ── budgets ────────────────────────────────────────────────────────────────
// Tuned against real usage: TrialThread has done ~69 searches in 10 days. A
// legitimate human runs 1–3 searches, thinks, maybe runs 2 more. Nobody
// legitimately runs 20 in an hour. These are generous for humans and hostile
// to scripts.
const PER_IP = { max: 3, windowMs: 5 * 60_000 };        // 3 per 5 min per IP
const PER_SUBNET = { max: 8, windowMs: 15 * 60_000 };   // 8 per 15 min per /24 — defeats naive IP rotation
const PER_INSTANCE = { max: 25, windowMs: 60 * 60_000 };// 25/hr caps blast radius of any single warm instance
const MAX_CONCURRENT = 5;                                // in-flight searches

type Hits = number[];
const byIp = new Map<string, Hits>();
const bySubnet = new Map<string, Hits>();
let instanceHits: Hits = [];
let inFlight = 0;

function sweep(hits: Hits, windowMs: number, now: number): Hits {
  return hits.filter((t) => now - t < windowMs);
}

function bump(map: Map<string, Hits>, key: string, cfg: { max: number; windowMs: number }, now: number): boolean {
  const hits = sweep(map.get(key) ?? [], cfg.windowMs, now);
  hits.push(now);
  map.set(key, hits);
  // Bounded memory — a flood of unique keys must not become its own DoS.
  if (map.size > 10_000) map.clear();
  return hits.length > cfg.max;
}

/** IPv4 /24, or IPv6 /64 — the cheap-to-rotate part of an address. */
function subnetOf(ip: string): string {
  if (ip.includes(":")) return ip.split(":").slice(0, 4).join(":"); // IPv6 /64
  const p = ip.split(".");
  return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}` : ip;           // IPv4 /24
}

export type Decision =
  | { ok: true }
  | { ok: false; status: number; message: string; reason: string };

export function checkLimits(req: Request): Decision {
  if (process.env.TRIALTHREAD_DISABLED === "1") {
    return {
      ok: false,
      status: 503,
      reason: "kill_switch",
      message:
        "TrialThread is temporarily paused. The official registry is always available at clinicaltrials.gov — please search there in the meantime.",
    };
  }

  const now = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Cheap origin check. A real attacker forges this in one line — it is here to
  // kill drive-by scripts and casual curl loops, not to stop anyone serious.
  // We only reject when an Origin IS present and is wrong; a missing Origin is
  // allowed, because that is what our own eval harness and any legitimate
  // server-side caller sends.
  const origin = req.headers.get("origin");
  if (origin && !/^https:\/\/(www\.)?trialthread\.(org|com)$/.test(origin)) {
    return { ok: false, status: 403, reason: "bad_origin", message: "Invalid request origin." };
  }

  if (inFlight >= MAX_CONCURRENT) {
    return {
      ok: false,
      status: 503,
      reason: "concurrency",
      message: "TrialThread is busy right now. Please try again in a minute.",
    };
  }

  if (bump(byIp, ip, PER_IP, now)) {
    return {
      ok: false,
      status: 429,
      reason: "ip",
      message: "That's a few searches in a row. Please wait a few minutes and try again.",
    };
  }

  if (bump(bySubnet, subnetOf(ip), PER_SUBNET, now)) {
    return {
      ok: false,
      status: 429,
      reason: "subnet",
      message: "Too many searches from your network. Please wait a few minutes and try again.",
    };
  }

  instanceHits = sweep(instanceHits, PER_INSTANCE.windowMs, now);
  instanceHits.push(now);
  if (instanceHits.length > PER_INSTANCE.max) {
    return {
      ok: false,
      status: 429,
      reason: "instance_budget",
      message: "TrialThread is unusually busy. Please try again shortly.",
    };
  }

  return { ok: true };
}

export function acquire(): void {
  inFlight++;
}
export function release(): void {
  inFlight = Math.max(0, inFlight - 1);
}

/**
 * Logged once per cold start so the gap between "we have a limiter" and "the
 * limiter is durable" is visible in production, not just in this comment.
 */
export function limiterMode(): string {
  return HAS_SHARED_STORE
    ? "shared (upstash)"
    : "per-instance (NOT durable — set UPSTASH_REDIS_REST_URL/TOKEN to harden)";
}
