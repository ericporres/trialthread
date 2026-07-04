import { safeErr } from "./anthropic";
import { dedupeTrials, searchTrials } from "./ctgov";
import { deepScore, triageTrials } from "./score";
import type { PatientProfile, RankedMatch, StreamEvent, Trial, TriageResult } from "./types";

const MAX_PASSES = 3;
const STRONG_TARGET = 5;      // stop broadening once we have this many strong candidates
const DEEP_LIMIT = 10;        // trials that get the full eligibility parse (= display limit; was 12)
const DEEP_FLOOR = 6;         // always deep-parse at least this many, even if triage is bearish
const RESULTS_LIMIT = 10;
const PER_PASS_CAP = 120;     // trials per search pass sent to triage

interface PassPlan {
  label: string;
  cond?: string;
  term?: string;
  geo: { lat: number; lon: number; radiusMi: number } | null;
  statuses: string[];
}

/**
 * The Karpathy loop: search → score → assess coverage → broaden → repeat.
 * Broadening ladder, applied one rung per pass after pass 1:
 *   1. widen geography (100mi → 300mi → national)
 *   2. broaden condition terms (narrow subtype → parent disease)
 *   3. biomarker basket hunt (biomarker as term over advanced solid tumors)
 */
export async function* runMatchLoop(
  profile: PatientProfile
): AsyncGenerator<StreamEvent, void, unknown> {
  const geoBase = profile.location
    ? { lat: profile.location.lat, lon: profile.location.lon }
    : null;

  const plans: PassPlan[] = [];
  const executed: string[] = [];

  // Pass 1: most specific condition term, close to home.
  plans.push({
    label: geoBase
      ? `${profile.conditionSearchTerms[0]} within 100 mi of ${profile.location!.label}`
      : `${profile.conditionSearchTerms[0]} (nationwide)`,
    cond: profile.conditionSearchTerms[0],
    geo: geoBase ? { ...geoBase, radiusMi: 100 } : null,
    statuses: ["RECRUITING"],
  });

  let allTrials: Trial[] = [];
  let allTriage = new Map<string, TriageResult>();
  let pass = 0;

  while (pass < MAX_PASSES) {
    const plan = plans.shift();
    if (!plan) break;
    pass++;

    yield { type: "status", message: `Pass ${pass}: searching — ${plan.label}` };

    let found: Trial[] = [];
    try {
      found = await searchTrials({
        cond: plan.cond,
        term: plan.term,
        geo: plan.geo,
        statuses: plan.statuses,
        pageSize: PER_PASS_CAP,
      });
    } catch (e) {
      console.error("tt_search_error", "ctgov", safeErr(e));
      yield {
        type: "status",
        message: "clinicaltrials.gov hiccuped on this pass — continuing with what we have",
      };
    }
    executed.push(plan.label);

    const fresh = dedupeTrials(found).filter(
      (t) => !allTriage.has(t.nctId) && t.eligibilityCriteria
    );
    allTrials = dedupeTrials([...allTrials, ...fresh]);

    if (fresh.length > 0) {
      yield {
        type: "status",
        message: `Pass ${pass}: ${fresh.length} new trials found — screening eligibility`,
      };
      const triaged = await triageTrials(profile, fresh);
      for (const t of triaged) allTriage.set(t.nctId, t);
    }

    const strong = [...allTriage.values()].filter((t) => t.flag === "strong").length;
    yield {
      type: "pass",
      pass,
      label: plan.label,
      found: fresh.length,
      scored: allTriage.size,
      strong,
    };

    if (strong >= STRONG_TARGET || pass >= MAX_PASSES) break;

    // Decide the next broadening rung.
    const nextPlan = nextBroadening(profile, executed, geoBase);
    if (!nextPlan) break;
    yield { type: "broaden", strategy: nextPlan.label };
    plans.push(nextPlan);
  }

  // Rank by triage, deep-parse the top candidates.
  // Cost discipline: don't pay the deep parse to confirm triage's "unlikely" —
  // unless the pool is so thin we'd show too little (DEEP_FLOOR).
  const rankedAll = [...allTriage.values()].sort((a, b) => b.score - a.score);
  const promising = rankedAll.filter((r) => r.flag !== "unlikely");
  const ranked = (promising.length >= DEEP_FLOOR ? promising : rankedAll).slice(0, DEEP_LIMIT);
  const rankedTrials = ranked
    .map((r) => allTrials.find((t) => t.nctId === r.nctId))
    .filter((t): t is Trial => Boolean(t));

  if (rankedTrials.length === 0) {
    yield { type: "results", matches: [], totalConsidered: allTriage.size, passes: pass };
    return;
  }

  yield {
    type: "status",
    message: `Reading full eligibility criteria for the top ${rankedTrials.length} candidates`,
  };

  const deep = await deepScore(profile, rankedTrials);
  const deepMap = new Map(deep.map((d) => [d.nctId, d]));

  const verdictWeight = { "likely-eligible": 2, uncertain: 1, "likely-ineligible": 0 } as const;

  const matches: RankedMatch[] = rankedTrials
    .map((trial) => ({
      trial,
      triage: allTriage.get(trial.nctId)!,
      deep: deepMap.get(trial.nctId)!,
      rank: 0,
    }))
    .filter((m) => m.deep)
    .sort((a, b) => {
      const v = verdictWeight[b.deep.verdict] - verdictWeight[a.deep.verdict];
      if (v !== 0) return v;
      const s = b.triage.score - a.triage.score;
      if (s !== 0) return s;
      const da = a.trial.nearestSite?.distanceMi ?? 99999;
      const db = b.trial.nearestSite?.distanceMi ?? 99999;
      return da - db;
    })
    .slice(0, RESULTS_LIMIT)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  yield { type: "results", matches, totalConsidered: allTriage.size, passes: pass };
}

function nextBroadening(
  profile: PatientProfile,
  executed: string[],
  geoBase: { lat: number; lon: number } | null
): PassPlan | null {
  const tried = executed.join(" | ");

  // Rung 1: widen geography.
  if (geoBase && !tried.includes("300 mi")) {
    return {
      label: `${profile.conditionSearchTerms[0]} within 300 mi of ${profile.location!.label}`,
      cond: profile.conditionSearchTerms[0],
      geo: { ...geoBase, radiusMi: 300 },
      statuses: ["RECRUITING"],
    };
  }

  // Rung 2: broaden the condition term, nationwide.
  const broaderTerm = profile.conditionSearchTerms.find(
    (term) => !tried.includes(term) || term !== profile.conditionSearchTerms[0]
  );
  const untriedTerm = profile.conditionSearchTerms.slice(1).find((t) => !tried.includes(t));
  if (untriedTerm) {
    return {
      label: `broader condition: ${untriedTerm} (nationwide)`,
      cond: untriedTerm,
      geo: null,
      statuses: ["RECRUITING"],
    };
  }

  // Rung 3: biomarker basket hunt.
  const biomarker = profile.biomarkers[0];
  if (biomarker && !tried.includes("basket")) {
    return {
      label: `basket hunt: ${biomarker} trials in advanced solid tumors (nationwide)`,
      cond: "advanced solid tumor",
      term: biomarker,
      geo: null,
      statuses: ["RECRUITING", "NOT_YET_RECRUITING"],
    };
  }

  void broaderTerm;
  return null;
}
