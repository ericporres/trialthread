import { askJson, MODELS, MOCK } from "./anthropic";
import type { PatientProfile, UrgentConcern } from "./types";

const SYSTEM = `You are a medical information extraction system inside TrialThread, a tool that helps people find clinical trials listed on clinicaltrials.gov. You convert a person's free-text description of their (or a loved one's) medical situation into a structured profile used to search for trials.

Rules:
- Extract only what is stated or directly implied. Never invent facts. Missing fields are null or [].
- conditionSearchTerms: 3-5 search terms for clinicaltrials.gov "condition" search, ordered narrow → broad. Start with the most specific form of the condition, end with the broad disease family. Example for HER2+ metastatic breast cancer: ["HER2-positive metastatic breast cancer", "HER2-positive breast cancer", "metastatic breast cancer", "breast cancer"].
- biomarkers: molecular/receptor markers as commonly written in trial criteria (HER2-positive, EGFR mutation, PD-L1 ≥50%, BRCA1, KRAS G12C...).
- location: if a place is given, produce approximate city-center coordinates for it. If only a region is given, use its principal city. If no location, null.
- redFlags: stated facts that commonly EXCLUDE patients from trials (e.g., brain metastases, prior specific drug, organ dysfunction, pregnancy). Be honest — these help the person avoid wasted hope.

- urgent: A SAFETY FIELD. It has NOTHING to do with trial eligibility, and it is not a place for eligibility concerns. Its only job is to notice that a human being needs help right now. Populate it — regardless of whether the fact affects any trial — when the text describes either of:

  * kind "medical_emergency": signs of an acute medical emergency in the person described. For example: cannot breathe or severe difficulty breathing; turning blue, cyanosis, grey; bleeding that will not stop; sudden confusion, unresponsiveness, or collapse; chest pain; signs of stroke; a seizure; a suspected overdose; a fever with a very low white count in someone on chemotherapy.

  * kind "self_harm": the writer, OR the person they are describing, expresses suicidal thoughts, an intent or plan to end their life, self-harm, or hopelessness that reads as wanting to die. THIS APPLIES TO THE CAREGIVER WRITING THE MESSAGE JUST AS MUCH AS TO THE PATIENT — a exhausted family member saying they cannot go on is exactly the case this field exists for.

  detail: one short, factual sentence naming what was said. No advice, no diagnosis, no reassurance.

  Default to []. Do NOT populate this for ordinary fear, grief, sadness, exhaustion, anger, or frustration. Those feelings are normal and expected here, and flagging them would be patronising and would make the real signal useless. Populate it only for an actual emergency, or an actual expression of wanting to die.

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
  urgent: [],
};

/**
 * MOCK ONLY — a crude keyword trigger so the crisis banner can be exercised
 * end-to-end locally (TRIALTHREAD_MOCK=1) without an API key and without
 * spending inference on it.
 *
 * This is NOT the production path and must never become it. Production uses the
 * model, which understands "I cannot go on" and "I don't want to be here
 * anymore" — phrasings no keyword list will ever catch. Keyword matching for
 * suicidality is exactly the kind of brittle safety theatre that fails the
 * person it was built for.
 */
function mockUrgent(text: string): UrgentConcern[] {
  const urgent: UrgentConcern[] = [];
  if (/\b(end(ing)? my life|kill myself|take my own life|suicid|don'?t want to (be here|live))\b/i.test(text)) {
    urgent.push({ kind: "self_harm", detail: "The message describes thoughts of ending their life." });
  }
  if (/\b(can'?t breathe|cannot breathe|turning blue|lips are blue|blue lips|bleeding.*(will not|won'?t) stop|unresponsive|collapsed)\b/i.test(text)) {
    urgent.push({ kind: "medical_emergency", detail: "The message describes what sounds like an acute medical emergency." });
  }
  return urgent;
}

export async function extractProfile(text: string): Promise<PatientProfile> {
  if (MOCK) return { ...MOCK_PROFILE, urgent: mockUrgent(text) };

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
  "redFlags": string[],
  "urgent": { "kind": "medical_emergency" | "self_harm", "detail": string }[]
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

  // Safety field must always be a well-formed array — a malformed `urgent` from
  // the model must degrade to "no signal", never to a crash that would take the
  // whole search (and the banner) down with it.
  result.urgent = Array.isArray(result.urgent)
    ? result.urgent.filter(
        (u): u is UrgentConcern =>
          !!u &&
          (u.kind === "medical_emergency" || u.kind === "self_harm") &&
          typeof u.detail === "string"
      )
    : [];

  return result;
}
