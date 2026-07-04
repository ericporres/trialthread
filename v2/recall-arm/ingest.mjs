#!/usr/bin/env node
/**
 * Nightly ingest — RECRUITING studies → archetypes → embeddings → pgvector.
 * STATUS: SCAFFOLD. Structure and contracts are real; the marked steps are not implemented.
 * Run order: schema.sql applied → backfill (no --since) → nightly with --since.
 *
 * Env: DATABASE_URL, VOYAGE_API_KEY, ANTHROPIC_API_KEY
 * Usage: node v2/recall-arm/ingest.mjs [--since YYYY-MM-DD] [--limit N]
 */

const CTGOV = "https://clinicaltrials.gov/api/v2/studies";

const ARCHETYPE_SYSTEM = `You write a "who this trial wants" patient archetype from a clinical trial's eligibility criteria. One paragraph, ~120 words, plain language, same register a patient or caregiver would use to describe themselves: the condition and stage this trial is for, required biomarkers or mutations, where the patient should be in their treatment journey (untreated, after first-line, after specific drugs), and the two or three exclusions most likely to rule someone out. State requirements affirmatively ("has tried at least one..."), exclusions as "has not / does not". No trial jargon, no NCT numbers, no hedging.`;

async function* recruitingStudies(since, limit) {
  // Pages ctgov v2: filter.overallStatus=RECRUITING, fields: identification,
  // status (lastUpdatePostDateStruct), conditions, design.phases, eligibility.
  // With `since`, add filter on lastUpdatePostDate to pull the nightly delta only.
  // NOT IMPLEMENTED — see lib/ctgov.ts for the field map to reuse.
  throw new Error("NOT IMPLEMENTED: ctgov pager (reuse FIELDS from lib/ctgov.ts, add pageToken loop)");
}

async function synthesizeArchetype(study) {
  // Haiku call: ARCHETYPE_SYSTEM + title/conditions/phases/full criteria → ~120 words.
  // Batch 10/call like lib/score.ts triage to keep the backfill ~$25-40.
  throw new Error("NOT IMPLEMENTED: archetype synthesis (mirror askJson pattern from lib/anthropic.ts)");
}

async function embedBatch(texts) {
  // Voyage embeddings, 1024-dim, batched ≤128 inputs/call with backoff —
  // lift the batch/rate-limit handling from deep-memory v3 ingest.py.
  throw new Error("NOT IMPLEMENTED: Voyage embed batch");
}

async function upsert(rows) {
  // INSERT ... ON CONFLICT (nct_id) DO UPDATE — idempotent, resumable.
  // Also: flip overall_status for studies that left RECRUITING (delta reconciliation).
  throw new Error("NOT IMPLEMENTED: pg upsert");
}

// main(): pager → synth → embed → upsert, with a run summary line
// (studies seen / archetypes written / $ spent) for the ops log.
console.error("SCAFFOLD ONLY — see SPEC.md. Nothing was ingested.");
process.exit(1);
