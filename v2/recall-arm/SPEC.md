# SPEC — Semantic Recall Arm (v2)

Status: **scaffolding — not built.** This folder is a bounded, testable specification plus typed stubs. Nothing here runs in production until the eval gate below passes.

## Problem

The v1 loop finds only what a broadening rung thinks to query. clinicaltrials.gov keyword search misses trials whose eligibility criteria describe a patient in words unlike the diagnosis — basket trials titled by mechanism, criteria phrased by biomarker pathway, trials indexed under parent conditions the extraction didn't ladder to. That recall gap is the one place v1 is architecturally weaker than a pre-embedded index (see README, "How it works").

## Design

Nightly ingest of **RECRUITING studies only** (~30–60K; completed trials are noise for this product):

1. **Ingest** (`ingest.mjs`, nightly): page ctgov v2 for RECRUITING studies changed since the last run; upsert metadata.
2. **Archetype synthesis** (the load-bearing trick): for each new/changed trial, a fast model writes a ~120-word **"who this trial wants"** patient archetype — condition, stage, required biomarkers, prior-treatment posture, key exclusions — in the same plain register the patient extraction produces. We embed the archetype, **not raw criteria text**, because criteria prose embeds requirement and exclusion almost identically; the archetype normalizes both sides of the match into one dialect.
3. **Embed** via Voyage (1024-dim), store in Postgres + pgvector, HNSW index (`schema.sql`).
4. **Query side** (`retrieve.ts`): embed the patient profile rendered in the same archetype register → KNN top-50 → Voyage rerank-2.5 against the profile → return NCT IDs.
5. **Hybrid-RRF**: fuse the semantic candidates with the live ctgov keyword arm's results (reciprocal rank fusion), exactly the dense+lexical lesson from the deep-memory v3 eval (semantic 84→88%, lexical 70→87% hit@10 after hybrid).
6. **Integration**: the fused candidate set enters the EXISTING pipeline as **one more broadening rung** in `lib/loop.ts` — after the basket-hunt rung, before giving up. Candidates get the same Haiku triage and Sonnet deep parse as everything else.

## The boundary that must not move

**Embeddings retrieve; they never rank verdicts.** Eligibility remains a constraint-satisfaction judgment made by the deep parse reading full criteria. Any PR that lets vector distance influence a verdict, or that skips triage/deep-parse for semantic candidates, is out of spec.

## Non-goals

No stored patient data (profiles are embedded transiently at query time, never persisted — the statelessness promise survives v2 intact). No re-ranking of v1 results by similarity. No ingest of non-recruiting studies. No replacement of the live keyword arm — freshness stays anchored to the live API; the index tolerates ≤24h staleness only for *additional* recall, and any semantic candidate is re-verified as still RECRUITING via the live API before display.

## Eval gate (ships only if)

Extend `eval/vignettes.json` with ≥4 recall-hard vignettes (conditions whose best trials are basket/mechanism-titled). The arm ships only when, against production+arm vs production alone: (a) recall-hard vignettes surface ≥1 additional strong/uncertain match with a live NCT ID, (b) the original 6 vignettes show zero regression, (c) added p50 latency ≤10s, (d) zero hallucinated IDs, as always. Deprescribe by eval, not by vibes.

## Cost & ops envelope

One-time backfill: ~45K archetypes ≈ $25–40 (Haiku) + Voyage embedding ≈ $5. Nightly delta: a few hundred changed studies ≈ pennies. Query-side: one embed + one rerank ≈ <$0.01/search. Runs as a scheduled job (Mac Studio cron or GitHub Actions); Supabase free tier holds 45K×1024-dim comfortably.

## Open questions

1. Voyage model pin (voyage-4-large vs lighter) — decide by eval, not habit.
2. Rerank threshold below which the semantic arm contributes nothing (avoid polluting triage with noise).
3. Whether the archetype prompt needs oncology-specific and non-oncology variants.
