import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../site-footer";

export const metadata: Metadata = {
  title: "About — TrialThread",
  description:
    "Why TrialThread exists: closing the gap between publicly listed clinical trials and the people whose lives depend on finding them.",

  // REGRESSION FIX (2026-08-03). This page was the ONE route that never
  // overrode the root layout's canonical, so /about shipped
  // <link rel="canonical" href="https://www.trialthread.org"> — telling Google
  // "this page is a duplicate of the homepage, index that instead." The root
  // layout comment claimed "child routes override this with their own
  // canonical"; /faq, /privacy and /security did. /about did not.
  //
  // That is a self-inflicted de-index, and it is consistent with what Search
  // Console reported: /about sitting in "Discovered - currently not indexed."
  // A canonical pointing away from the page is the single most reliable way to
  // keep a page out of the index while everything else looks healthy.
  //
  // Any new route added under app/ MUST set both of these. There is no
  // inherited-canonical behaviour worth relying on.
  alternates: { canonical: "https://www.trialthread.org/about" },
  openGraph: {
    title: "About TrialThread",
    description:
      "Why TrialThread exists: closing the gap between publicly listed clinical trials and the people whose lives depend on finding them.",
    url: "https://www.trialthread.org/about",
  },
};

export default function About() {
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
        <h2>Why this exists</h2>

        <p>
          I have lost people I love to cancer. Others close to me are alive right now because a
          clinical trial reached them in time. And others never found the trial that might have
          mattered — not because it didn&rsquo;t exist, but because finding it is harder than it
          has any right to be.
        </p>

        <p>That gap made me angry enough to build something.</p>

        <p>
          Here is the problem in one sentence: every recruiting trial in the United States is
          publicly listed on clinicaltrials.gov, and almost nobody can find the one that fits.
          The registry speaks in eligibility criteria — &ldquo;ECOG performance status &le;1,
          prior taxane exposure permitted, no untreated CNS metastases.&rdquo; Patients speak in
          plain language: my mother is 58, the cancer spread to her liver, she has tried two
          drugs. Between those two languages sits a translation layer that has mostly lived
          inside the heads of research nurses and well-connected oncologists. Patients with
          networked doctors get the translation. Everyone else gets a keyword search.
        </p>

        <p>
          Building AI systems is what I do for a living — by day I lead AI strategy at a large
          technology company; TrialThread is a personal project, built on my own time and not
          affiliated with my employer. The systems I work on read messy human language and
          structured data, and connect the two. TrialThread points that same machinery at trial
          matching: describe the diagnosis in your own words, and it reads the actual
          eligibility criteria of recruiting trials — starting near you, widening the search
          when the first pass is thin — then explains in plain English which trials may fit,
          and what might get in the way.
        </p>

        <h3>Three promises</h3>

        <p>
          <strong>Patients never pay.</strong> Not now, not later. If TrialThread earns money,
          it will come from trial sites and sponsors who pay for qualified referrals — the way
          trial recruitment already works today — and never from a patient or a family.
        </p>

        <p>
          <strong>Nothing you type is stored.</strong> No account, no profile, no database of
          your medical situation. Your description powers the search in front of you and is
          then discarded. If we ever add saved searches, it will be opt-in, explained in plain
          language, and deletable.
        </p>

        <p>
          <strong>Honesty over hope.</strong> If a trial probably will not take you, we say so,
          and we say why. False hope spends the one resource patients do not have.
        </p>

        <h3>Open, on purpose</h3>

        <p>
          The matching engine is{" "}
          <a href="https://github.com/ericporres/trialthread" target="_blank" rel="noreferrer">
            open source
          </a>{" "}
          under Apache-2.0 — read the code, run your own, make it better. The most useful
          contribution is not code: it is clinician-reviewed test cases that measure match
          quality. Trial sites and sponsors who want qualified, consented referrals can open a
          conversation through GitHub as well; that work would live in a separate service, under
          standard recruitment agreements, and it would never change the three promises above.
        </p>

        <p>
          TrialThread will not cure anything. It closes a distance — between public information
          and the people whose lives depend on reaching it. The trials exist. The patients
          exist. The thread between them is what has been missing.
        </p>

        <p className="signoff">
          — Eric Porres, New York
          <br />
          {/* Points at the Beyond Reason piece about building this, not the
              publication root. Canonical URL, not the open.substack.com share
              link: that one carries ?r= and utm_campaign=post-expanded-share,
              which would tag every visitor arriving from this page as having
              come through Eric's own share widget — and quietly poison the
              referrer data we would otherwise use to learn how people find
              TrialThread. Same article, clean address. */}
          <a
            href="https://promptedbyeric.substack.com/p/i-built-a-clinical-trial-finder-in-24-hours-trialthread"
            target="_blank"
            rel="noreferrer"
          >
            I write about AI systems at Beyond Reason
          </a>
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
