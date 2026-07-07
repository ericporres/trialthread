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

**API credit runway:** $100 funded − $12.15 spent = **$87.85 remaining** ≈ 350–460 searches at current rates. The dedicated key's Cost column is TrialThread's exact all-time spend, so runway is always $100 minus that number. Auto-reload is intentionally OFF — the balance is a hard spending ceiling, so a traffic spike degrades to a brief outage instead of a surprise bill.

## Unit economics

A full search costs **≈ $0.19–0.25**: one Sonnet extraction (≈ $0.01), Haiku triage across every candidate (≈ $0.03–0.17 depending on how wide the loop broadens), and the dominant cost — Sonnet reading full eligibility criteria for the top candidates (≈ $0.13 after the July 4 caching + deep-pool pass; was ≈ $0.19). Measured baseline before optimization: $0.31/search across 9 production runs.

## What costs nothing (currently)

Vercel Hobby tier (hosting, functions, cookieless analytics): $0. clinicaltrials.gov API: free and public. GitHub: free.

## What this file does not count

My time, and the Claude sessions used to build and maintain the project — those are donated and unmeasured on purpose. This ledger counts project-attributable cash only. If sponsorship ever exceeds infrastructure costs, the surplus buys more free searches (higher rate limits, the v2 recall index), and that spend will appear here.

## Where money comes from

One rail: [GitHub Sponsors](https://github.com/sponsors/ericporres) — zero platform fees, publicly visible. Patients never pay, and no patient-facing feature will ever sit behind a price.
