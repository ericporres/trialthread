import type { MetadataRoute } from "next";

/**
 * IA-2 — discoverability substrate.
 *
 * Before this file, https://www.trialthread.org/robots.txt returned 404 and
 * `site:trialthread.org` returned zero indexed pages (verified 2026-07-13).
 *
 * Deliberately permissive: TrialThread's whole purpose is to be found — by
 * search engines AND by the AI answer engines that patients and caregivers
 * increasingly ask first. There is nothing here to hide from a crawler.
 *
 * /api/ is disallowed because it is a POST-only streaming endpoint; there is
 * nothing there to index and a crawler hitting it burns inference credit.
 *
 * ---------------------------------------------------------------------------
 * WHY THE NAMED BLOCK EXISTS (2026-08-03)
 *
 * `User-Agent: *` already permits every crawler below. The named block is not
 * about permission — it is about two things a wildcard cannot express:
 *
 * 1. TRAINING/GROUNDING OPT-IN IS OPT-OUT-SHAPED. `Google-Extended` and
 *    `Applebot-Extended` are not crawlers. They are opt-out tokens: they
 *    control whether already-crawled content may ground Gemini and Apple
 *    Intelligence answers. Naming them with `Allow: /` is an explicit,
 *    legible YES rather than a silence that a future policy change could
 *    reinterpret. For a site whose failure mode is "the caregiver never finds
 *    it," being ingestible by answer engines is the product working.
 *
 * 2. INTENT SURVIVES REFACTORS. A permissive wildcard is indistinguishable
 *    from an unconsidered default. Someone (possibly me, in a year, spooked
 *    by an AI-scraping headline) will be tempted to add blanket blocks. This
 *    block is the argument against that, written down at the point of change:
 *    a trial a patient never finds helps no one, and an answer engine that
 *    cannot read this site will answer their question from something worse.
 *
 * Robots.txt precedence note: a named block fully REPLACES the wildcard for
 * that agent — directives do not merge. Every named agent therefore repeats
 * `Disallow: /api/`. Do not remove it from one and not the others.
 *
 * NOT LISTED, DELIBERATELY: nothing. There is no crawler this site benefits
 * from excluding. If one is ever added, the reason belongs in this comment.
 * ---------------------------------------------------------------------------
 */

/** Conventional web search crawlers. */
const SEARCH_CRAWLERS = [
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "Slurp", // Yahoo
  "DuckDuckBot",
  "Applebot", // Siri / Spotlight — distinct from Applebot-Extended
  "YandexBot",
  "Baiduspider",
  "Seznambot",
  "Naverbot",
  "Qwantbot",
  "MojeekBot",
  "Kagibot",
];

/**
 * AI answer engines and the retrieval agents behind them. These are the ones
 * that matter most here: a caregiver at 2am is now as likely to ask ChatGPT,
 * Claude, Perplexity, or Gemini "how do I find a clinical trial for X" as to
 * open a search box.
 */
const ANSWER_ENGINE_CRAWLERS = [
  // OpenAI: GPTBot trains, OAI-SearchBot indexes for ChatGPT Search,
  // ChatGPT-User fetches a page live when a user's question needs it.
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic: same three-way split.
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  // Perplexity: index crawler + live user-triggered fetch.
  "PerplexityBot",
  "Perplexity-User",
  // Grounding opt-ins — see note 1 above. These do not crawl.
  "Google-Extended",
  "Applebot-Extended",
  // Everyone else.
  "Meta-ExternalAgent",
  "meta-externalagent",
  "Amazonbot",
  "Bytespider",
  "DuckAssistBot",
  "MistralAI-User",
  "cohere-ai",
  "YouBot",
  "Timpibot",
  "PetalBot",
  "CCBot", // Common Crawl — upstream of a large share of open training corpora
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: [...SEARCH_CRAWLERS, ...ANSWER_ENGINE_CRAWLERS],
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://www.trialthread.org/sitemap.xml",
    host: "https://www.trialthread.org",
  };
}
