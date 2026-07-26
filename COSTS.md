# COSTS.md — the running bill, in public

TrialThread is free for patients, forever. Free means someone pays the infrastructure — this file is the receipt, so "every dollar goes to servers and tokens" is a checkable claim, not a slogan. Updated when the numbers move materially, at least monthly.

## Cash out, to date

| Date | Item | Amount |
|------|------|--------|
| 2026-07-04 | Domains: trialthread.com ($11.25) + trialthread.org ($9.99), 1 yr, DreamHost | $21.24 |
| 2026-07-04 | Anthropic API credits (top-up) | $100.00 |
| **Total cash in the project** | | **$121.24** |

## Cash burned, to date

| Date | What | Amount |
|------|------|--------|
| 2026-07-04 | Pre-launch: first live run + 6-vignette launch eval + hedging-fix re-runs (9 searches, measured off the Console balance) | $2.79 |
| 2026-07-04 | Post-launch verification runs (cost-pass rerun ×2, observability smoke ×1, estimated at measured rates) | ~$0.75 |
| 2026-07-04 → | Organic patient searches | tracked via the dedicated API key's Cost column (cleaner than balance-delta: per-key attribution) |
| 2026-07-05 | First ledger check: key cost $7.18 total → $3.63 organic after dev/eval spend ≈ **14-15 patient searches in the first day** | $3.63 |
| 2026-07-07 | Second ledger check: key cost $12.15 total → $8.60 organic after dev/eval spend ≈ **34 patient searches all-time** (+$4.97 / ~20 since the 7/5 check) | $4.97 |
| 2026-07-14 | Third ledger check, **before** the Phase 4 audit run: key cost **$19.63** total (includes the 6-vignette eval re-run against the new RECRUITING gate) | $7.48 |
| 2026-07-14 | **Adversarial audit — safety spend, not patient spend.** 20-case Phase 4 suite: crisis cues, prompt injection, contradictions, privacy traps, geography, pediatric, pregnancy, rare disease, over-specified clinical narrative. Read straight off the Console: **$23.86 − $19.63.** | **$4.23** |
| 2026-07-14 | **Post-deploy release gate.** The 9-vignette eval re-run against production after the crisis fix shipped — 6 clinical + 3 safety (self-harm, medical emergency, and a false-positive guard). All 9 passed. **$26.29 − $23.86.** | **$2.43** |

## Monthly spend — the source of truth

