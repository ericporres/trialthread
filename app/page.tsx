"use client";

import { useRef, useState } from "react";
import { tt } from "@/lib/analytics";
import type { PatientProfile, RankedMatch, StreamEvent, UrgentConcern } from "@/lib/types";
import { SiteFooter } from "./site-footer";

const EXAMPLES = [
  {
    label: "Metastatic breast cancer",
    text: "My mother is 58, diagnosed with HER2-positive metastatic breast cancer that has spread to her liver. She's been on trastuzumab and taxane chemo. ER-negative. She lives near White Plains, NY and is still active and independent.",
  },
  {
    label: "Lung cancer, EGFR",
    text: "I'm a 64-year-old man with stage IV non-small cell lung cancer, EGFR exon 19 deletion. Osimertinib stopped working after 18 months. No brain metastases as of my last scan. I live in Stamford, Connecticut.",
  },
  {
    label: "Pancreatic cancer",
    text: "My husband, 61, was just diagnosed with locally advanced pancreatic adenocarcinoma. He hasn't started treatment yet. We're in northern New Jersey and willing to travel anywhere in the Northeast.",
  },
];

type Phase = "idle" | "running" | "done" | "error";

interface LedgerLine {
  kind: "status" | "pass" | "broaden";
  text: string;
}

export default function Home() {
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [ledger, setLedger] = useState<LedgerLine[]>([]);
  const [matches, setMatches] = useState<RankedMatch[] | null>(null);
  const [totals, setTotals] = useState<{ considered: number; passes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urgent, setUrgent] = useState<UrgentConcern[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function run() {
    tt({ e: "search_started" });
    setPhase("running");
    setProfile(null);
    setLedger([]);
    setMatches(null);
    setTotals(null);
    setError(null);
    setUrgent([]);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawTerminal = false; // did a results/error event arrive before the stream closed?

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as StreamEvent;
          if (ev.type === "results" || ev.type === "error") sawTerminal = true;
          handleEvent(ev);
        }
      }
      if (!sawTerminal) {
        // The stream closed with no terminal event. On this app that means the
        // serverless function hit its 300s maxDuration and Vercel killed it
        // mid-search — the route's finally/catch never ran, so no error event
        // reached us. Previously this fell through to "done" and the person was
        // left staring at an empty non-result with no explanation. Say what happened.
        setError(
          "The search ran longer than expected and timed out before finishing. Please try again — and if it keeps happening, try describing the condition in a sentence or two rather than a full report."
        );
        setPhase("error");
      } else {
        setPhase((p) => (p === "running" ? "done" : p));
      }
    } catch (e) {
      tt({ e: "search_error", stage: "client" });
      setError((e as Error).message);
      setPhase("error");
    }
  }

  function handleEvent(e: StreamEvent) {
    switch (e.type) {
      case "status":
        setLedger((l) => [...l, { kind: "status", text: e.message }]);
        break;
      case "profile":
        tt({ e: "profile_ok", hasLocation: Boolean(e.profile.location) });
        setProfile(e.profile);
        break;
      case "safety":
        // Arrives before the search starts, so it is on screen while the person
        // is still waiting — not buried under ten trials ninety seconds later.
        // Deliberately NOT sent to analytics: the fact that someone disclosed
        // suicidal ideation is the single most sensitive thing that could
        // possibly cross this wire. It is displayed and then forgotten, like
        // everything else here.
        setUrgent(e.urgent);
        break;
      case "pass":
        setLedger((l) => [
          ...l,
          {
            kind: "pass",
            text: `pass ${e.pass} · ${e.found} new trials · ${e.strong} strong candidate${e.strong === 1 ? "" : "s"} so far (${e.scored} screened)`,
          },
        ]);
        break;
      case "broaden":
        setLedger((l) => [...l, { kind: "broaden", text: `widening the net → ${e.strategy}` }]);
        break;
      case "results": {
        const count = (v: string) => e.matches.filter((m) => m.deep.verdict === v).length;
        if (e.matches.length === 0) {
          tt({ e: "zero_results", passes: e.passes });
        } else {
          tt({
            e: "results",
            n: e.matches.length,
            strong: count("likely-eligible"),
            uncertain: count("uncertain"),
            unlikely: count("likely-ineligible"),
            passes: e.passes,
            considered: e.totalConsidered,
          });
        }
        setMatches(e.matches);
        setTotals({ considered: e.totalConsidered, passes: e.passes });
        setPhase("done");
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
        break;
      }
      case "error":
        tt({ e: "search_error", stage: e.stage ?? "server" });
        setError(e.message);
        setPhase("error");
        break;
    }
  }

  const running = phase === "running";
  const likely = matches?.filter((m) => m.deep.verdict === "likely-eligible").length ?? 0;

  return (
    <main className="wrap">
      <header className="masthead">
        <h1 className="wordmark">
          Trial<span className="thread">Thread</span>
        </h1>
        <p className="tagline">Clinical trials, findable.</p>
      </header>

      <p className="hero">Describe the diagnosis. We&rsquo;ll read the trials you&rsquo;d never find on your own.</p>
      <p className="hero-sub">
        TrialThread searches clinicaltrials.gov — the government registry of nearly 600,000 studies —
        the way you wish someone would: it starts near you, reads the actual eligibility criteria
        instead of matching keywords, widens the search when the first pass is thin, and explains
        every match in plain English.
      </p>

      <div className="honesty">
        <strong>What this is — and isn&rsquo;t.</strong> TrialThread finds and explains publicly
        listed studies. It is not medical advice, it cannot confirm you qualify — only a trial team
        can — and it is not a substitute for your care team.{" "}
        <strong>Nothing you type here is stored.</strong> There is no account and no database; an
        AI service reads your description to run the search, and does not keep it or train on it.
        Please leave out names, dates of birth, and medical record numbers —{" "}
        <a href="/privacy">here is exactly what happens to what you type</a>.
      </div>

      <section aria-label="Describe the condition">
        <label className="input-label" htmlFor="desc">
          In your own words: the condition, stage, treatments tried, age, and where you live
        </label>
        <textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='For example: "My father is 67 with newly diagnosed glioblastoma, had surgery but not radiation yet. We live outside Chicago."'
          disabled={running}
        />
        <div className="examples" aria-label="Example descriptions">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              className="example-chip"
              onClick={() => setDescription(ex.text)}
              disabled={running}
            >
              Try: {ex.label}
            </button>
          ))}
        </div>
        <div className="run-row">
          <button className="run-btn" onClick={run} disabled={running || description.trim().length < 20}>
            {running ? "Searching…" : "Find trials"}
          </button>
          <span className="stateless-note">No account. Nothing stored. Typically 1–2 minutes.</span>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
      </section>

      {/* ── SAFETY BANNER ───────────────────────────────────────────────────
          Sits directly under the search box, above the progress ledger and
          above every trial, and appears within seconds — before the search
          finishes. Not dismissible. role="alert" so a screen reader announces
          it immediately rather than when it reaches this point in the document.

          The tone is deliberate. No sirens, no red, no capital letters. Someone
          reading this is already frightened; alarming them further is not care,
          it is theatre. The words below were written to be read by an exhausted
          person at 2am who has just admitted something enormous to a website.
          Change them carefully. */}
      {urgent.length > 0 && (
        <section className="safety" role="alert" aria-label="Please read this first">
          {urgent.some((u) => u.kind === "self_harm") && (
            <div className="safety-block">
              <strong>Before anything else — please talk to someone.</strong>
              <p>
                You said something that matters more than any trial on this page. In the U.S. you
                can call or text <strong>988</strong>, the Suicide &amp; Crisis Lifeline, any hour
                of any day, and reach a real person. You can also chat at{" "}
                <a href="https://988lifeline.org" target="_blank" rel="noreferrer">
                  988lifeline.org
                </a>
                .
              </p>
              <p>
                Caring for someone you love through cancer is one of the heaviest things a person
                can do, and doing it while carrying this is heavier still. You deserve support of
                your own — not only after, but now.
              </p>
            </div>
          )}

          {urgent.some((u) => u.kind === "medical_emergency") && (
            <div className="safety-block">
              <strong>This sounds like it needs help right now.</strong>
              <p>
                What you have described sounds like a medical emergency. Please call <strong>911</strong>{" "}
                or go to the nearest emergency room — do not wait for this search. A clinical trial
                cannot help with something that is happening in the next few minutes, and an
                emergency department can.
              </p>
            </div>
          )}

          <p className="safety-foot">
            The trial search is still running below, and your results will appear as usual.
          </p>
        </section>
      )}

      {profile && (
        <section aria-label="What we understood">
          <h2 className="section-label">What we understood</h2>
          <div className="chips">
            <span className="chip">{profile.condition}</span>
            {profile.stage && <span className="chip">{profile.stage}</span>}
            {profile.biomarkers.map((b) => (
              <span className="chip" key={b}>{b}</span>
            ))}
            {profile.priorTreatments.map((t) => (
              <span className="chip" key={t}>prior: {t}</span>
            ))}
            {profile.age != null && <span className="chip">age {profile.age}</span>}
            {profile.location && <span className="chip">near {profile.location.label}</span>}
            {profile.redFlags.map((r) => (
              <span className="chip flag" key={r}>may affect eligibility: {r}</span>
            ))}
          </div>
          <p className="chips-note">Got something wrong? Edit your description above and search again.</p>
        </section>
      )}

      {ledger.length > 0 && (
        <section aria-label="Search progress">
          <h2 className="section-label">The search, as it runs</h2>
          <div className="ledger" aria-live="polite">
            {ledger.map((line, i) => (
              <span key={i} className={`ledger-line ${line.kind === "pass" ? "pass" : line.kind === "broaden" ? "broaden" : "dim"}`}>
                {line.text}
              </span>
            ))}
            {running && <span className="ledger-line cursor" />}
          </div>
        </section>
      )}

      {matches && totals && (
        <div ref={resultsRef}>
          <section aria-label="Results">
            <h2 className="section-label">Results</h2>
            {matches.length === 0 ? (
              <div className="empty-state">
                <h3>No strong candidates in this search</h3>
                <p>
                  We screened {totals.considered} recruiting trials across {totals.passes} passes and
                  none cleared our bar. That does not mean nothing exists — criteria language varies,
                  and new trials post weekly.
                </p>
                <p>
                  Try adding more detail (biomarkers, prior treatments), widening your location, or
                  searching again in a week or two.
                </p>
              </div>
            ) : (
              <>
                <p className="results-summary">
                  {likely > 0
                    ? `${likely} trial${likely === 1 ? "" : "s"} worth discussing with your care team.`
                    : "Some possibilities — each needs a conversation with your care team."}
                </p>
                <p className="results-sub">
                  Screened {totals.considered} recruiting trials in {totals.passes} search{totals.passes === 1 ? "" : "es"};
                  read full eligibility criteria for the top {matches.length}. Ranked by apparent fit.
                </p>
                <ul className="match-list">
                  {matches.map((m) => (
                    <li key={m.trial.nctId}>
                      <details
                        className="match"
                        onToggle={(ev) => {
                          if ((ev.target as HTMLDetailsElement).open) tt({ e: "trial_expanded", rank: m.rank });
                        }}
                      >
                        <summary>
                          <span className="match-rank">{String(m.rank).padStart(2, "0")}</span>
                          <span>
                            <span className="match-title">{m.trial.title}</span>
                            <span className="match-meta">
                              {[
                                m.trial.phases.length ? m.trial.phases.join("/").replaceAll("PHASE", "Phase ") : null,
                                m.trial.nearestSite
                                  ? m.trial.nearestSite.distanceMi != null
                                    ? `${m.trial.nearestSite.facility}, ${m.trial.nearestSite.city} — ${m.trial.nearestSite.distanceMi} mi`
                                    : `${m.trial.nearestSite.city}${m.trial.nearestSite.state ? ", " + m.trial.nearestSite.state : ""}`
                                  : null,
                                m.trial.nctId,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                          <span
                            className={`verdict ${
                              m.deep.verdict === "likely-eligible"
                                ? "likely"
                                : m.deep.verdict === "uncertain"
                                ? "uncertain"
                                : "unlikely"
                            }`}
                          >
                            {m.deep.verdict === "likely-eligible"
                              ? "✓ May qualify"
                              : m.deep.verdict === "uncertain"
                              ? "? Worth checking"
                              : "− Unlikely fit"}
                          </span>
                        </summary>
                        <div className="match-body">
                          <p>{m.deep.plainSummary}</p>
                          {m.deep.matchPoints.length > 0 && (
                            <>
                              <h4>Why you may fit</h4>
                              <ul>
                                {m.deep.matchPoints.map((p, i) => (
                                  <li key={i}>{p}</li>
                                ))}
                              </ul>
                            </>
                          )}
                          {m.deep.concerns.length > 0 && (
                            <>
                              <h4>What could get in the way</h4>
                              <ul className="concerns">
                                {m.deep.concerns.map((c, i) => (
                                  <li key={i}>{c}</li>
                                ))}
                              </ul>
                            </>
                          )}
                          {m.deep.questionsForDoctor.length > 0 && (
                            <>
                              <h4>Questions for your doctor</h4>
                              <ul>
                                {m.deep.questionsForDoctor.map((q, i) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </>
                          )}
                          <div className="match-links">
                            <a
                              href={m.trial.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => tt({ e: "nct_click", rank: m.rank })}
                            >
                              Official listing ({m.trial.nctId}) ↗
                            </a>
                            {m.trial.centralContacts[0]?.phone && (
                              <span>Trial contact: {m.trial.centralContacts[0].name ?? "study team"} · {m.trial.centralContacts[0].phone}</span>
                            )}
                          </div>
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      )}

      <div className="disclaimer">
        <strong>Please read.</strong> TrialThread surfaces and summarizes public listings from
        clinicaltrials.gov. Summaries are generated by AI and can contain errors; the official
        listing is always authoritative. Only a trial&rsquo;s study team can determine eligibility.
        Always discuss any trial with your treating physician before contacting a site. If this is
        an emergency, call your doctor or local emergency services.
      </div>
      <SiteFooter />
    </main>
  );
}
