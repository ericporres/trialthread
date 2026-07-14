import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { FaqStructuredData } from "../structured-data";
import { HowYourWordsTravel } from "../how-your-words-travel";
import { SiteFooter } from "../site-footer";

export const metadata: Metadata = {
  title: "Questions about TrialThread — is it legitimate, who built it, what happens to my data",
  description:
    "Straight answers about TrialThread: who built it, whether it is affiliated with any company, what happens to what you type, what it has and has not been validated to do, and what it cannot tell you.",
  alternates: { canonical: "https://www.trialthread.org/faq" },
  openGraph: {
    title: "Questions about TrialThread",
    description:
      "Who built it, what happens to what you type, what it has and has not been validated to do, and what it cannot tell you.",
    url: "https://www.trialthread.org/faq",
  },
};

/**
 * The vetting page.
 *
 * Audit finding: a caregiver who does the responsible thing and searches "is
 * TrialThread legitimate" before typing their mother's diagnosis into it finds
 * NOTHING about TrialThread — and gets FTC clinical-trial-scam warnings instead.
 * The vetting query fails open, into suspicion. This page is the answer to it.
 *
 * Every answer here must remain true, including the ones most products would
 * never publish ("no, it has not been clinically validated"). That is the point:
 * "honesty over hope" turned on ourselves. An honest no is worth more than a
 * confident maybe — and it is exactly why an answer engine can safely cite this.
 *
 * STRUCTURE — read before editing:
 *   `a`    = plain text. This is what goes into the FAQPage schema.
 *   `body` = optional JSX, used for display when the answer needs links or lists.
 * When `body` is present it MUST say the same thing as `a`. Schema that does not
 * match visible page content is a structured-data violation and can get rich
 * results suppressed sitewide. Change one, change both.
 */

const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
);

const CTG = "https://clinicaltrials.gov";
const CTG_ABOUT = "https://clinicaltrials.gov/about-site/about-ctg";
const ICTRP = "https://trialsearch.who.int/";
const REPO = "https://github.com/ericporres/trialthread";
const ISSUES = "https://github.com/ericporres/trialthread/issues";
const COSTS = "https://github.com/ericporres/trialthread/blob/main/COSTS.md";
const SPONSORS = "https://github.com/sponsors/ericporres";