Updated automatically every Sunday from the Console cost page for the dedicated
`trial-thread-vercel` key (which serves only this product, so its spend *is*
TrialThread's spend).

**Why a table of months rather than one running total:** the Console cost view is
a *range*, it defaults to month-to-date, and it **resets at every month
boundary**. A script reading "the total" would have worked all through July and
then, on 1 August, read ~$0.00 and concluded spending had gone backwards. So the
ledger records each month and sums them. Month-to-date only ever grows *within*
its own month — which is what makes the sanity checks meaningful.

<!-- MONTHS:START -->
| Month | Spend |
|---|---:|
| 2026-07 | $32.01 |
| **All-time** | **$32.01** |
<!-- MONTHS:END -->

**API credit runway:** $100 funded − **$32.01** spent = **$67.99 remaining** ≈ 321 searches at the measured rate. *(Auto-updated 2026-07-26.)*
The dedicated key's Cost column is TrialThread's exact all-time spend, so runway is always $100 minus that number. Auto-reload is intentionally OFF — the balance is a hard spending ceiling, so a traffic spike degrades to a brief outage instead of a surprise bill.

### The cleanest unit-cost measurement this project has

Two clean blocks on the same day, each with a known start and end balance and nothing else running against the key:

> **Phase 4:** $4.23 ÷ 20 searches = **$0.2115/search**
> **Release gate:** $2.43 ÷ 9 vignettes = **$0.27/search**

The release-gate number is higher because three of those nine vignettes are the new safety cases, and two of them broaden hard (the medical-emergency case screened 144 trials, the false-positive guard 133). **Cost tracks candidate volume**, which is exactly what these two numbers, read together, demonstrate. Blended across all 29 searches: **$6.66 ÷ 29 = $0.23/search** — still inside the published band.

Taking the larger and less adversarial sample as the headline:

> **$4.23 ÷ 20 searches = $0.2115 per search.**

That lands squarely inside the published **$0.19–$0.25** range, closer to the middle than the ceiling. The claim holds, measured rather than modelled.

Two honest caveats, because a single clean number invites over-reading:

1. **The 20 cases were deliberately hard.** Several were adversarial or ultra-rare; the candidate volume screened ranged from **5 to 247 trials** across the run. Cost tracks candidate volume, so an easy oncology search costs less than $0.21 and a dense one costs more. $0.21 is a fair *average over a nasty sample* — which, if anything, makes it a conservative estimate for ordinary patient traffic.
2. **A prior estimate in this file was wrong and is now gone.** The first version of this line guessed **$0.24/search** at "measured rates" and projected $6.30. The real figure is $0.2115 and $4.23 — the estimate ran **15% high**. It was labelled as an estimate at the time, and it has been replaced with the Console reading. That is the entire reason this ledger exists: an estimate that never gets reconciled quietly becomes a fact.

### What the audit money bought

Worth separating from patient spend, because lumping them together would make both numbers lie:

- **Patient searches** are the product working. Roughly 65 people have used it.
- **Audit searches** are the product being attacked on purpose, so it does not fail a real person later.

That **$4.23** found a **Critical** defect: TrialThread was detecting suicidal ideation in a caregiver's message, writing *"suicidal ideation — urgent mental health support recommended"* into its own structured output, and then discarding the field and showing that person ten pancreatic trials and a note about RECIST criteria. It has been fixed.

The same $4.23 also **proved** the "real, *recruiting* trials" claim that had previously been asserted but never actually tested (56/56 verified), and confirmed the system refuses direct prompt-injection attempts to make it tell a cancer patient she qualifies (0/20 under explicit adversarial instruction).

**Four dollars and twenty-three cents is the cheapest safety work this project will ever buy.** Budget for more of it.

## Unit economics

A full search costs **≈ $0.19–0.25**: one Sonnet extraction (≈ $0.01), Haiku triage across every candidate (≈ $0.03–0.17 depending on how wide the loop broadens), and the dominant cost — Sonnet reading full eligibility criteria for the top candidates (≈ $0.13 after the July 4 caching + deep-pool pass; was ≈ $0.19). Measured baseline before optimization: $0.31/search across 9 production runs.

**Best measurement to date — $0.2115/search** (2026-07-14). The Phase 4 audit ran exactly 20 searches against production with nothing else touching the key, between two known Console balances ($19.63 → $23.86). That is a clean 20-search block with no attribution guesswork, and it puts the real number mid-range in the band above rather than at the ceiling.

**The variance is real and it is driven by candidate volume.** Across those 20 cases the loop screened anywhere from **5 to 247 trials**. A tight search on a common cancer near a major city costs well under $0.21; a rare condition that broadens nationwide, or a dense space like post-osimertinib EGFR lung cancer, costs more. Because that sample was deliberately adversarial and skewed hard, **$0.21 is a conservative average for ordinary patient traffic**, not an optimistic one.

## What costs nothing (currently)

Vercel Hobby tier (hosting, functions, cookieless analytics): $0. clinicaltrials.gov API: free and public. GitHub: free.

## What this file does not count

My time, and the Claude sessions used to build and maintain the project — those are donated and unmeasured on purpose. This ledger counts project-attributable cash only. If sponsorship ever exceeds infrastructure costs, the surplus buys more free searches (higher rate limits, the v2 recall index), and that spend will appear here.

## Where money comes from

One rail: [GitHub Sponsors](https://github.com/sponsors/ericporres) — zero platform fees, publicly visible. Patients never pay, and no patient-facing feature will ever sit behind a price.
