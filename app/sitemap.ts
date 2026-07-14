import type { MetadataRoute } from "next";

/**
 * IA-2 — discoverability substrate.
 *
 * Before this file, /sitemap.xml returned 404 (verified 2026-07-13).
 *
 * Small site, few routes — the point is not sitemap size, it is that a crawler
 * (and an AI answer engine following robots.txt → sitemap) has an explicit,
 * dated list of the canonical URLs instead of having to guess.
 *
 * lastModified is intentionally a real date, not `new Date()`. A sitemap that
 * claims every page changed today, every day, teaches crawlers to distrust the
 * signal. Bump these by hand when the page actually changes.
 */
const LAST_MODIFIED = {
  home: new Date("2026-07-07"),
  about: new Date("2026-07-04"),
  faq: new Date("2026-07-14"),
  privacy: new Date("2026-07-14"),
  security: new Date("2026-07-14"),
};

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.trialthread.org",
      lastModified: LAST_MODIFIED.home,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: "https://www.trialthread.org/about",
      lastModified: LAST_MODIFIED.about,
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: "https://www.trialthread.org/faq",
      lastModified: LAST_MODIFIED.faq,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.trialthread.org/privacy",
      lastModified: LAST_MODIFIED.privacy,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: "https://www.trialthread.org/security",
      lastModified: LAST_MODIFIED.security,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