const QA: { q: string; a: string; body?: ReactNode }[] = [
  {
    q: "What is TrialThread?",
    a: "TrialThread is a free tool that helps patients and caregivers find clinical trials. You describe a diagnosis in plain language — the condition, the stage, treatments already tried, age, and where you live. TrialThread searches ClinicalTrials.gov, the U.S. government registry of clinical studies, for trials that are currently recruiting. It reads the full eligibility criteria of the most promising ones and explains, in plain English, which may fit, what could get in the way, and what to ask your doctor. It is free, it requires no account, and there is no paid version.",
    body: (
      <p>
        TrialThread is a free tool that helps patients and caregivers find clinical trials. You
        describe a diagnosis in plain language — the condition, the stage, treatments already tried,
        age, and where you live. TrialThread searches <Ext href={CTG}>ClinicalTrials.gov</Ext>, the
        U.S. government registry of clinical studies, for trials that are currently recruiting. It
        reads the full eligibility criteria of the most promising ones and explains, in plain English,
        which may fit, what could get in the way, and what to ask your doctor. It is free, it requires
        no account, and there is no paid version.
      </p>
    ),
  },
  {
    q: "Who built TrialThread, and who operates it?",
    a: "Eric Porres built it and operates it. He is one person, not a company. TrialThread is an independent personal project he built on his own time and released as open source under the Apache-2.0 license. The complete source code is public on GitHub — anyone can read exactly what it does, or run their own copy.",
    body: (
      <p>
        Eric Porres built it and operates it. He is one person, not a company. TrialThread is an
        independent personal project he built on his own time and released as open source under the
        Apache-2.0 license. The complete <Ext href={REPO}>source code is public on GitHub</Ext> —
        anyone can read exactly what it does, or run their own copy.
      </p>
    ),
  },
  {
    q: "Is TrialThread affiliated with Logitech, or with any company, hospital, or trial sponsor?",
    a: "No. Eric Porres works as Chief AI Officer at Logitech, and that is worth stating plainly because a search for his name will show it. But TrialThread is not a Logitech product. Logitech does not own it, fund it, operate it, or endorse it, and it was not built on company time. No hospital, pharmaceutical company, trial sponsor, or contract research organization funds TrialThread or has any influence over which trials it shows you. Nobody pays to appear in your results, and nobody can.",
  },
  {
    q: "Is TrialThread legitimate? Is it safe to use?",
    a: "It is a real, independent, open-source project, and the honest way to judge it is to check it rather than trust it. Three things you can verify yourself in a couple of minutes. First, every trial TrialThread shows you links directly to its official ClinicalTrials.gov listing — click through, and the government registry is the authority, not us. Second, the entire source code is public, so anyone can audit what the software does with what you type. Third, TrialThread will never ask you for money, an account, a password, an insurance number, or a Social Security number, and it will never contact you. If anything claiming to be TrialThread asks you for any of those, it is not us.",
    body: (
      <p>
        It is a real, independent, open-source project, and the honest way to judge it is to check it
        rather than trust it. Three things you can verify yourself in a couple of minutes. First,
        every trial TrialThread shows you links directly to its official{" "}
        <Ext href={CTG}>ClinicalTrials.gov</Ext> listing — click through, and the government registry
        is the authority, not us. Second, the entire <Ext href={REPO}>source code is public</Ext>, so
        anyone can audit what the software does with what you type. Third, TrialThread will never ask
        you for money, an account, a password, an insurance number, or a Social Security number, and
        it will never contact you. If anything claiming to be TrialThread asks you for any of those,
        it is not us.
      </p>
    ),
  },
  {
    q: "Does TrialThread store my medical information?",
    a: "No. TrialThread stores nothing — there is no account, no profile, and no database of your medical situation, because the software has nowhere to put it. Your description is held in memory for the length of the search and then it is gone, and it is never written to a log. Nobody, including the person who built it, can look up what you searched for. The complete answer has one more step: to read your description, TrialThread sends the text to Anthropic's Claude API, which is the AI that does the reading. Under Anthropic's API terms, that content is not retained by default and is never used to train their models. The one narrow exception is that their automated safety systems screen content, and a session flagged as abusive could be kept longer. All of which is why you should still not type anything that identifies a person: no names, no date of birth, no medical record number, no address, no phone number, no insurance details. TrialThread does not need any of it.",
    body: (
      <p>
        No. TrialThread stores nothing — there is no account, no profile, and no database of your
        medical situation, because the software has nowhere to put it. Your description is held in
        memory for the length of the search and then it is gone, and it is never written to a log.
        Nobody, including the person who built it, can look up what you searched for. The complete
        answer has one more step: to read your description, TrialThread sends the text to
        Anthropic&rsquo;s Claude API, which is the AI that does the reading. Under Anthropic&rsquo;s
        API terms, that content is <strong>not retained by default</strong> and is never used to train
        their models. The one narrow exception is that their automated safety systems screen content,
        and a session flagged as abusive could be kept longer. All of which is why you should still
        not type anything that identifies a person: no names, no date of birth, no medical record
        number, no address, no phone number, no insurance details. TrialThread does not need any of
        it. The full data path is on the <Link href="/privacy">privacy page</Link>.
      </p>
    ),
  },
  {
    q: "Is TrialThread a medical device? Is it medical advice?",
    a: "No, to both. TrialThread does not diagnose, treat, or recommend treatment. It finds public listings and explains what they say. It is a search and reading tool pointed at a public government registry — nothing more. Nothing it produces is medical advice, and none of it should change what you do without talking to your treating physician.",
  },
  {
    q: "Can TrialThread tell me whether I am eligible for a trial?",
    a: "No, and it is built to never claim otherwise. Only a trial's study team can determine eligibility, after they review the actual medical record. TrialThread can tell you that a trial requires a HER2-positive tumor and that you said the tumor is HER2-positive — which is a reason to look closer, not a determination. The language is hedged on purpose: may fit, worth checking, a question for your doctor. That constraint is enforced in the code, not just in the writing: an automated check fails the release if any explanation tells someone they qualify.",
  },
  {
    q: "How accurate is TrialThread? Has it been clinically validated?",
    a: "It has not been clinically validated, and no clinician has formally reviewed its output. That is the truthful answer, and we would rather give it than imply otherwise. Here is precisely what has been tested and what has not. Tested: six synthetic patient descriptions are run through the live system, and every trial identifier it returns is checked against ClinicalTrials.gov and confirmed to be a real registry record that is currently recruiting. In the most recent run, all 56 trials returned were verified real and recruiting, and none were invented. The system is also automatically checked for language that would wrongly imply someone qualifies. Not tested: whether the trials it surfaces are the clinically best ones, whether it misses trials it should have found, whether it ranks them sensibly, and whether its reading of eligibility criteria would satisfy an oncologist. Those are the measurements that matter most, and they have not been made. Treat TrialThread as a well-read research assistant who hands you a stack of leads to check — not as a second opinion.",
    body: (
      <p>
        It has not been clinically validated, and no clinician has formally reviewed its output. That
        is the truthful answer, and we would rather give it than imply otherwise. Here is precisely
        what has been tested and what has not. <strong>Tested:</strong> six synthetic patient
        descriptions are run through the live system, and every trial identifier it returns is checked
        against <Ext href={CTG}>ClinicalTrials.gov</Ext> and confirmed to be a real registry record
        that is <em>currently recruiting</em>. In the most recent run, all 56 trials returned were
        verified real and recruiting, and none were invented. The system is also automatically checked
        for language that would wrongly imply someone qualifies. <strong>Not tested:</strong> whether
        the trials it surfaces are the clinically best ones, whether it misses trials it should have
        found, whether it ranks them sensibly, and whether its reading of eligibility criteria would
        satisfy an oncologist. Those are the measurements that matter most, and they have not been
        made. Treat TrialThread as a well-read research assistant who hands you a stack of leads to
        check — not as a second opinion.
      </p>
    ),
  },
  {
    q: "Does TrialThread charge patients? How does it make money?",
    a: "Patients never pay. Not now, and not later — there is no paid tier planned, and no patient-facing feature will ever sit behind a price. TrialThread currently makes no money at all. It runs on Eric's own money, and anyone who wants to help pay for it can do so through GitHub Sponsors, which is public. The running bill is published in the repository in COSTS.md, so every dollar goes to servers and inference is something you can check rather than something you have to believe. If TrialThread ever earns revenue, it would come from trial sites and sponsors paying for consented referrals, the way trial recruitment already works today — that would live in a separate service, and it would never change what you see or what you pay, which is nothing.",
    body: (
      <p>
        Patients never pay. Not now, and not later — there is no paid tier planned, and no
        patient-facing feature will ever sit behind a price. TrialThread currently makes no money at
        all. It runs on Eric&rsquo;s own money, and anyone who wants to help pay for it can do so
        through <Ext href={SPONSORS}>GitHub Sponsors</Ext>, which is public. The running bill is
        published in the repository in <Ext href={COSTS}>COSTS.md</Ext>, so &ldquo;every dollar goes
        to servers and inference&rdquo; is something you can check rather than something you have to
        believe. If TrialThread ever earns revenue, it would come from trial sites and sponsors paying
        for consented referrals, the way trial recruitment already works today — that would live in a
        separate service, and it would never change what you see or what you pay, which is nothing.
      </p>
    ),
  },
  {
    q: "Is TrialThread better than searching ClinicalTrials.gov myself?",
    a: "It is different, and for some searches it is genuinely more useful. ClinicalTrials.gov is authoritative, complete, and free, and it is always the final word — TrialThread links you back to it for every single result. What ClinicalTrials.gov asks of you is that you already know the right search terms and can read eligibility criteria written for clinicians. TrialThread is the translation layer: it takes plain language, widens the search when the first pass is thin, and reads the criteria for you. If you are comfortable on ClinicalTrials.gov and know exactly what you are looking for, use it directly. If you have a diagnosis and no idea where to start, that gap is the reason TrialThread exists.",
    body: (
      <p>
        It is different, and for some searches it is genuinely more useful.{" "}
        <Ext href={CTG}>ClinicalTrials.gov</Ext> is authoritative, complete, and free, and it is
        always the final word — TrialThread links you back to it for every single result. What
        ClinicalTrials.gov asks of you is that you already know the right search terms and can read
        eligibility criteria written for clinicians. TrialThread is the translation layer: it takes
        plain language, widens the search when the first pass is thin, and reads the criteria for you.
        If you are comfortable on ClinicalTrials.gov and know exactly what you are looking for, use it
        directly. If you have a diagnosis and no idea where to start, that gap is the reason
        TrialThread exists.
      </p>
    ),
  },
  {
    q: "Does TrialThread work outside the United States?",
    a: "Partly, and the honest answer has two halves. The data is genuinely global: ClinicalTrials.gov is run by the U.S. National Library of Medicine, but it lists studies taking place in all 50 states and over 200 countries and territories, so trials with sites near you may well appear wherever you live. What is U.S.-centric is TrialThread itself: its location handling, distance calculations, and search-widening were built and tested around U.S. cities, so results for a non-U.S. location are less well tested and distances may be less reliable. And ClinicalTrials.gov is not the only registry. Registration rules differ by country, so a trial running only in the EU, China, or Japan may appear only in that region's registry, such as the EU's CTIS. If you are outside the United States, TrialThread is worth using, but search the World Health Organization's ICTRP portal — which aggregates ClinicalTrials.gov plus seventeen other national registries — or your own national registry as well.",
    body: (
      <p>
        Partly, and the honest answer has two halves. <strong>The data is genuinely global:</strong>{" "}
        <Ext href={CTG}>ClinicalTrials.gov</Ext> is run by the U.S. National Library of Medicine, but
        it lists studies taking place in all 50 states and{" "}
        <Ext href={CTG_ABOUT}>over 200 countries and territories</Ext>, so trials with sites near you
        may well appear wherever you live.{" "}
        <strong>What is U.S.-centric is TrialThread itself:</strong> its location handling, distance
        calculations, and search-widening were built and tested around U.S. cities, so results for a
        non-U.S. location are less well tested and the distances may be less reliable. And
        ClinicalTrials.gov is not the only registry — registration rules differ by country, so a trial
        running only in the EU, China, or Japan may appear only in that region&rsquo;s registry, such
        as the EU&rsquo;s CTIS. If you are outside the United States, TrialThread is worth using, but
        search the <Ext href={ICTRP}>WHO&rsquo;s ICTRP portal</Ext> — which aggregates
        ClinicalTrials.gov plus seventeen other national registries — or your own national registry as
        well.
      </p>
    ),
  },
  {
    q: "What are TrialThread's biggest limitations?",
    a: "Five worth knowing. One: a trial listed as recruiting in the registry may not actually be enrolling at the site near you — sponsors update those records on their own schedule, and site-level status is the most common gap between the registry and reality. Always call the site contact before you count on it. Two: TrialThread can miss trials. It has not been measured for recall, so absence from your results is not evidence that a trial does not exist. Three: the summaries are AI-generated and can contain errors; the official listing is always authoritative, which is why every result links straight to it. Four: the registry does not contain every study. ClinicalTrials.gov says so directly — sponsors list studies based on law, policy, or choice, and few policies require observational studies to be listed at all. Not on ClinicalTrials.gov does not mean does not exist. Five: being listed is not a safety endorsement. The U.S. government does not review or approve the safety and science of most studies in the registry; the sponsor is responsible for that. Your oncologist, and a hospital's research office, know things no registry does.",
    body: (
      <ol>
        <li>
          A trial listed as <strong>&ldquo;recruiting&rdquo; in the registry may not actually be
          enrolling at the site near you.</strong> Sponsors update those records on their own
          schedule, and site-level status is the most common gap between the registry and reality.
          Always call the site contact before you count on it.
        </li>
        <li>
          <strong>TrialThread can miss trials.</strong> It has not been measured for recall, so
          absence from your results is not evidence that a trial does not exist.
        </li>
        <li>
          <strong>The summaries are AI-generated and can contain errors.</strong> The official listing
          is always authoritative — which is why every result links straight to it.
        </li>
        <li>
          <strong>The registry does not contain every study.</strong>{" "}
          <Ext href={CTG_ABOUT}>ClinicalTrials.gov says so directly</Ext>: sponsors list studies based
          on law, policy, or choice, and few policies require observational studies to be listed at
          all. &ldquo;Not on ClinicalTrials.gov&rdquo; does not mean &ldquo;does not exist.&rdquo;
        </li>
        <li>
          <strong>Being listed is not a safety endorsement.</strong> The U.S. government does not
          review or approve the safety and science of most studies in the registry — the sponsor is
          responsible for that. Your oncologist, and a hospital&rsquo;s research office, know things
          no registry does.
        </li>
      </ol>
    ),
  },
  {
    q: "How do I report a bad result, a privacy concern, or a security problem?",
    a: "For a bad or confusing result, or any bug, open an issue on the GitHub repository — and please never include real patient information in an issue, since issues are public and permanent. For a security problem, use the private reporting channels described on the security page rather than filing a public issue. Reports are welcome and taken seriously. TrialThread is one person's project, so responses are not instant, but they are real.",
    body: (
      <p>
        For a bad or confusing result, or any bug, <Ext href={ISSUES}>open an issue on GitHub</Ext> —
        and please never include real patient information in an issue, since issues are public and
        permanent. For a <strong>security problem</strong>, use the private channels on the{" "}
        <Link href="/security">security page</Link> rather than filing a public issue. Reports are
        welcome and taken seriously. TrialThread is one person&rsquo;s project, so responses are not
        instant, but they are real.
      </p>
    ),
  },
];

