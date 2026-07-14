import type { Metadata } from "next";
import Link from "next/link";
import { RevealEmail } from "./reveal-email";
import { SiteFooter } from "../site-footer";

export const metadata: Metadata = {
  title: "Reporting a security problem — TrialThread",
  description:
    "How to report a security vulnerability in TrialThread privately: GitHub private vulnerability reporting, or a reveal-on-click email fallback.",
  alternates: { canonical: "https://www.trialthread.org/security" },
  // No point indexing this for patients; researchers reach it via security.txt.
  robots: { index: true, follow: true },
};

export default function Security() {
  return (
    <main className="wrap">
      <header className="masthead">
        <h1 className="wordmark">
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            Trial<span className="thread">Thread</span>
          </Link>
        </h1>
        <p className="tagline">Clinical trials, findable.</p>
      </header>

      <article className="prose">
        <h2>Reporting a security problem</h2>

        <p>
          Reports are welcome and taken seriously. TrialThread is one person&rsquo;s project, so
          replies are not instant — but they are real, and credit is offered gladly.
        </p>

        <h3>The preferred channel</h3>

        <p>
          <a
            href="https://github.com/ericporres/trialthread/security/advisories/new"
            target="_blank"
            rel="noreferrer"
          >
            <strong>Open a private security advisory on GitHub →</strong>
          </a>
        </p>

        <p>
          This is private, threaded, authenticated, and it does not become public until and unless
          it is fixed and published. Please do <strong>not</strong> open a normal GitHub issue for a
          security finding — issues are public and permanent.
        </p>

        <h3>No GitHub account?</h3>

        <p>
          There is an email address, and it is deliberately not written anywhere a scraper can read
          it — the moment it appears in plain text in a well-known file, it belongs to spammers
          rather than to researchers. Click to reveal it:
        </p>

        <RevealEmail />

        <h3>What is actually worth attacking here</h3>

        <p>
          TrialThread is stateless. There is no patient database, no accounts, and no stored health
          data — so &ldquo;exfiltrate the data at rest&rdquo; is not the interesting attack, because
          there is no data at rest. What is interesting:
        </p>

        <ol>
          <li>
            <strong>The integrity of what a patient is told about a trial.</strong> An attacker who
            can change what a frightened person reads about their eligibility does real harm. This
            is the one that could hurt someone. Please weight it accordingly.
          </li>
          <li>
            <strong>Prompt injection</strong> — through pasted text, or through content coming back
            from the registry itself.
          </li>
          <li>
            <strong>Denial-of-wallet.</strong> The inference budget is small and hard-capped. Auto-
            reload is deliberately off, so exhausting it degrades to an outage rather than a
            surprise bill — but an outage still means a patient cannot search.
          </li>
          <li>
            <strong>The API key.</strong>
          </li>
        </ol>

        <p>
          <strong>
            Never include real patient information in a report, through any channel.
          </strong>{" "}
          There is no bug bounty — this is a free, unfunded, public-interest project.
        </p>

        <p className="signoff">
          Machine-readable version:{" "}
          <a href="/.well-known/security.txt">/.well-known/security.txt</a>
        </p>
      </article>

      <SiteFooter />
    </main>
  );
}
