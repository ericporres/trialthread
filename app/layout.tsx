import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { IBM_Plex_Mono, Newsreader, Public_Sans } from "next/font/google";
import "./globals.css";

const sans = Public_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "600", "700"] });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", weight: ["500", "600"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

const TITLE = "TrialThread — find clinical trials you'd never find on your own";
const DESCRIPTION =
  "Describe a diagnosis in plain language. TrialThread searches clinicaltrials.gov, reads the eligibility criteria, and explains — in plain English — which recruiting trials may fit and why. Free, no account, nothing you type is stored.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.trialthread.org"),
  title: TITLE,
  description: DESCRIPTION,
  // Launched 2026-07-04: indexable.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.trialthread.org",
    siteName: "TrialThread",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "TrialThread — Describe the diagnosis. We'll read the trials you'd never find on your own. Free, no account, nothing you type is stored, patients never pay.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cfToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        {children}
        {/* Cookieless analytics only — see lib/analytics.ts privacy contract. No Google Analytics by design. */}
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
