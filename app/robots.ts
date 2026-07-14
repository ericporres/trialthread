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
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://www.trialthread.org/sitemap.xml",
    host: "https://www.trialthread.org",
  };
}
