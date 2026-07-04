"use client";

import { track } from "@vercel/analytics";

/**
 * TrialThread analytics privacy contract — enforced here, documented in README.
 *
 * NEVER send: free text, condition names, biomarkers, locations, NCT IDs, ages,
 * or anything derived from what a person typed. Medical interest is medical data.
 * ONLY send: event names, counts, booleans, pass numbers, and result ranks.
 *
 * Cookieless (Vercel Web Analytics). No cross-session identity. If an event you
 * want to add doesn't fit counts/booleans/ranks, it doesn't ship.
 */

type Funnel =
  | { e: "search_started" }
  | { e: "profile_ok"; hasLocation: boolean }
  | { e: "results"; n: number; strong: number; uncertain: number; unlikely: number; passes: number; considered: number }
  | { e: "zero_results"; passes: number }
  | { e: "search_error"; stage: string }
  | { e: "nct_click"; rank: number }
  | { e: "trial_expanded"; rank: number };

export function tt(event: Funnel): void {
  try {
    const { e, ...props } = event;
    track(e, props as Record<string, string | number | boolean>);
  } catch {
    // Analytics must never break the product.
  }
}
