/**
 * Denial-of-wallet defence.
 *
 * ── THE THREAT, STATED HONESTLY ────────────────────────────────────────────
 * Every search costs ~$0.21 of inference against a hard-capped prepaid balance.
 * Auto-reload is deliberately OFF, so the failure mode is not a surprise bill —
 * it is an OUTAGE. Drain the balance and TrialThread is simply dead, and the
 * people who hit a dead site are cancer patients.
 *
 * ── CORRECTION LOG (2026-07-14, same night) ────────────────────────────────
 * The first version of this file claimed that setting UPSTASH_REDIS_REST_URL /
 * _TOKEN would make the counters "durable with zero code change." That was
 * FALSE. The env check existed, but it was wired to nothing except a log line —
 * every counter was still per-instance. Adding Upstash would have changed a
 * string in the logs and nothing else.
 *
 * That is exactly the kind of claim this project's audit exists to catch, and
 * it was written by the auditor. Logged rather than quietly fixed.
 *
 * This version actually uses the store.
 *
 * ── THE TWO LAYERS ─────────────────────────────────────────────────────────
 * 1. IN-MEMORY (always on, zero latency, per-instance). Cheap first pass. Can
 *    be diluted by forcing cold starts — it is a speed bump.
 * 2. DURABLE GLOBAL (Upstash, if configured). This is the one that actually
 *    bounds a drain, because it is shared across every instance. Without it,
 *    an attacker who forces cold starts bypasses layer 1 entirely.
 *
 * ── FAIL OPEN, DELIBERATELY ────────────────────────────────────────────────
 * If Redis is unreachable, we ALLOW the search. A patient with cancer must not
 * be turned away because a cache had a bad minute. The in-memory limiter still
 * applies, so a Redis outage degrades to the previous behaviour — not to no
 * protection at all. The wallet is worth less than the person.
 *
 * ── WHAT THE GLOBAL CAP ACTUALLY BUYS ──────────────────────────────────────
 * GLOBAL_PER_DAY = 80. Real usage is ~7 searches/day (69 in 10 days), so this
 * is ~11x headroom for genuine growth. Under sustained attack the worst case is
 * 80 × $0.21 ≈ $16.80/day — meaning the current $73 runway survives 4+ days of
 * a determined drain instead of ~90 minutes.
 *
 * That is a BOUND, not immunity. It converts "TrialThread is dead by lunchtime"
 * into "TrialThread degrades slowly and somebody notices." For a 2.5-week
 * absence, that difference is the whole point.
 *
 * ── KILL SWITCH ────────────────────────────────────────────────────────────
 * TRIALTHREAD_DISABLED=1 in Vercel env stops searches immediately, from a
 * phone, without a deploy.
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const HAS_SHARED_STORE = Boolean(REDIS_URL && REDIS_TOKEN);

// ── budgets ────────────────────────────────────────────────────────────────
// Real usage: ~69 searches in 10 days. A legitimate human runs 1–3 searches,
// thinks, maybe runs a couple more. Nobody legitimately runs 20 in an hour.
// Generous for humans, hostile to scripts.
const PER_IP = { max: 3, windowSec: 5 * 60 };
const PER_SUBNET = { max: 8, windowSec: 15 * 60 };
const PER_INSTANCE = { max: 25, windowSec: 60 * 60 };
const GLOBAL_PER_DAY = 80;         // durable; the real drain bound. ~11x current usage.
const MAX_CONCURRENT = 5;

type Hits = number[];
const byIp = new Map<string, Hits>();
const bySubnet = new Map<string, Hits>();
let instanceHits: Hits = [];
let inFlight = 0;

function bump(map: Map<string, Hits>, key: string, cfg: { max: number; windowSec: number }, now: number): boolean {
  const hits = (map.get(key) ?? []).filter((t) => now - t < cfg.windowSec * 1000);
  hits.push(now);
  map.set(key, hits);
  if (map.size > 10_000) map.clear(); // a flood of unique keys must not become its own DoS
  return hits.length > cfg.max;
}

/** IPv4 /24, or IPv6 /64 — the cheap-to-rotate part of an address. */
function subnetOf(ip: string): string {
  if (ip.includes(":")) return ip.split(":").slice(0, 4).join(":");
  const p = ip.split(".");
  return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}` : ip;
}

/**
 * INCR a key with a TTL, via the Upstash REST API. Plain fetch — no SDK, no
 * dependency, no cold-start cost.
 *
 * Returns the new count, or null if the store is not configured OR unreachable.
 * null always means "do not block" — see FAIL OPEN above.
 */
async function incr(key: string, ttlSec: number): Promise<number | null> {
  if (!HAS_SHARED_STORE) return null;
  try {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      // INCR, then set the TTL only if the key has none (NX) — so the window
      // starts at the first hit and does not slide forward on every request.
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(ttlSec), "NX"],
      ]),
      signal: AbortSignal.timeout(1200),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result?: unknown }>;
    const n = data?.[0]?.result;
    return typeof n === "number" ? n : null;
  } catch {
    // Redis hiccup, timeout, DNS, anything. Fail OPEN. A patient must not be
    // turned away because a cache had a bad minute.
    return null;
  }
}

export type Decision =
  | { ok: true }
  | { ok: false; status: number; message: string; reason: string };

export async function checkLimits(req: Request): Promise<Decision> {
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

  // Cheap origin check. Forged in one line by anyone serious — it is here to
  // kill drive-by scripts and curl loops, not to stop an adversary. We reject
  // only when an Origin IS present and wrong; a MISSING Origin is allowed,
  // because that is what our own eval harness and any legitimate server-side
  // caller sends.
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

  // ── layer 1: in-memory (always on) ───────────────────────────────────────
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
  instanceHits = instanceHits.filter((t) => now - t < PER_INSTANCE.windowSec * 1000);
  instanceHits.push(now);
  if (instanceHits.length > PER_INSTANCE.max) {
    return {
      ok: false,
      status: 429,
      reason: "instance_budget",
      message: "TrialThread is unusually busy. Please try again shortly.",
    };
  }

  // ── layer 2: durable global (the one that actually bounds a drain) ───────
  const day = new Date().toISOString().slice(0, 10);
  const count = await incr(`tt:day:${day}`, 26 * 60 * 60);
  if (count !== null && count > GLOBAL_PER_DAY) {
    return {
      ok: false,
      status: 503,
      reason: "global_daily_cap",
      message:
        "TrialThread has hit its daily search limit — it runs on a small, fixed budget. Please try again tomorrow. In the meantime, the official registry is always available at clinicaltrials.gov.",
    };
  }

  // Durable per-IP too, so cold-start dilution doesn't defeat layer 1.
  const ipCount = await incr(`tt:ip:${ip}`, PER_IP.windowSec);
  if (ipCount !== null && ipCount > PER_IP.max) {
    return {
      ok: false,
      status: 429,
      reason: "ip_durable",
      message: "That's a few searches in a row. Please wait a few minutes and try again.",
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

/** Logged at cold start so the limiter's real strength is visible in prod. */
export function limiterMode(): string {
  return HAS_SHARED_STORE
    ? `durable (upstash) · global cap ${GLOBAL_PER_DAY}/day`
    : "per-instance ONLY (NOT durable — cold-start dilution bypasses it; set UPSTASH_REDIS_REST_URL/TOKEN)";
}
