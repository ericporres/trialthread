#!/usr/bin/env node
/**
 * Weekly cost ledger update — the deterministic half of the Sunday task.
 *
 *   node scripts/weekly-cost.mjs <keyCostUSD> [--dev <nonPatientSpendUSD>] [--dry-run]
 *
 * WHY THIS IS A SCRIPT AND NOT JUST A PROMPT
 * ------------------------------------------
 * The number comes out of a browser reading a Console page. Browser reads are
 * fuzzy: a stale render, a filtered view, a $ sign glued to a digit, a model
 * that "helpfully" rounds. COSTS.md is PUBLIC, and its entire value is that the
 * numbers are checkable — "every dollar goes to servers and tokens" only means
 * something if the ledger has never quietly lied.
 *
 * So the agent's job is to READ a number. This script's job is to REFUSE it if
 * it looks wrong. The guardrails below are not paranoia; they are the reason
 * anyone should believe the file.
 *
 * GUARDRAILS (each exits non-zero rather than writing):
 *   1. Cost must not go DOWN. Anthropic's Cost column is cumulative. A decrease
 *      means the page was misread, filtered to a date range, or showing a
 *      different key.
 *   2. Cost must not jump more than $25 in a week without --force. At the
 *      measured $0.2115/search that is ~118 searches in 7 days — possible if
 *      the thing takes off, but far likelier to be a misread. Make a human look.
 *   3. The value must parse as a plain number in a sane range ($0–$500).
 *
 * If a guardrail trips, the task iMessages Eric and writes nothing. A week of
 * missing ledger data is a small problem. A wrong number in a public ledger
 * that claims to be trustworthy is a large one.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const COSTS = path.join(ROOT, "COSTS.md");

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const FORCE = args.includes("--force");
const cost = parseFloat(args[0]);
const devIdx = args.indexOf("--dev");
const devOverride = devIdx > -1 ? parseFloat(args[devIdx + 1]) : null;

const fail = (msg) => {
  console.error(`\n🔴 REFUSED — nothing written.\n   ${msg}\n`);
  process.exit(1);
};

// ── parse guard ────────────────────────────────────────────────────────────
if (!Number.isFinite(cost)) fail(`"${args[0]}" is not a number. Usage: weekly-cost.mjs <keyCostUSD>`);
if (cost < 0 || cost > 500) fail(`$${cost} is outside the sane range ($0–$500). Misread?`);

// ── read the current ledger ────────────────────────────────────────────────
const md = fs.readFileSync(COSTS, "utf8");

// Last recorded cumulative key cost — pulled from the runway line, which is the
// one place the file states the all-time figure unambiguously.
const runwayMatch = md.match(/\*\*API credit runway:\*\*.*?\$100 funded − \*\*\$([\d.]+)\*\*/);
if (!runwayMatch) fail("Could not find the runway line in COSTS.md — has the format changed?");
const lastCost = parseFloat(runwayMatch[1]);

// Current non-patient spend (build + evals + audits).
const devMatch = md.match(/subtracts \*\*\$([\d.]+)\*\* of non-patient spend/) ?? md.match(/DEV_SPEND[^\d]*([\d.]+)/);
const lastDev = devOverride ?? (devMatch ? parseFloat(devMatch[1]) : 11.71);

const COST_PER_SEARCH = 0.2115; // measured 2026-07-14, see COSTS.md

// ── the guardrails that make this file believable ──────────────────────────
if (cost < lastCost) {
  fail(
    `Cost went DOWN: $${lastCost.toFixed(2)} → $${cost.toFixed(2)}.\n` +
    `   The Console's Cost column is cumulative — it cannot decrease.\n` +
    `   Almost certainly the page was misread, date-filtered, or showing another key.`
  );
}
const delta = cost - lastCost;
if (delta > 25 && !FORCE) {
  fail(
    `Cost jumped $${delta.toFixed(2)} in one week — that is ~${Math.round(delta / COST_PER_SEARCH)} searches.\n` +
    `   Possible if TrialThread took off. Far likelier a misread.\n` +
    `   A human should look. Re-run with --force if it is real.`
  );
}

// ── compute ────────────────────────────────────────────────────────────────
const organic = Math.max(0, cost - lastDev);
const searches = Math.round(organic / COST_PER_SEARCH);
const prevOrganic = Math.max(0, lastCost - lastDev);
const prevSearches = Math.round(prevOrganic / COST_PER_SEARCH);
const newSearches = searches - prevSearches;
const runway = 100 - cost;

const today = new Date().toISOString().slice(0, 10);

console.log("── weekly cost update ──");
console.log(`  last recorded   $${lastCost.toFixed(2)}`);
console.log(`  new reading     $${cost.toFixed(2)}   (+$${delta.toFixed(2)})`);
console.log(`  non-patient     $${lastDev.toFixed(2)}`);
console.log(`  organic         $${organic.toFixed(2)}`);
console.log(`  patient searches ≈${searches} all-time  (+${newSearches} this week)`);
console.log(`  runway          $${runway.toFixed(2)}`);

if (DRY) {
  console.log("\n(--dry-run: nothing written)");
  process.exit(0);
}

// ── write ──────────────────────────────────────────────────────────────────
const row = `| ${today} | Weekly ledger check (automated). Key cost $${cost.toFixed(2)} → organic $${organic.toFixed(2)} after non-patient spend ≈ **${searches} patient searches all-time** (+≈${newSearches} this week) | $${delta.toFixed(2)} |`;

// Insert the new row immediately before the runway line.
let out = md.replace(
  /(\n\n\*\*API credit runway:\*\*)/,
  `\n${row}$1`
);
out = out.replace(
  /\*\*API credit runway:\*\* \$100 funded − \*\*\$[\d.]+\*\* spent = \*\*\$[\d.]+ remaining\*\* ≈ [\d,]+ searches at the measured rate\./,
  `**API credit runway:** $100 funded − **$${cost.toFixed(2)}** spent = **$${runway.toFixed(2)} remaining** ≈ ${Math.round(runway / COST_PER_SEARCH)} searches at the measured rate.`
);

if (out === md) fail("COSTS.md was not modified — the anchor patterns did not match. Format drift?");

fs.writeFileSync(COSTS, out);
console.log(`\n✅ COSTS.md updated (+1 row, runway → $${runway.toFixed(2)})`);

// Emit the artifact seed line so the Pulse can be kept in lockstep.
console.log(`\nARTIFACT_SEED: { v: ${cost.toFixed(2)}, t: "${today}", dev: ${lastDev.toFixed(2)} },`);
console.log(`SUMMARY: $${cost.toFixed(2)} spent · ≈${searches} patient searches (+${newSearches} this week) · $${runway.toFixed(2)} runway`);
