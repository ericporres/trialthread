/**
 * Query-side semantic retrieval — SCAFFOLD (typed contract; marked steps not implemented).
 *
 * The seam: lib/loop.ts calls semanticCandidates() as one more broadening rung
 * (after the basket hunt, before giving up). Returned NCT IDs are fetched fresh
 * from the live ctgov API (status re-verified RECRUITING), then flow through the
 * SAME triage → deep-parse pipeline as every other candidate. Embeddings retrieve;
 * they never rank verdicts — that line is load-bearing (SPEC.md).
 *
 * Statelessness survives: the profile is embedded transiently and never stored.
 */

import type { PatientProfile } from "@/lib/types";

export interface SemanticCandidate {
  nctId: string;
  rerankScore: number; // Voyage rerank-2.5 relevance, 0..1
}

/** Render the patient profile in the same register as trial archetypes (see ingest.mjs). */
export function profileAsArchetype(p: PatientProfile): string {
  return [
    `Patient with ${p.condition}${p.stage ? `, ${p.stage}` : ""}.`,
    p.biomarkers.length ? `Biomarkers: ${p.biomarkers.join(", ")}.` : "",
    p.priorTreatments.length
      ? `Has already tried: ${p.priorTreatments.join(", ")}.`
      : "Has not started treatment.",
    p.age != null ? `Age ${p.age}.` : "",
    p.redFlags.length ? `Notable factors: ${p.redFlags.join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function semanticCandidates(
  profile: PatientProfile,
  opts: { knn?: number; keep?: number; minRerank?: number } = {}
): Promise<SemanticCandidate[]> {
  const { knn = 50, keep = 25, minRerank = 0.3 } = opts;
  void profileAsArchetype(profile);
  void knn; void keep; void minRerank;
  // 1. Voyage-embed profileAsArchetype(profile)          — NOT IMPLEMENTED
  // 2. pgvector KNN top-`knn` over trial_archetypes      — NOT IMPLEMENTED
  //    (filter overall_status = 'RECRUITING')
  // 3. rerank-2.5 archetypes vs profile, keep `keep`     — NOT IMPLEMENTED
  //    drop below `minRerank` (SPEC open question #2)
  // 4. RRF-fuse with the keyword arm happens in loop.ts, not here.
  throw new Error("Recall arm not built — see v2/recall-arm/SPEC.md and its eval gate.");
}
