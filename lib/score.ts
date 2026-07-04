import { askJson, MODELS, MOCK, pool, safeErr } from "./anthropic";
import type { DeepScore, PatientProfile, Trial, TriageResult } from "./types";

function profileSummary(p: PatientProfile): string {
  return [
    `Condition: ${p.condition}${p.stage ? ` (${p.stage})` : ""}`,
    p.biomarkers.length ? `Biomarkers: ${p.biomarkers.join(", ")}` : null,
    p.priorTreatments.length ? `Prior treatments: ${p.priorTreatments.join(", ")}` : null,
    p.age != null ? `Age: ${p.age}` : null,
    p.sex ? `Sex: ${p.sex}` : null,
    p.otherFactors.length ? `Other: ${p.otherFactors.join(", ")}` : null,
    p.redFlags.length ? `Possible exclusion factors: ${p.redFlags.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------- Triage (fast pass, batched) ----------

const TRIAGE_SYSTEM = `You are the fast triage stage of TrialThread, screening clinical trials for one patient. For each trial, judge how plausibly the patient could qualify, using the trial's condition list, phase, interventions, and eligibility criteria excerpt.

Scoring:
- "strong" (score 70-100): condition and key biomarkers/stage line up; no obvious disqualifier.
- "possible" (score 35-69): plausible but at least one meaningful uncertainty.
- "unlikely" (score 0-34): wrong population, wrong disease/subtype, an explicit exclusion the patient clearly hits, healthy-volunteer study, or observational study with no relevance.

Be strict about explicit mismatches (sex, age bounds, required biomarker the patient lacks, required prior therapy the patient hasn't had). Do not reward vague relevance.

Return ONLY a JSON array: [{"nctId": string, "score": number, "flag": "strong"|"possible"|"unlikely", "reason": string (≤120 chars)}] — one entry per trial, same order.`;

function triageBatchPrompt(profile: PatientProfile, trials: Trial[]): string {
  const items = trials
    .map((t, i) => {
      const crit = (t.eligibilityCriteria ?? "").slice(0, 2200);
      return `--- Trial ${i + 1} ---
nctId: ${t.nctId}
Title: ${t.title}
Phase: ${t.phases.join(", ") || "N/A"} | Type: ${t.studyType ?? "?"}
Conditions: ${t.conditions.slice(0, 6).join("; ")}
Interventions: ${t.interventions.slice(0, 5).join("; ")}
Sex: ${t.sex ?? "ALL"} | Age: ${t.minimumAge ?? "?"}–${t.maximumAge ?? "?"}
Eligibility (excerpt):
${crit}`;
    })
    .join("\n\n");

  return `PATIENT\n${profileSummary(profile)}\n\nTRIALS\n${items}\n\nReturn the JSON array now.`;
}

export async function triageTrials(
  profile: PatientProfile,
  trials: Trial[]
): Promise<TriageResult[]> {
  if (MOCK) {
    return trials.map((t, i) => ({
      nctId: t.nctId,
      score: Math.max(5, 95 - i * 7),
      flag: i < 4 ? "strong" : i < 10 ? "possible" : "unlikely",
      reason: "Mock triage result",
    }));
  }

  const BATCH = 12;
  const batches: Trial[][] = [];
  for (let i = 0; i < trials.length; i += BATCH) batches.push(trials.slice(i, i + BATCH));

  const perBatch = await pool(batches, 5, async (batch) => {
    try {
      const res = await askJson<TriageResult[]>({
        model: MODELS.triage,
        system: TRIAGE_SYSTEM,
        user: triageBatchPrompt(profile, batch),
        maxTokens: 1600,
      });
      // Keep only entries we can attribute to a real trial in this batch.
      const valid = new Set(batch.map((t) => t.nctId));
      return res.filter((r) => valid.has(r.nctId));
    } catch (e) {
      // A failed batch degrades to "possible" so trials aren't silently lost.
      console.error("tt_search_error", "triage", safeErr(e));
      return batch.map((t) => ({
        nctId: t.nctId,
        score: 40,
        flag: "possible" as const,
        reason: "Triage unavailable for this batch",
      }));
    }
  });

  return perBatch.flat();
}

// ---------- Deep scoring (top candidates, individual) ----------

const DEEP_SYSTEM = `You are the eligibility analysis stage of TrialThread. You compare ONE patient profile against ONE clinical trial's full eligibility criteria and explain the fit in plain language a worried non-doctor can understand (8th-grade reading level, no jargon without a gloss).

Hard rules:
- Ground every claim in the actual criteria text or the patient's stated facts. Never invent criteria or patient facts.
- You are not giving medical advice and you cannot determine eligibility — only the trial team can. Your verdict is a research-quality screen, and your language must reflect that ("appears to", "may").
- matchPoints: criteria the patient appears to MEET, each pairing the criterion with the patient fact. Format: "Requires X — you reported Y."
- concerns: criteria the patient may FAIL or that are UNKNOWN from their description. Unknowns phrased as what to check, not as failures.
- questionsForDoctor: 2-3 specific, useful questions this person should ask their care team about this trial.
- verdict: "likely-eligible" only when the major inclusion criteria are affirmatively matched and no stated exclusion applies. "uncertain" when key facts are missing. "likely-ineligible" when a stated fact appears to hit an exclusion — say which one, kindly.
- Language rule: never write "you qualify," "you are eligible," or "you meet the criteria" in ANY construction, including questions and "whether you qualify" phrasings. Say "appears to match," "may fit," or "the study team decides eligibility" instead.

Return ONLY JSON:
{"nctId": string, "verdict": "likely-eligible"|"uncertain"|"likely-ineligible", "plainSummary": string (2 sentences: what the trial tests and for whom), "matchPoints": string[], "concerns": string[], "questionsForDoctor": string[]}

Worked example 1 — patient: 62-year-old man, stage IV colorectal cancer, KRAS G12C mutation, prior FOLFOX, lives near Denver. Trial requires: KRAS G12C-mutated advanced solid tumor, ≥1 prior systemic therapy, ECOG 0-1, no active brain metastases, adequate organ function.
{"nctId": "NCT00000001", "verdict": "likely-eligible", "plainSummary": "This study tests a pill that targets the exact KRAS G12C mutation found in some colorectal cancers. It is for people whose cancer has spread and who have already tried at least one treatment.", "matchPoints": ["Requires a KRAS G12C mutation — you reported KRAS G12C.", "Requires at least one prior treatment — you received FOLFOX chemotherapy.", "Open to advanced solid tumors including colorectal cancer — matching your diagnosis."], "concerns": ["Requires good daily functioning (ECOG 0-1) — not stated in your description.", "Requires recent blood work showing adequate liver and kidney function — worth confirming.", "Excludes active brain metastases — your scans would need to confirm this."], "questionsForDoctor": ["Is my ECOG performance status 0 or 1?", "Are my liver and kidney labs recent enough to qualify for screening?"]}

Worked example 2 — patient: 55-year-old woman, relapsed ovarian cancer, BRCA-negative, prior olaparib (a PARP inhibitor). Trial requires: platinum-sensitive recurrence, PARP inhibitor-naive.
{"nctId": "NCT00000002", "verdict": "likely-ineligible", "plainSummary": "This study compares a new drug combination for ovarian cancer that has come back after responding to platinum chemotherapy. It is designed for people who have never taken a PARP inhibitor.", "matchPoints": ["For recurrent ovarian cancer — matching your diagnosis."], "concerns": ["The study excludes people who have already taken a PARP inhibitor — you reported prior olaparib, which is a PARP inhibitor. This appears to rule this trial out.", "If your recurrence was not platinum-sensitive, that would also be a barrier."], "questionsForDoctor": ["Given my prior olaparib, are there trials designed specifically for after PARP inhibitors?"]}

Match that structure, tone, and honesty exactly.`;

// Marked cacheable: this block now exceeds the 1024-token Sonnet caching minimum,
// so all deep calls in a search (and across searches within the 5-min TTL under
// traffic) read it at 0.1x price instead of paying full input cost every call.
const DEEP_SYSTEM_BLOCKS = [
  { type: "text" as const, text: DEEP_SYSTEM, cache_control: { type: "ephemeral" as const } },
];

export async function deepScore(
  profile: PatientProfile,
  trials: Trial[]
): Promise<DeepScore[]> {
  if (MOCK) {
    return trials.map((t, i) => ({
      nctId: t.nctId,
      verdict: i < 3 ? "likely-eligible" : i < 6 ? "uncertain" : "likely-ineligible",
      plainSummary: `This study tests ${t.interventions[0] ?? "a new treatment"} for people with ${t.conditions[0] ?? "this condition"}. It is currently recruiting.`,
      matchPoints: ["Requires HER2-positive disease — you reported HER2-positive."],
      concerns: ["Requires recent heart function test (LVEF) — not stated in your description."],
      questionsForDoctor: ["Is my heart function (LVEF) recent enough to qualify?"],
    }));
  }

  return pool(trials, 4, async (t) => {
    try {
      return await askJson<DeepScore>({
        model: MODELS.deep,
        system: DEEP_SYSTEM_BLOCKS,
        user: `PATIENT\n${profileSummary(profile)}\n\nTRIAL ${t.nctId}: ${t.title}
Phase: ${t.phases.join(", ") || "N/A"}
Conditions: ${t.conditions.join("; ")}
Interventions: ${t.interventions.join("; ")}
Sex: ${t.sex ?? "ALL"} | Age: ${t.minimumAge ?? "?"}–${t.maximumAge ?? "?"}
Brief summary: ${(t.briefSummary ?? "").slice(0, 1200)}

FULL ELIGIBILITY CRITERIA:
${(t.eligibilityCriteria ?? "Not provided").slice(0, 9000)}

Return the JSON now.`,
        maxTokens: 1400,
      });
    } catch (e) {
      console.error("tt_search_error", "deep", safeErr(e));
      return {
        nctId: t.nctId,
        verdict: "uncertain" as const,
        plainSummary: "We could not complete a detailed analysis of this trial. The link below goes to the full official listing.",
        matchPoints: [],
        concerns: ["Automated analysis failed — review the official criteria directly."],
        questionsForDoctor: ["Could you review this trial's criteria with me?"],
      };
    }
  });
}
