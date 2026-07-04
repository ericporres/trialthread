import type { Trial, TrialSite } from "./types";

const CTGOV_BASE = "https://clinicaltrials.gov/api/v2/studies";

const FIELDS = [
  "protocolSection.identificationModule.nctId",
  "protocolSection.identificationModule.briefTitle",
  "protocolSection.identificationModule.officialTitle",
  "protocolSection.statusModule.overallStatus",
  "protocolSection.statusModule.lastUpdatePostDateStruct",
  "protocolSection.descriptionModule.briefSummary",
  "protocolSection.designModule.phases",
  "protocolSection.designModule.studyType",
  "protocolSection.conditionsModule.conditions",
  "protocolSection.armsInterventionsModule.interventions",
  "protocolSection.eligibilityModule",
  "protocolSection.contactsLocationsModule",
].join("|");

export interface CtgovSearchParams {
  cond?: string;
  term?: string;
  statuses?: string[]; // e.g. ["RECRUITING"]
  geo?: { lat: number; lon: number; radiusMi: number } | null;
  pageSize?: number;
}

function haversineMi(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeStudy(study: any, patientLoc: { lat: number; lon: number } | null): Trial {
  const p = study?.protocolSection ?? {};
  const ident = p.identificationModule ?? {};
  const status = p.statusModule ?? {};
  const design = p.designModule ?? {};
  const elig = p.eligibilityModule ?? {};
  const contacts = p.contactsLocationsModule ?? {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sites: TrialSite[] = (contacts.locations ?? []).map((loc: any) => {
    const lat = loc.geoPoint?.lat ?? null;
    const lon = loc.geoPoint?.lon ?? null;
    return {
      facility: loc.facility ?? "Unnamed site",
      city: loc.city ?? "",
      state: loc.state ?? "",
      country: loc.country ?? "",
      status: loc.status ?? null,
      lat,
      lon,
      distanceMi:
        patientLoc && lat != null && lon != null
          ? Math.round(haversineMi(patientLoc.lat, patientLoc.lon, lat, lon))
          : null,
    };
  });

  const sitesWithDistance = sites.filter((s) => s.distanceMi != null);
  const nearestSite =
    sitesWithDistance.length > 0
      ? sitesWithDistance.reduce((a, b) => (a.distanceMi! <= b.distanceMi! ? a : b))
      : sites[0] ?? null;

  const nctId = ident.nctId ?? "UNKNOWN";

  return {
    nctId,
    title: ident.briefTitle ?? "Untitled study",
    officialTitle: ident.officialTitle ?? null,
    status: status.overallStatus ?? "UNKNOWN",
    phases: design.phases ?? [],
    studyType: design.studyType ?? null,
    conditions: p.conditionsModule?.conditions ?? [],
    interventions:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.armsInterventionsModule?.interventions ?? []).map((i: any) =>
        [i.type, i.name].filter(Boolean).join(": ")
      ),
    briefSummary: p.descriptionModule?.briefSummary ?? null,
    eligibilityCriteria: elig.eligibilityCriteria ?? null,
    sex: elig.sex ?? null,
    minimumAge: elig.minimumAge ?? null,
    maximumAge: elig.maximumAge ?? null,
    lastUpdated: status.lastUpdatePostDateStruct?.date ?? null,
    centralContacts:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (contacts.centralContacts ?? []).map((c: any) => ({
        name: c.name ?? null,
        phone: c.phone ?? null,
        email: c.email ?? null,
      })),
    sites,
    nearestSite,
    url: `https://clinicaltrials.gov/study/${nctId}`,
  };
}

export async function searchTrials(params: CtgovSearchParams): Promise<Trial[]> {
  const qs = new URLSearchParams();
  if (params.cond) qs.set("query.cond", params.cond);
  if (params.term) qs.set("query.term", params.term);
  qs.set("filter.overallStatus", (params.statuses ?? ["RECRUITING"]).join(","));
  if (params.geo) {
    qs.set(
      "filter.geo",
      `distance(${params.geo.lat.toFixed(4)},${params.geo.lon.toFixed(4)},${params.geo.radiusMi}mi)`
    );
  }
  qs.set("fields", FIELDS);
  qs.set("pageSize", String(params.pageSize ?? 100));
  qs.set("countTotal", "true");

  const url = `${CTGOV_BASE}?${qs.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "TrialThread/0.1 (trial discovery; contact via site)" },
    // ctgov data changes slowly; cache identical searches briefly to be a polite client
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`clinicaltrials.gov returned ${res.status} for ${params.cond ?? params.term}`);
  }

  const data = await res.json();
  const studies = data?.studies ?? [];
  const patientLoc = params.geo ? { lat: params.geo.lat, lon: params.geo.lon } : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return studies.map((s: any) => normalizeStudy(s, patientLoc));
}

export function dedupeTrials(trials: Trial[]): Trial[] {
  const seen = new Set<string>();
  const out: Trial[] = [];
  for (const t of trials) {
    if (!seen.has(t.nctId)) {
      seen.add(t.nctId);
      out.push(t);
    }
  }
  return out;
}
