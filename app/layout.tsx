import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { IBM_Plex_Mono, Newsreader, Public_Sans } from "next/font/google";
import { StructuredData } from "./structured-data";
import "./globals.css";

const sans = Public_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "600", "700"] });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", weight: ["500", "600"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

const TITLE = "TrialThread — find clinical trials you'd never find on your own";
const DESCRIPTION =
  "Describe a diagnosis in plain language. TrialThread searches clinicaltrials.gov, reads the eligibility criteria, and explains — in plain English — which recruiting trials may fit and why. Free, no account, no stored patient data.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.trialthread.org"),
  title: TITLE,
  description: DESCRIPTION,

  // AUDIT IA-2 (2026-07-13): there was no canonical tag on any page.
  // Child routes override this with their own canonical.
  alternates: { canonical: "https://www.trialthread.org" },

  // Launched 2026-07-04: indexable.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    // AUDIT IA-2: this was hardcoded to the homepage on EVERY page, so /about
    // told every scraper and social preview that it was the homepage. Child
    // routes now set their own `openGraph.url`; this is the homepage default.
    url: "https://www.trialthread.org",
    siteName: "TrialThread",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "TrialThread — Describe the diagnosis. We'll read the trials you'd never find on your own. Free, no account, no stored patient data, patients never pay.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },

  // Be explicit rather than relying on crawler defaults. There is nothing here
  // to hide: being found IS the product.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },

  // Google Search Console — URL-prefix property verification via HTML tag.
  // Renders: <meta name="google-site-verification" content="..." />
  //
  // This is a PUBLIC verification token, not a secret — it proves control of the
  // site and nothing more. Safe in the repo, and it belongs there: a token that
  // lives only in someone's browser tab gets lost, and then verification silently
  // lapses months later when nobody remembers why.
  //
  // Note the shape difference that trips people up: the DNS TXT record wants the
  // full `google-site-verification=TOKEN` string, but the meta tag wants ONLY the
  // token. Same token, two encodings.
  verification: {
    google: "_Pb3k_VGnCiDSQHy83M_-69WEarS4CXfIpQuFiusw9E",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cfToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        {/* AUDIT IA-2: entity markup. The site previously carried zero JSON-LD,
            and `site:trialthread.org` returned zero indexed pages. See
            app/structured-data.tsx — including what is deliberately NOT
            claimed there (no medical-review schema, no ratings). */}
        <StructuredData />

        {children}

        {/* Cookieless analytics only — see lib/analytics.ts privacy contract.
            No Google Analytics by design. NOTE: this IS tracking, of a narrow
            and deliberately health-data-free kind. The README used to say the
            repo had "no tracking of any kind"; that sentence was wrong and is
            corrected. The design is good enough not to need the overclaim. */}
        <Analytics />

        {cfToken && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${cfToken}"}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
