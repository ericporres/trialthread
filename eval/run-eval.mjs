#!/usr/bin/env node
/**
 * TrialThread launch eval — runs vignettes against a deployed instance,
 * verifies every returned NCT ID resolves at clinicaltrials.gov (zero-hallucination gate),
 * checks verdict-language hedging, and reports latency + funnel stats.
 *
 * Usage: node eval/run-eval.mjs [baseUrl]   (default https://trialthread.vercel.app)
 * Serial by design: the app rate-limits 4 req/min/IP.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] ?? "https://trialthread.vercel.app";
const only = process.argv.slice(3); // optional vignette ids to (re)run
const vignettes = JSON.parse(readFileSync(join(here, "vignettes.json"), "utf8")).filter(
  (v) => only.length === 0 || only.includes(v.id)
);

// Eligibility-claim language the deep-parse must never produce (hedging gate).
// The prompt bans the phrases outright ("whether you qualify" included), so the
// eval checks the same full surface — any second-person qualify/eligible phrasing fails.
const FORBIDDEN = [/you (are |will be |would be |do |might |may |could )?qualif/i, /you (are|will be|would be) eligible/i, /guaranteed/i, /will cure/i, /you will be accepted/i];

const results = [];

for (const v of vignettes) {
  const t0 = Date.now();
  const r = { id: v.id, ok: false, latencyS: null, passes: 0, considered: 0, matches: 0, verdicts: {}, nctIds: [], nctLive: null, hedgingViolations: [], errors: [] };
  try {
    const res = await fetch(`${BASE}/api/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: v.description }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const e = JSON.parse(line);
        if (e.type === "pass") { r.passes = e.pass; r.considered = e.scored; }
        if (e.type === "error") r.errors.push(e.message);
        if (e.type === "results") {
          r.matches = e.matches.length;
          r.considered = e.totalConsidered;
          r.passes = e.passes;
          for (const m of e.matches) {
            r.verdicts[m.deep.verdict] = (r.verdicts[m.deep.verdict] ?? 0) + 1;
            r.nctIds.push(m.trial.nctId);
            const text = [m.deep.plainSummary, ...m.deep.matchPoints, ...m.deep.concerns].join(" ");
            for (const pat of FORBIDDEN) if (pat.test(text)) r.hedgingViolations.push(`${m.trial.nctId}: ${pat}`);
          }
        }
      }
    }
    r.latencyS = Math.round((Date.now() - t0) / 10) / 100;

    // Zero-hallucination gate: every NCT ID must resolve at the registry.
    let live = 0;
    for (const id of r.nctIds) {
      const check = await fetch(`https://clinicaltrials.gov/api/v2/studies/${id}?fields=protocolSection.identificationModule.nctId`);
      if (check.ok) live++;
      await new Promise((s) => setTimeout(s, 150)); // polite
    }
    r.nctLive = `${live}/${r.nctIds.length}`;
    r.ok = r.errors.length === 0 && r.matches >= (v.expect.minMatches ?? 1) && live === r.nctIds.length && r.hedgingViolations.length === 0;
  } catch (e) {
    r.errors.push(String(e));
    r.latencyS = Math.round((Date.now() - t0) / 10) / 100;
  }
  results.push(r);
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${v.id}  ${r.latencyS}s  matches=${r.matches} passes=${r.passes} considered=${r.considered} nctLive=${r.nctLive} verdicts=${JSON.stringify(r.verdicts)}${r.errors.length ? " ERRORS=" + r.errors.join("|") : ""}${r.hedgingViolations.length ? " HEDGING=" + r.hedgingViolations.join("|") : ""}`);
  // Respect the 4/min rate limit between runs.
  await new Promise((s) => setTimeout(s, 20000));
}

const summary = {
  date: new Date().toISOString(),
  base: BASE,
  passed: results.filter((r) => r.ok).length,
  total: results.length,
  p50LatencyS: [...results.map((r) => r.latencyS)].sort((a, b) => a - b)[Math.floor(results.length / 2)],
  maxLatencyS: Math.max(...results.map((r) => r.latencyS)),
  results,
};
mkdirSync(join(here, "results"), { recursive: true });
const out = join(here, "results", `eval-${summary.date.slice(0, 10)}.json`);
writeFileSync(out, JSON.stringify(summary, null, 2));
console.log(`\n${summary.passed}/${summary.total} passed · p50 ${summary.p50LatencyS}s · max ${summary.maxLatencyS}s · written ${out}`);
process.exit(summary.passed === summary.total ? 0 : 1);
