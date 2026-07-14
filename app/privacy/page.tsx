import type { Metadata } from "next";
import Link from "next/link";
import { HowYourWordsTravel } from "../how-your-words-travel";
import { SiteFooter } from "../site-footer";

export const metadata: Metadata = {
  title: "Privacy — what happens to what you type into TrialThread",
  description:
    "The complete data path: what TrialThread stores (nothing), what it sends to its AI provider, what that provider does and does not retain, what the analytics record, and what you should never type in.",
  alternates: { canonical: "https://www.trialthread.org/privacy" },
};

/**
 * IA-3 — the privacy notice.
 *
 * Audit finding: /privacy returned 404. "Nothing you type is stored" — one of
 * the three promises — existed only as prose on /about, with no notice behind
 * it and no mention anywhere on the site that a model provider reads the text.
 *
 * CORRECTION LOG (2026-07-14). An earlier draft of this page said Anthropic
 * retains API inputs for up to 30 days. That was WRONG, and it was wrong
 * because the auditor trusted a search-engine summary instead of the primary
 * source. Anthropic's actual API data-retention documentation states:
 *
 *   "Conversation content (your prompts and Claude's outputs) is not retained
 *    by default; the exception is Covered Models, which require 30-day
 *    retention."
 *
 * The 30-day rule applies to Covered Models — Claude Fable 5 and Mythos 5.
 * TrialThread runs claude-sonnet-5 and claude-haiku-4-5 (lib/anthropic.ts:4-6).
 * Neither is a Covered Model. So the 30-day retention does NOT apply here.
 *
 * Which means "nothing you type is stored" was essentially TRUE all along.
 * What was missing was never a retention problem — it was a DISCLOSURE
 * problem: the site never told anyone that a third party reads the text at
 * all. That is what this page fixes, along with the two narrow caveats that
 * are genuinely true (trust-and-safety flagging; no BAA, so no PHI).
 *
 * Keep this page honest by keeping it specific. If the models change to a
 * Covered Model, the 30-day paragraph comes back and this page changes FIRST.
 */
