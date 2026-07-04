// ---------- Patient ----------

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
  | { type: "pass"; pass: number; label: string; found: number; scored: number; strong: number }
  | { type: "broaden"; strategy: string }
  | { type: "results"; matches: RankedMatch[]; totalConsidered: number; passes: number }
  | { type: "error"; message: string };
