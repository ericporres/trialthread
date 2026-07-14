// ---------- Patient ----------

/**
 * A safety signal about the PERSON, not about the trial.
 *
 * This exists because of a Critical finding in the July 2026 adversarial audit.
 * A synthetic caregiver wrote "I have been thinking about ending my life once
 * she is gone." The extractor NOTICED — it wrote "suicidal ideation - urgent
 * mental health support recommended" into `otherFactors` — and then the pipeline
 * threw the field away, ran a normal 69-second search, and showed that person
 * ten pancreatic trials and a note about RECIST criteria. Nothing else.
 *
 * The reason was structural: `redFlags` and `otherFactors` serve TRIAL SCREENING.
 * So urgency only ever reached the user when it happened to also be an
 * eligibility problem (uncontrolled bleeding surfaced, because you cannot
 * consent while bleeding; suicidal ideation did not, because it does not affect
 * enrollment). When the emergency was about the person rather than the trial,
 * it vanished.
 *
 * `urgent` is a separate channel with exactly one job: get a human being help.
 * It must never be merged back into the eligibility fields.
 */
export type UrgentKind = "medical_emergency" | "self_harm";

export interface UrgentConcern {
  kind: UrgentKind;
  detail: string; // one short factual sentence. No advice, no diagnosis.
}

export interface PatientProfile {
  condition: string;              // canonical condition, e.g. "HER2-positive metastatic breast cancer"
  conditionSearchTerms: string[]; // ordered ctgov query.cond candidates, narrow → broad
  biomarkers: string[];           // e.g. ["HER2-positive", "ER-negative"]
  stage: string | null;           // e.g. "metastatic", "stage III"
  priorTreatments: string[];      // e.g. ["trastuzumab", "chemotherapy (taxane)"]
  age: number | null;
  sex: "male" | "female" | null;
  location: {
    label: string;                // "White Plains, NY"
    lat: number;
    lon: number;
  } | null;
  otherFactors: string[];         // ECOG, comorbidities, contraindications, brain mets, etc.
  redFlags: string[];             // facts likely to exclude (for honest caution display)
  urgent: UrgentConcern[];        // SAFETY. Not eligibility. See UrgentConcern above.
}

// ---------- Trials ----------

export interface TrialSite {
  facility: string;
  city: string;
  state: string;
  country: string;
  status: string | null;
  lat: number | null;
  lon: number | null;
  distanceMi: number | null;
}

export interface Trial {
  nctId: string;
  title: string;
  officialTitle: string | null;
  status: string;
  phases: string[];
  studyType: string | null;
  conditions: string[];
  interventions: string[];
  briefSummary: string | null;
  eligibilityCriteria: string | null;
  sex: string | null;
  minimumAge: string | null;
  maximumAge: string | null;
  lastUpdated: string | null;
  centralContacts: { name: string | null; phone: string | null; email: string | null }[];
  sites: TrialSite[];
  nearestSite: TrialSite | null;
  url: string;
}

// ---------- Scoring ----------

export interface TriageResult {
  nctId: string;
  score: number; // 0-100
  flag: "strong" | "possible" | "unlikely";
  reason: string;
}

export type Verdict = "likely-eligible" | "uncertain" | "likely-ineligible";

export interface DeepScore {
  nctId: string;
  verdict: Verdict;
  plainSummary: string;          // 2 sentences, plain language: what this trial is
  matchPoints: string[];         // grounded: criterion ↔ patient fact
  concerns: string[];            // possible exclusions / unknowns, phrased for the patient
  questionsForDoctor: string[];  // 2-3 specific questions
}

export interface RankedMatch {
  trial: Trial;
  triage: TriageResult;
  deep: DeepScore;
  rank: number;
}

// ---------- Streaming protocol ----------

export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "profile"; profile: PatientProfile }
  // Emitted IMMEDIATELY after extraction and BEFORE the search begins, so the
  // person sees it while the spinner is still turning — not 90 seconds later,
  // underneath ten trials. Ordering is the whole point of this event.
  | { type: "safety"; urgent: UrgentConcern[] }
  | { type: "pass"; pass: number; label: string; found: number; scored: number; strong: number }
  | { type: "broaden"; strategy: string }
  | { type: "results"; matches: RankedMatch[]; totalConsidered: number; passes: number }
  | { type: "error"; message: string; stage?: string };
