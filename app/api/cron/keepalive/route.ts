import { pingStore } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Daily keep-alive for the rate limiter's shared store (see pingStore in
 * lib/ratelimit.ts). Scheduled in vercel.json.
 *
 * AUTH: Vercel sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is
 * set in the project env — then that is required. Without it, we fall back to
 * Vercel's cron user-agent. That fallback is forgeable, so the worst a forger
 * can do is the same single constant write the cron does; set CRON_SECRET to
 * close even that.
 *
 * Returns 503 when the store is missing or unreachable, so the cron run shows
 * as FAILED in Vercel → Settings → Cron Jobs instead of quietly "succeeding."
 */
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const authorized = secret
    ? req.headers.get("authorization") === `Bearer ${secret}`
    : (req.headers.get("user-agent") ?? "").startsWith("vercel-cron/");
  if (!authorized) return new Response("Unauthorized", { status: 401 });

  const health = await pingStore();
  if (health.state === "ok") {
    console.log("tt_keepalive ok", `${health.ms}ms`);
    return Response.json(health);
  }
  console.error("tt_keepalive FAILED", JSON.stringify(health), "— global daily cap is NOT enforced");
  return Response.json(health, { status: 503 });
}
