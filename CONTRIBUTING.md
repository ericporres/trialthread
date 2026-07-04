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

## Ground rules

- No real patient data anywhere: issues, PRs, commits, screenshots.
- This is not a medical device and PRs must not market it as one.
- Be kind. Many people arriving here are having the worst year of their lives.
