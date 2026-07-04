import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader, Public_Sans } from "next/font/google";
import "./globals.css";

const sans = Public_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "600", "700"] });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", weight: ["500", "600"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "TrialThread — find clinical trials you'd never find on your own",
  description:
    "Describe a diagnosis in plain language. TrialThread searches clinicaltrials.gov, reads the eligibility criteria, and explains — in plain English — which recruiting trials may fit and why.",
  robots: { index: false, follow: false }, // flip when Eric says launch
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
