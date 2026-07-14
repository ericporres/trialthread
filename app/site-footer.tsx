import Link from "next/link";

/**
 * One footer, used on every page.
 *
 * This exists because of a real drift bug: the footer was copy-pasted across
 * five pages, and `llms.txt` ended up on exactly one of them — the homepage.
 * Nobody decided that; it just happened, which is what always happens to
 * duplicated markup. Now there is one list of links and it is impossible for
 * the pages to disagree about what the site contains.
 *
 * If you add a page, add it here once.
 */
export function SiteFooter() {
  return (
    <footer className="site">
      {/* Line 1 — where you can go */}
      <div className="footer-line">
        <Link href="/">Search</Link> · <Link href="/about">About</Link> ·{" "}
        <Link href="/faq">FAQ</Link> · <Link href="/privacy">Privacy</Link> ·{" "}
        <Link href="/security">Security</Link> ·{" "}
        <a href="https://github.com/ericporres/trialthread" target="_blank" rel="noreferrer">
          Source
        </a>{" "}
        ·{" "}
        <a href="https://github.com/sponsors/ericporres" target="_blank" rel="noreferrer">
          Support TrialThread ♥
        </a>
      </div>

      {/* Line 2 — where the data comes from, and what we don't keep */}
      <div className="footer-line">
        Data:{" "}
        <a href="https://clinicaltrials.gov" target="_blank" rel="noreferrer">
          ClinicalTrials.gov
        </a>
        , fetched live · No accounts, no stored health data
      </div>

      {/* Line 3 — the machine-readable index */}
      <div className="footer-line">
        © {new Date().getFullYear()} TrialThread · For machines:{" "}
        <a href="/llms.txt">llms.txt</a> · <a href="/llms-full.txt">llms-full.txt</a>
      </div>
    </footer>
  );
}
