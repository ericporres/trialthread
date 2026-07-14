# Contributing to TrialThread

Thank you. Three kinds of contribution matter here, in this order.

## 1. Test vignettes (the most valuable thing you can do)

Match quality is measured against synthetic patient vignettes with known-correct answers. If you are a clinician, research nurse, or trial coordinator, a single reviewed vignette is worth more than a hundred lines of code — it becomes a permanent gate the whole system is measured against on every future change.

**You do not need to touch code or run anything.** Two ways in, easiest first:

1. **Open a vignette issue** — no fork, no eval, about five minutes. Use the *Clinician test vignette* form: [new issue](https://github.com/ericporres/trialthread/issues/new?template=clinician-vignette.yml). Describe a synthetic patient the way a caregiver would type it, then say which trials or drug classes *should* surface, which should be *excluded*, and what the tool *must* caution about. A maintainer wires it into the eval and credits you on the entry.
2. **Send it in prose** — reply in plain language to whoever pointed you here. Same content, zero tooling. We formalize it; your initials and role go on the vignette.

If you *are* comfortable in a repo, a vignette is one object in `eval/vignettes.json` — **not** a separate markdown file. (An earlier version of this doc described markdown files in `eval/vignettes/`; that was wrong — the eval reads `vignettes.json`, so a markdown vignette would have been silently ignored.)

```json
{
  "id": "her2-mbc-westchester",
  "description": "My mother is 58, HER2-positive metastatic breast cancer with liver mets, prior trastuzumab and taxane, ER-negative, near White Plains NY.",
  "expect": {
    "minMatches": 3,
    "shouldSurface": [
      { "label": "HER2 ADC (T-DXd family)", "any": ["trastuzumab deruxtecan", "t-dxd", "enhertu", "datopotamab"] },
      { "label": "tucatinib-based", "any": ["tucatinib", "tukysa"] }
    ],
    "minSurface": 1,
    "note": "reviewed by <initials/role>, <date>"
  }
}
```

- **`shouldSurface`** is the clinician judgment the machine can now check: a list of token-groups (drug names, brand names, class terms). A group passes if *any* returned trial's ClinicalTrials.gov title or interventions contains *any* of its tokens — so it is checked against the registry, not against the tool's own output. **`minSurface`** sets how many groups must hit (default: all). Keep it below the group count so ordinary week-to-week registry churn doesn't fail the build, while a real collapse of the modern options still does. Avoid tautological groups: for a HER2 search, "any HER2 trial" always hits and proves nothing; "a T-DXd-class or tucatinib option" is the assertion worth making.
- **`shouldExclude`** (optional) fails the vignette if any returned trial matches. It matches on title/interventions, so it catches drug or study-type classes (e.g., "a data-collection registry should not be the treatment answer"), not eligibility-criteria nuances like "first-line-only" — that needs criteria parsing and is a v2.
- **`expectSafety`** (optional) is an exact-set assertion on the crisis banner; see the three `safety-*` vignettes for the pattern, including the false-positive guard.

**Never include real patient information — yours or anyone's.** Vignettes must be synthetic or fully de-identified composites. This is the one rule with no exceptions.

## 2. Broadening rules

`lib/loop.ts` widens searches by geography, parent condition, and biomarker baskets. Condition-specific broadening knowledge (e.g., which basket terms matter for NSCLC vs. sarcoma) is welcome as small, cited PRs.

## 3. Code

TypeScript strict, no new dependencies without a reason stated in the PR, `npx tsc --noEmit` and `npm run build` clean. Keep the app stateless: PRs that add accounts, storage, or tracking to this repo will be declined — that boundary is [documented in the README](README.md#project-boundary).

## How changes ship (read before your first PR)

**`main` auto-deploys to production at trialthread.com — a live product used by people in medical crisis.** Two hard rules follow from that:

1. **Fork and PR. Never push to `main`.** Every change lands through a reviewed pull request; the merge is the deploy.
2. **The eval is the definition of done.** Run `node eval/run-eval.mjs <your-preview-url>` (or against a local `next start`) before requesting review, and paste the summary line into the PR. It mechanically catches the failure modes that matter here: hallucinated NCT IDs, absolute eligibility language ("you qualify"), zero-result regressions, and latency blowups. A PR that makes the pipeline faster but fails the eval is not an optimization — it is a regression with good branding. Note the eval makes real API calls (~$0.25/vignette with a key; `TRIALTHREAD_MOCK=1` exercises everything except LLM output quality).

## Ground rules

- No real patient data anywhere: issues, PRs, commits, screenshots.
- This is not a medical device and PRs must not market it as one.
- Be kind. Many people arriving here are having the worst year of their lives.
