"use client";

import { useState } from "react";

/**
 * Reveal-on-click email, for security researchers without a GitHub account.
 *
 * WHY: a plain `mailto:` in security.txt or in server-rendered HTML gets
 * harvested by scrapers within days — and then the security channel is a spam
 * channel, which means it is not a security channel at all.
 *
 * ── A NOTE ON THE FIRST ATTEMPT, WHICH DID NOT WORK ──────────────────────────
 * The obvious trick is to assemble the address from parts:
 *
 *     const address = ["security", "@", "trialthread", ".", "org"].join("");
 *
 * This looks safe and is not. The production minifier **constant-folds** it:
 * every input is a literal, so the optimiser evaluates `.join("")` at build time
 * and bakes the finished string straight into the bundle. Verified — the address
 * was greppable in `/_next/static/chunks/app/security/*.js` even though it never
 * appeared in the HTML. A scraper that reads JS would have found it.
 *
 * The fix is to give the minifier something it *cannot* evaluate at build time.
 * `atob` is a browser runtime API — the optimiser will not execute it, so the
 * literal in the bundle stays base64 and the address only exists after a human
 * clicks. Verified against the built bundle, not assumed.
 *
 * Honest about what this is: a speed bump, not a wall. A determined harvester
 * running a headless browser still gets it. The goal is to price out the bulk,
 * drive-by harvesting that makes an address useless — not to be uncrackable.
 */

// base64("security@trialthread.org") — deliberately not a plaintext literal.
const ENCODED = "c2VjdXJpdHlAdHJpYWx0aHJlYWQub3Jn";

export function RevealEmail() {
  const [address, setAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!address) {
    return (
      <p>
        <button
          type="button"
          className="example-chip"
          onClick={() => setAddress(atob(ENCODED))}
        >
          Show the email address
        </button>
      </p>
    );
  }

  return (
    <p>
      <code style={{ fontSize: "1.05em", userSelect: "all" }}>{address}</code>{" "}
      <button
        type="button"
        className="example-chip"
        onClick={() => {
          navigator.clipboard?.writeText(address).then(
            () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            },
            () => {
              /* clipboard blocked — the address is on screen anyway */
            }
          );
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </p>
  );
}