export default function Privacy() {
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
        <h2>What happens to what you type</h2>

        <p>
          <em>Last updated 14 July 2026.</em>
        </p>

        <p>
          Most privacy policies are written to protect the company. This one is written to tell
          you what actually happens, in the order it happens. The short version:{" "}
          <strong>
            TrialThread stores nothing about you — no account, no profile, no database, no record
            of your search
          </strong>
          . An AI service reads your description in order to do the search, and does not keep it.
          The detail is below, including the two places where that sentence needs a footnote.
        </p>

        <HowYourWordsTravel />

        <h3>Do not type anything that identifies a person</h3>

        <p>
          No names. No date of birth. No medical record number, insurance number, or Social
          Security number. No address, phone number, or email. TrialThread does not need any of
          it and cannot use any of it. Describe the medical situation, not the person:{" "}
          <em>
            &ldquo;My mother is 58, HER2-positive metastatic breast cancer, spread to the liver,
            two prior treatments, we live near Chicago&rdquo;
          </em>{" "}
          is everything the search requires. TrialThread is not a covered entity under HIPAA and
          does not operate under a Business Associate Agreement — which is a formal way of saying
          it is not the right place to put identifiable medical records, and it never needs to be.
        </p>

        <h3>The path your words take</h3>

        <p>
          <strong>1. Your browser.</strong> You type a description into the box. It is sent to
          TrialThread over an encrypted connection. It is never put in the web address, so it
          never lands in your browser history, in a bookmark, or in a link you might share by
          accident. TrialThread sets no cookies and stores nothing in your browser.
        </p>

        <p>
          <strong>2. TrialThread&rsquo;s server.</strong> The description is held in memory for
          the length of your search and then it is gone. There is no database — not an empty one,
          none at all. It is never written to a log file: when a search fails, the error report
          records the stage that failed and a scrubbed error message, never your text. Nobody,
          including the person who built this, can look up what you searched for, because it was
          never written down.
        </p>

        <p>
          <strong>3. The AI provider.</strong> To read your description and read the trial
          criteria, TrialThread sends the text to{" "}
          <a href="https://www.anthropic.com" target="_blank" rel="noreferrer">
            Anthropic
          </a>
          &rsquo;s Claude API. This is the one place your words leave TrialThread, so here is
          exactly what happens to them there. Under Anthropic&rsquo;s API terms, conversation
          content — your prompts and the model&rsquo;s outputs —{" "}
          <strong>is not retained by default</strong>, and it is{" "}
          <strong>never used to train their models</strong> without express permission.{" "}
          <em>
            The one exception: Anthropic&rsquo;s automated safety systems screen content, and if
            a session is flagged as violating their usage policy, they may retain it for up to two
            years.
          </em>{" "}
          Describing a cancer diagnosis is not the sort of thing those systems flag — but you are
          entitled to know the mechanism exists, which is why it is written here instead of left
          out.
        </p>

        <p>
          <strong>4. ClinicalTrials.gov.</strong> TrialThread queries the public U.S. registry for
          trials. Those queries carry medical search terms and a city-level location. They never
          carry your free text.
        </p>

        <h3>What the analytics record — and what they cannot</h3>

        <p>
          TrialThread counts how the product is used, because a free tool nobody can measure is a
          tool that quietly breaks. The counting is deliberately blunt. It records events like
          &ldquo;a search started,&rdquo; &ldquo;a search returned nine results,&rdquo; and
          &ldquo;someone clicked the third one.&rdquo; It records{" "}
          <strong>
            no free text, no condition names, no biomarkers, no locations, no trial identifiers,
            and no ages
          </strong>
          . Medical interest is medical data, and none of it is collected. The analytics are
          cookieless, set no advertising or cross-site trackers, and cannot follow you anywhere.
          That rule is enforced in the code, in a file you can read:{" "}
          <a
            href="https://github.com/ericporres/trialthread/blob/main/lib/analytics.ts"
            target="_blank"
            rel="noreferrer"
          >
            lib/analytics.ts
          </a>
          . Your IP address reaches the hosting provider, as it does with every website on the
          internet, and is used to rate-limit abuse.
        </p>

        <h3>Said precisely, one claim at a time</h3>

        <p>
          These sound like one sentence and they are not, so here they are separately.{" "}
          <strong>No account:</strong> true — there is no way to create one.{" "}
          <strong>No database:</strong> true — the application has no data store of any kind.{" "}
          <strong>Not logged by TrialThread:</strong> true — patient text is scrubbed from error
          reporting by design. <strong>Not retained by the AI provider:</strong> true by default,
          with the trust-and-safety exception named above.{" "}
          <strong>Not used to train AI models:</strong> true.{" "}
          <strong>Never seen by anyone but you:</strong>{" "}
          <em>not a claim we can make</em> — the text is processed by a third-party AI service in
          order to work at all, and that is the honest boundary of the promise.
        </p>

        <h3>What we would have to tell you</h3>

        <p>
          If TrialThread ever adds saved searches or accounts, it will be opt-in, explained in
          plain language before you choose, and deletable — and this page will change first. If
          the AI provider changes, or its retention terms change, or TrialThread switches to a
          model with different retention rules, this page changes first. If any of the above turns
          out to be wrong, it gets corrected here and the correction is noted, rather than quietly
          edited. That has already happened once: an earlier draft of this page overstated how
          long the AI provider keeps your text. It was corrected against the provider&rsquo;s own
          documentation before this page ever went live.
        </p>

        <h3>Security</h3>

        <p>
          If you find a security problem, please report it privately — the{" "}
          <Link href="/security">how to report a security problem</Link> page explains the channels.
          Never include real patient information in any report.
        </p>

        <p className="signoff">
          Questions this page does not answer belong on the{" "}
          <Link href="/faq">questions page</Link>, or in an{" "}
          <a
            href="https://github.com/ericporres/trialthread/issues"
            target="_blank"
            rel="noreferrer"
          >
            issue
          </a>
          .
        </p>
      </article>

      <div className="disclaimer">
        <strong>Please read.</strong> TrialThread surfaces and summarizes public listings from
        clinicaltrials.gov. Summaries are generated by AI and can contain errors; the official
        listing is always authoritative. Only a trial&rsquo;s study team can determine
        eligibility. Always discuss any trial with your treating physician.
      </div>

      <SiteFooter />
    </main>
  );
}
