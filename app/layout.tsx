import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { IBM_Plex_Mono, Newsreader, Public_Sans } from "next/font/google";
import "./globals.css";

const sans = Public_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "600", "700"] });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", weight: ["500", "600"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "TrialThread — find clinical trials you'd never find on your own",
  description:
    "Describe a diagnosis in plain language. TrialThread searches clinicaltrials.gov, reads the eligibility criteria, and explains — in plain English — which recruiting trials may fit and why.",
  // Launched 2026-07-04: indexable.
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
