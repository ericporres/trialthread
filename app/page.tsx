"use client";

import { useRef, useState } from "react";
import { tt } from "@/lib/analytics";
import type { PatientProfile, RankedMatch, StreamEvent } from "@/lib/types";

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
  const resultsRef = useRef<HTMLDivElement>(null);

  async function run() {
    tt({ e: "search_started" });
    setPhase("running");
    setProfile(null);
    setLedger([]);
    setMatches(null);
    setTotals(null);
    setError(null);

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          handleEvent(JSON.parse(line) as StreamEvent);
        }
      }
      setPhase((p) => (p === "running" ? "done" : p));
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
        TrialThread searches the {""}
        <a href="https://clinicaltrials.gov" target="_blank" rel="noreferrer">
          U.S. clinical trials registry
        </a>{" "}
        the way a research nurse would: it starts near you, reads the actual eligibility criteria,
        widens the search when the first pass is thin, and explains every match in plain English.
      </p>

      <div className="honesty">
        <strong>What this is — and isn&rsquo;t.</strong> TrialThread finds and explains publicly
        listed studies. It is not medical advice, it cannot confirm you qualify — only a trial team
        can — and it is not a substitute for your care team. Nothing you type here is stored:
        your description is used for this search and then discarded.
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
      <footer className="site">
        <a href="/about">About — why this exists</a> ·{" "}
        <a href="https://github.com/sponsors/ericporres" target="_blank" rel="noreferrer">
          Support TrialThread ♥
        </a>{" "}
        · Data:{" "}
        <a href="https://clinicaltrials.gov" target="_blank" rel="noreferrer">ClinicalTrials.gov</a>, fetched live ·
        No accounts, no stored health data · <a href="/llms.txt">llms.txt</a> · © {new Date().getFullYear()} TrialThread
      </footer>
    </main>
  );
}
