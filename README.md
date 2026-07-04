# TrialThread

**An AI agent that finds clinical trials people would never find on their own — and explains, in plain English, why each one may or may not fit.**

Live instance: **[trialthread.org](https://www.trialthread.org)** — free, no account, nothing you type is stored (also reachable via trialthread.com)

## Why

Every recruiting trial in the United States is publicly listed on [clinicaltrials.gov](https://clinicaltrials.gov), and almost nobody can find the one that fits. The registry speaks in eligibility criteria; patients speak in plain language. The translation layer between them has mostly lived inside the heads of research nurses and well-connected oncologists. This project makes that layer free. The longer version is on the [About page](https://www.trialthread.org/about).

## How it works

Patient description → structured profile → live registry search → LLM eligibility screening → adaptive broadening → grounded explanations. No database, no accounts, no stored patient data.

1. **Extraction** (`lib/extract.ts`) — Claude parses a free-text description into a structured profile: condition, stage, biomarkers, prior treatments, age, location (LLM city-level geocode), and honest red flags.
2. **Search** (`lib/ctgov.ts`) — live queries against the clinicaltrials.gov v2 API: condition + `RECRUITING` + geo radius, normalized with haversine site distances. No ingest pipeline, so results are never stale.
3. **Triage** (`lib/score.ts`) — a fast model screens every candidate (batched, parallel) as strong / possible / unlikely.
4. **The loop** (`lib/loop.ts`) — if strong candidates are thin, the search widens deliberately: geography (100 mi → 300 mi → national), parent condition terms, then a biomarker basket hunt across solid-tumor trials. Every pass streams to the UI as a visible ledger.
5. **Deep parse** (`lib/score.ts`) — a stronger model reads the full criteria of the top candidates and produces criterion-grounded output: "Requires X — you reported Y," concerns phrased as things to check, and questions to bring to your doctor.

Eligibility is a constraint-satisfaction problem, not a similarity problem — "HER2-positive required" and "prior HER2 therapy excluded" embed almost identically, which is why the ranking authority here is criteria reading, not vector distance. A semantic recall arm (embedding LLM-synthesized "who this trial wants" archetypes) is the planned v2 addition for trials whose criteria are phrased unlike the diagnosis.

## Run it yourself

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev
```

`TRIALTHREAD_MOCK=1` runs the full pipeline with canned LLM responses (no key needed) — useful for testing the search loop and UI. Model choices are env-configurable (`TT_EXTRACT_MODEL`, `TT_TRIAGE_MODEL`, `TT_DEEP_MODEL`).

## What this is not

Not medical advice. Not a determination of eligibility — only a trial team can make that call. Summaries are AI-generated and can contain errors; the official clinicaltrials.gov listing is always authoritative. The hosted instance stores no patient data, and this repo contains no tracking of any kind. Keep it that way in forks that serve real patients.

## Project boundary

The matching engine — everything in this repo — is open source under Apache-2.0. If a referral layer (patient-consented warm handoffs to trial sites, under standard FMV recruitment agreements) is ever built, it will live in a separate private service, fees will come from sites and sponsors, and patients will never pay. That boundary is documented here on purpose.

## Contributing

The most valuable contribution is not code — it is **clinician-reviewed synthetic test vignettes** that let us measure match quality. See [CONTRIBUTING.md](CONTRIBUTING.md). Never include real patient information in issues or pull requests.

## Support

Hosting and inference for the free instance cost real money (Vercel + Claude API) — the running bill is public in [COSTS.md](COSTS.md), so "every dollar goes to servers and tokens" is checkable, not asserted. Sponsor the free searches at [github.com/sponsors/ericporres](https://github.com/sponsors/ericporres) (zero platform fees, publicly visible) — or contribute a test vignette, a bug report, or tell one oncology social worker this exists.

## Prior art and lineage

[TrialGPT](https://www.ncbi.nlm.nih.gov/research/trialgpt/) (NIH) validated LLM criterion-level matching. [TrialMatchAI](https://www.nature.com/articles/s41467-026-70509-w) (Nature Communications, 2026) published the RAG variant. [ClinTrialFinder](https://github.com/chncwang/ClinTrialFinder) open-sourced a comparable pipeline. The iterative search pattern follows the [Karpathy AutoResearch](https://github.com/karpathy/autoresearch) loop. TrialThread's contribution is the product shape: stateless, patient-first, visible reasoning, honest verdicts.

## License

[Apache-2.0](LICENSE) — Eric Porres, 2026.
