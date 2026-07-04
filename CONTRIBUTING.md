# Contributing to TrialThread

Thank you. Three kinds of contribution matter here, in this order.

## 1. Test vignettes (the most valuable thing you can do)

Match quality is measured against synthetic patient vignettes with known-correct answers. If you are a clinician, research nurse, or trial coordinator, a single reviewed vignette is worth more than a hundred lines of code.

A vignette is a markdown file in `eval/vignettes/` (create the folder with your first PR):

```markdown
# Vignette: HER2+ MBC, second line, Westchester NY

## Patient description (as a caregiver would type it)
My mother is 58, HER2-positive metastatic breast cancer with liver mets,
prior trastuzumab and taxane, ER-negative, lives near White Plains NY.

## Known-correct behavior (reviewed by <initials/role>, <date>)
- SHOULD surface: T-DXd trials, HER2-directed ADC trials, tucatinib combos
- SHOULD flag as uncertain: PIK3CA-required trials (mutation status unknown)
- SHOULD mark unlikely: first-line-only trials excluding prior trastuzumab
- MUST caution: visceral-crisis exclusions given liver metastases
```

**Never include real patient information — yours or anyone's.** Vignettes must be synthetic or fully de-identified composites.

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
