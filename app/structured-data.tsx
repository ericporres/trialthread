/**
 * IA-2 — entity markup for search engines and AI answer engines.
 *
 * WHY THIS EXISTS (audit finding, 2026-07-13):
 * The rendered site carried ZERO JSON-LD. Consequences, all verified:
 *   - `site:trialthread.org` returned zero indexed pages.
 *   - A search for "best free AI clinical trial finder no account" returned
 *     ClinTrialFinder, Trial Finder, and Antidote — never TrialThread.
 *   - A search for "is TrialThread legitimate / affiliated with Logitech"
 *     returned FTC clinical-trial-SCAM warnings and a different company
 *     (THREAD Research). The vetting query fails open, into suspicion.
 *
 * The job of this file is to let a machine answer, without ambiguity:
 *   What is it? Who built it? Is it free? Does it store data? Is it Logitech's?
 *   Is it medical advice? Where is the source? Where does the data come from?
 *
 * DELIBERATE OMISSIONS — read before adding to this file:
 *   - NO `MedicalWebPage`, `MedicalRiskEstimator`, or any schema with
 *     `reviewedBy` / `lastReviewed`. Those types imply clinical review by a
 *     named medical authority. TrialThread has had none. Asserting the schema
 *     would be the single fastest way to turn an honest project into a
 *     deceptive one. Add these ONLY when a named clinician actually reviews
 *     the content, and then name them.
 *   - NO `aggregateRating` / `review`. There are no reviews. Inventing them
 *     is fraud, and Google delists for it.
 *   - NO `Organization` for TrialThread. It is not an organization; it is one
 *     person's project. Claiming org status invites exactly the corporate-
 *     backing inference we are trying to prevent.
 */

const PERSON = {
  "@type": "Person",
  "@id": "https://www.trialthread.org/#eric-porres",
  name: "Eric Porres",
  url: "https://porres.com",
  sameAs: [
    "https://github.com/ericporres",
    "https://www.linkedin.com/in/eporres/",
    "https://promptedbyeric.substack.com",
    "https://x.com/eporres",
  ],
};

export function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      PERSON,
      {
        "@type": "WebSite",
        "@id": "https://www.trialthread.org/#website",
        url: "https://www.trialthread.org",
        name: "TrialThread",
        description:
          "A free, open-source AI agent that finds recruiting clinical trials on ClinicalTrials.gov and explains, in plain English, why each one may or may not fit.",
        inLanguage: "en-US",
        creator: { "@id": "https://www.trialthread.org/#eric-porres" },
      },
      {
        "@type": "WebApplication",
        "@id": "https://www.trialthread.org/#app",
        name: "TrialThread",
        alternateName: "TrialThread clinical trial finder",
        url: "https://www.trialthread.org",
        applicationCategory: "HealthApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript.",
        datePublished: "2026-07-04",
        inLanguage: "en-US",

        description:
          "Describe a diagnosis in plain language. TrialThread searches the ClinicalTrials.gov v2 API for recruiting trials near you, reads the full eligibility criteria of the top candidates, and explains in plain English which trials may fit and what might get in the way. Free, no account, no stored patient data.",

        // The single most load-bearing property in this file. This is what an
        // AI answer engine reads when a caregiver asks "is this legit, and is
        // this Logitech's product?"
        disambiguatingDescription:
          "TrialThread is an independent personal project by Eric Porres, released as open source under Apache-2.0. It is NOT affiliated with, endorsed by, funded by, or operated by his employer (Logitech) or any other company, hospital, trial sponsor, or contract research organization. It is not a medical device, it does not provide medical advice, and it cannot determine eligibility — only a trial's study team can. It is distinct from TrialMatchAI, TrialGPT, ClinTrialFinder, TrialSearch, and THREAD Research, which are unrelated products.",

        creator: { "@id": "https://www.trialthread.org/#eric-porres" },
        author: { "@id": "https://www.trialthread.org/#eric-porres" },

        // Free, and structurally free — not a trial, not a freemium tier.
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          description:
            "Free for patients and caregivers, with no account and no paid tier. Funded by GitHub Sponsors.",
        },
        isAccessibleForFree: true,

        license: "https://www.apache.org/licenses/LICENSE-2.0",

        // NOTE: `codeRepository` is NOT valid on WebApplication — schema.org
        // scopes it to SoftwareSourceCode. It is asserted on the separate
        // SoftwareSourceCode node below, and linked from here via `sameAs`.
        // (Caught in this audit's own verification pass. Invalid properties
        // can suppress rich results for the whole page.)
        sameAs: ["https://github.com/ericporres/trialthread"],

        isBasedOn: {
          "@type": "Dataset",
          name: "ClinicalTrials.gov",
          description:
            "The U.S. registry of clinical studies, operated by the National Library of Medicine. Queried live via the v2 API at search time; no local copy is kept.",
          url: "https://clinicaltrials.gov",
        },

        // Prior art, credited. TrialThread's contribution is product shape,
        // not a novel matching method — say so in the markup too.
        citation: [
          {
            "@type": "CreativeWork",
            name: "TrialGPT (NIH) — LLM criterion-level trial matching",
            url: "https://www.ncbi.nlm.nih.gov/research/trialgpt/",
          },
          {
            "@type": "ScholarlyArticle",
            name: "TrialMatchAI: an end-to-end AI-powered clinical trial recommendation system",
            url: "https://www.nature.com/articles/s41467-026-70509-w",
          },
        ],

        // NOTE: there is no `privacyPolicy` property in schema.org — it was in
        // an earlier draft of this file and removed in verification. The
        // privacy page is surfaced via the sitemap, the footer, and the FAQ
        // instead. Do not re-add it: invented properties are exactly the kind
        // of thing that gets a page's structured data thrown out wholesale.
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": "https://www.trialthread.org/#source",
        name: "TrialThread — source",
        codeRepository: "https://github.com/ericporres/trialthread",
        programmingLanguage: "TypeScript",
        license: "https://www.apache.org/licenses/LICENSE-2.0",
        author: { "@id": "https://www.trialthread.org/#eric-porres" },
        about: { "@id": "https://www.trialthread.org/#app" },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Content is a compile-time constant — no user input reaches this string.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

/**
 * FAQPage markup for /faq.
 *
 * Rule enforced here: every Q&A below MUST appear as visible text on /faq.
 * FAQPage schema that is not backed by visible page content is a structured-
 * data violation and gets the whole site's rich results suppressed. If you
 * edit one, edit both.
 */
export function FaqStructuredData({ qa }: { qa: { q: string; a: string }[] }) {
  const graph = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "https://www.trialthread.org/faq#faq",
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
