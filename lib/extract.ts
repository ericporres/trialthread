import { askJson, MODELS, MOCK } from "./anthropic";
import type { PatientProfile } from "./types";

const SYSTEM = `You are a medical information extraction system inside TrialThread, a tool that helps people find clinical trials listed on clinicaltrials.gov. You convert a person's free-text description of their (or a loved one's) medical situation into a structured profile used to search for trials.

Rules:
- Extract only what is stated or directly implied. Never invent facts. Missing fields are null or [].
- conditionSearchTerms: 3-5 search terms for clinicaltrials.gov "condition" search, ordered narrow → broad. Start with the most specific form of the condition, end with the broad disease family. Example for HER2+ metastatic breast cancer: ["HER2-positive metastatic breast cancer", "HER2-positive breast cancer", "metastatic breast cancer", "breast cancer"].
- biomarkers: molecular/receptor markers as commonly written in trial criteria (HER2-positive, EGFR mutation, PD-L1 ≥50%, BRCA1, KRAS G12C...).
- location: if a place is given, produce approximate city-center coordinates for it. If only a region is given, use its principal city. If no location, null.
- redFlags: stated facts that commonly EXCLUDE patients from trials (e.g., brain metastases, prior specific drug, organ dysfunction, pregnancy). Be honest — these help the person avoid wasted hope.
- If the text contains no recognizable medical condition, return {"error": "no_condition"} instead of a profile.

Return ONLY a JSON object matching the PatientProfile schema. No prose.`;

const MOCK_PROFILE: PatientProfile = {
  condition: "HER2-positive metastatic breast cancer",
  conditionSearchTerms: [
    "HER2-positive metastatic breast cancer",
    "HER2-positive breast cancer",
    "metastatic breast cancer",
    "breast cancer",
  ],
  biomarkers: ["HER2-positive", "ER-negative"],
  stage: "metastatic",
  priorTreatments: ["trastuzumab", "taxane chemotherapy"],
  age: 58,
  sex: "female",
  location: { label: "White Plains, NY", lat: 41.034, lon: -73.7629 },
  otherFactors: ["good performance status"],
  redFlags: [],
};

export async function extractProfile(text: string): Promise<PatientProfile> {
  if (MOCK) return MOCK_PROFILE;

  const result = await askJson<PatientProfile | { error: string }>({
    model: MODELS.extract,
    system: SYSTEM,
    user: `Patient description:\n\n"""${text.slice(0, 6000)}"""\n\nReturn the PatientProfile JSON:
{
  "condition": string,
  "conditionSearchTerms": string[],
  "biomarkers": string[],
  "stage": string | null,
  "priorTreatments": string[],
  "age": number | null,
  "sex": "male" | "female" | null,
  "location": { "label": string, "lat": number, "lon": number } | null,
  "otherFactors": string[],
  "redFlags": string[]
}`,
    maxTokens: 1200,
  });

  if ("error" in result) {
    throw new Error("NO_CONDITION");
  }

  // Defensive validation of LLM-geocoded coordinates.
  if (result.location) {
    const { lat, lon } = result.location;
    if (
      typeof lat !== "number" ||
      typeof lon !== "number" ||
      Math.abs(lat) > 90 ||
      Math.abs(lon) > 180
    ) {
      result.location = null;
    }
  }
  if (!Array.isArray(result.conditionSearchTerms) || result.conditionSearchTerms.length === 0) {
    result.conditionSearchTerms = [result.condition];
  }

  return result;
}
