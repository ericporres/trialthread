#!/usr/bin/env node
/**
 * Weekly cost ledger — the deterministic half of the Sunday task.
 *
 *   node scripts/weekly-cost.mjs --set 2026-07=26.29 [--set 2026-08=1.20] [--dry-run]
 *
 * ── WHY MONTHS, NOT A RUNNING TOTAL ────────────────────────────────────────
 * The Console cost page (platform.claude.com/cost?api_key=...) is a RANGE view.
 * It defaults to "Month to date", it caps at 31 days, and it RESETS at every
 * month boundary. It is not a cumulative all-time counter.
 *
 * The first version of this script assumed it was. That version would have
 * worked fine through July and then, on 1 August, read ~$0.00, concluded the
 * cost had "gone down", and refused — every week, forever, until someone
 * noticed. A guard that fires correctly for the wrong reason is worse than no
 * guard, because it looks like it is working.
 *
 * So the ledger is a TABLE OF MONTHS and the all-time figure is their SUM.
 * Month-to-date only ever grows within its own month, which makes the guard
 * meaningful again. And when the month rolls over, a new row simply begins.
 *
 * ── WHY GUARDRAILS AT ALL ──────────────────────────────────────────────────
 * The number comes out of a browser reading a page. Browser reads are fuzzy: a
 * stale render, a range filter left on "Last 7 days", a $ glued to a digit, a
 * model that helpfully rounds. COSTS.md is PUBLIC, on a site that tells cancer
 * patients "every dollar goes to servers and tokens — here is the receipt."
 * Its entire value is that it has never quietly lied.
 *
 * The agent's job is to READ a number. This script's job is to REFUSE it if it
 * looks wrong. A missing week is a small problem. A wrong number in a public
 * ledger that claims to be checkable is a large one.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COSTS = path.join(__dirname, "..", "COSTS.md");

const COST_PER_SEARCH = 0.2115; // measured 2026-07-14 — see COSTS.md
const FUNDED = 100.0;
const DEV_SPEND = 11.71;        // non-patient: build + evals + the 2026-07-14 audit

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const FORCE = argv.includes("--force");

const fail = (msg) => {
  console.error(`\n🔴 REFUSED — nothing written.\n   ${msg}\n`);
  process.exit(1);
};

// ── parse --set YYYY-MM=AMOUNT ─────────────────────────────────────────────
const sets = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] !== "--set") continue;
  const pair = argv[i + 1] ?? "";
  const m = pair.match(/^(\d{4})-(\d{2})=(-?[\d.]+)$/);
  if (!m) fail(`Bad --set "${pair}". Expected YYYY-MM=AMOUNT, e.g. --set 2026-08=1.20`);
  const month = `${m[1]}-${m[2]}`;
  const amount = parseFloat(m[3]);
  if (!Number.isFinite(amount)) fail(`"${m[3]}" is not a number.`);
  if (amount < 0 || amount > 500) fail(`$${amount} for ${month} is outside the sane range ($0–$500). Misread?`);
  sets.push({ month, amount });
}
if (!sets.length) fail("Nothing to do. Usage: --set YYYY-MM=AMOUNT [--set YYYY-MM=AMOUNT]");

// ── read the existing month table ──────────────────────────────────────────
const md = fs.readFileSync(COSTS, "utf8");
const TABLE_RE = /<!-- MONTHS:START -->([\s\S]*?)<!-- MONTHS:END -->/;
const tableMatch = md.match(TABLE_RE);
if (!tableMatch) {
  fail(
    "COSTS.md has no <!-- MONTHS:START --> … <!-- MONTHS:END --> block.\n" +
    "   Run scripts/init-month-table.mjs once, or add the block by hand."
  );
}

const months = new Map();
for (const line of tableMatch[1].split("\n")) {
  const m = line.match(/^\|\s*(\d{4}-\d{2})\s*\|\s*\$([\d.]+)\s*\|/);
  if (m) months.set(m[1], parseFloat(m[2]));
}

// ── guards ─────────────────────────────────────────────────────────────────
for (const { month, amount } of sets) {
  const prior = months.get(month);
  if (prior !== undefined && amount < prior && !FORCE) {
    fail(
      `${month} went DOWN: $${prior.toFixed(2)} → $${amount.toFixed(2)}.\n` +
      `   Month-to-date is cumulative WITHIN its month — it cannot shrink.\n` +
      `   Almost certainly the Range filter was left on "Last 7 days" or "Last 30 days"\n` +
      `   instead of "Month to date". Re-read the page with the correct range.`
    );
  }
  const jump = amount - (prior ?? 0);
  if (jump > 30 && !FORCE) {
    fail(
      `${month} jumped $${jump.toFixed(2)} in a week — roughly ${Math.round(jump / COST_PER_SEARCH)} searches.\n` +
      `   Possible if TrialThread took off. Far likelier a misread (wrong key? wrong range?).\n` +
      `   A human should look. Re-run with --force if it is real.`
    );
  }
  months.set(month, amount);
}

// ── compute ────────────────────────────────────────────────────────────────
const sorted = [...months.entries()].sort(([a], [b]) => a.localeCompare(b));
const total = sorted.reduce((s, [, v]) => s + v, 0);
const organic = Math.max(0, total - DEV_SPEND);
const searches = Math.round(organic / COST_PER_SEARCH);
const runway = FUNDED - total;

// what the totals were BEFORE this update, so we can report the weekly delta
const priorTotal = [...tableMatch[1].matchAll(/^\|\s*\d{4}-\d{2}\s*\|\s*\$([\d.]+)\s*\|/gm)]
  .reduce((s, m) => s + parseFloat(m[1]), 0);
const priorSearches = Math.round(Math.max(0, priorTotal - DEV_SPEND) / COST_PER_SEARCH);
const newSearches = searches - priorSearches;
const spentThisWeek = total - priorTotal;

console.log("── weekly cost ledger ──");
for (const [m, v] of sorted) console.log(`  ${m}   $${v.toFixed(2)}`);
console.log(`  ─────────────────`);
console.log(`  all-time        $${total.toFixed(2)}   (+$${spentThisWeek.toFixed(2)} this week)`);
console.log(`  non-patient     $${DEV_SPEND.toFixed(2)}`);
console.log(`  organic         $${organic.toFixed(2)}`);
console.log(`  patient searches ≈${searches} all-time  (+${newSearches} this week)`);
console.log(`  runway          $${runway.toFixed(2)}`);

if (DRY) {
  console.log("\n(--dry-run: nothing written)");
  process.exit(0);
}

// ── write ──────────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const rows = sorted.map(([m, v]) => `| ${m} | $${v.toFixed(2)} |`).join("\n");
const newTable =
`<!-- MONTHS:START -->
| Month | Spend |
|---|---:|
${rows}
| **All-time** | **$${total.toFixed(2)}** |
<!-- MONTHS:END -->`;

// NOTE: both replacements pass a FUNCTION, not a string. A string replacement
// treats `$1`, `$&`, `` $` `` etc. as substitution tokens — and these strings are
// full of dollar amounts. A month total of `$1.18` would expand `$1` to
// TABLE_RE's capture group (the entire old table) and silently shred the ledger.
// --dry-run does not exercise this path, so the corruption only ever appears in
// the real write. Function replacers disable token expansion entirely.
let out = md.replace(TABLE_RE, () => newTable);

// Refresh the runway line.
const runwayLine = `**API credit runway:** $${FUNDED.toFixed(0)} funded − **$${total.toFixed(2)}** spent = **$${runway.toFixed(2)} remaining** ≈ ${Math.round(runway / COST_PER_SEARCH)} searches at the measured rate. *(Auto-updated ${today}.)*`;
out = out.replace(/\*\*API credit runway:\*\*[^\n]*/, () => runwayLine);

if (out === md) fail("COSTS.md was not modified — anchor patterns did not match. Format drift?");

fs.writeFileSync(COSTS, out);
console.log(`\n✅ COSTS.md updated — all-time $${total.toFixed(2)}, runway $${runway.toFixed(2)}`);
console.log(`\nARTIFACT_SEED: { v: ${total.toFixed(2)}, t: "${today}", dev: ${DEV_SPEND.toFixed(2)} },`);
console.log(
  newSearches === 0
    ? `SUMMARY: $${total.toFixed(2)} spent (+$${spentThisWeek.toFixed(2)}) · ≈${searches} patient searches · ZERO NEW SEARCHES THIS WEEK · $${runway.toFixed(2)} runway`
    : `SUMMARY: $${total.toFixed(2)} spent (+$${spentThisWeek.toFixed(2)}) · ≈${searches} patient searches (+${newSearches}) · $${runway.toFixed(2)} runway`
);