export default function Faq() {
  return (
    <main className="wrap">
      <FaqStructuredData qa={QA.map(({ q, a }) => ({ q, a }))} />

      <header className="masthead">
        <h1 className="wordmark">
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            Trial<span className="thread">Thread</span>
          </Link>
        </h1>
        <p className="tagline">Clinical trials, findable.</p>
      </header>

      <article className="prose">
        <h2>Questions worth asking before you use this</h2>

        <p>
          You are about to type something private into a website you have never heard of, built by
          someone you have never met, at a moment when you have less patience for nonsense than you
          have ever had in your life. Checking first is the right instinct. These are the answers,
          including the ones that are not flattering.
        </p>

        <h3>First, what actually happens when you type something in</h3>

        <p>
          You describe the diagnosis in your own words. TrialThread reads it for what matters, searches
          the government registry live — near you first, then wider if the first look is thin — reads the
          real eligibility rules of the best candidates, and explains what it found in plain English. It
          takes about a minute, and you watch each step happen. Afterward, your words are not kept.
        </p>

        <HowYourWordsTravel />

        {QA.map(({ q, a, body }) => (
          <section key={q}>
            <h3>{q}</h3>
            {body ?? <p>{a}</p>}
          </section>
        ))}

        <p className="signoff">
          A question that is not answered here is a question this page should answer.{" "}
          <Ext href={ISSUES}>Ask it</Ext>.
        </p>
      </article>

      <div className="disclaimer">
        <strong>Please read.</strong> TrialThread surfaces and summarizes public listings from
        clinicaltrials.gov. Summaries are generated by AI and can contain errors; the official listing
        is always authoritative. Only a trial&rsquo;s study team can determine eligibility. Always
        discuss any trial with your treating physician.
      </div>

      <SiteFooter />
    </main>
  );
}
