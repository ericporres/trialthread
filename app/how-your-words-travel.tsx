"use client";

import { useEffect, useState } from "react";

/**
 * "How your words travel" — the one picture on the site.
 *
 * Audience: a frightened person reading this at 2am, on a phone, who has been
 * told to be careful about what they type into websites. Every decision here
 * serves that person:
 *
 *   - Plain language. No "pipeline," no "LLM," no "extraction."
 *   - The thread runs left to right and comes BACK to them. They are the start
 *     and the end of it, not an input to a system.
 *   - The privacy answer is the last thing on the graphic, in its own box.
 *   - Site palette (globals.css vars) and the Newsreader serif, so it reads as
 *     part of the page rather than an embedded diagram.
 *   - No animation. Motion is not reassuring to someone in crisis.
 *
 * Click (or Enter/Space) to enlarge — inline the type is small, and this is
 * read on phones by people who are tired. Esc or click anywhere closes it.
 *
 * Accessible: role="img" with <title>/<desc> carrying the full meaning, so a
 * screen-reader user gets the content rather than "image." The desc is the
 * whole story in prose — if you change the graphic, change the desc.
 */

function Diagram({ idSuffix }: { idSuffix: string }) {
  const t = `wtTitle-${idSuffix}`;
  const d = `wtDesc-${idSuffix}`;
  const arrow = `wt-arrow-${idSuffix}`;

  return (
    <svg
      viewBox="0 0 920 700"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby={`${t} ${d}`}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <title id={t}>How your words travel through TrialThread</title>
      <desc id={d}>
        You describe the diagnosis in your own words. TrialThread reads it for what matters — the
        condition, the stage, what has been tried, where you live. It searches the government trial
        registry live, starting near you and widening if the first pass is thin. It reads the actual
        eligibility rules of the best candidates. It returns a short ranked list, why each may or may
        not fit, a link to the official listing, and questions for your doctor. Afterward your words
        are not kept: there is no account, no database, and no record that could be looked up.
      </desc>

      <defs>
        <marker id={arrow} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path
            d="M0,1 L6,4 L0,7"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      {/* ── YOU ── */}
      <circle cx="70" cy="120" r="17" fill="none" stroke="var(--ink)" strokeWidth="1.6" />
      <path
        d="M45 158 a25 22 0 0 1 50 0"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <text
        x="70"
        y="188"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="var(--ink)"
        fontFamily="var(--sans)"
        letterSpacing="0.08em"
      >
        YOU
      </text>

      <rect x="120" y="70" width="286" height="96" rx="3" fill="var(--surface)" stroke="var(--line)" strokeWidth="1" />
      <path d="M120 112 L106 122 L120 132 Z" fill="var(--surface)" stroke="var(--line)" strokeWidth="1" />
      <text x="140" y="97" fontSize="14.5" fontStyle="italic" fill="var(--body)" fontFamily="var(--serif)">
        <tspan x="140" dy="0">&ldquo;My mother is 58. HER2-positive</tspan>
        <tspan x="140" dy="20">breast cancer, spread to the liver.</tspan>
        <tspan x="140" dy="20">Two treatments so far. We&rsquo;re</tspan>
        <tspan x="140" dy="20">outside Chicago.&rdquo;</tspan>
      </text>

      <text x="120" y="190" fontSize="12.5" fill="var(--muted)" fontFamily="var(--sans)">
        In your own words. No forms, no medical vocabulary, no account.
      </text>

      {/* ── THE THREAD ── */}
      <path
        d="M70 212 L70 252 Q70 266 84 266 L806 266 Q820 266 820 280 L820 395"
        fill="none"
        stroke="var(--teal-600)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="70" cy="212" r="3.5" fill="var(--teal-600)" />

      <text
        x="440"
        y="243"
        textAnchor="middle"
        fontSize="11.5"
        fontStyle="italic"
        fill="var(--muted)"
        fontFamily="var(--sans)"
      >
        about a minute · you watch each step happen
      </text>

      {/* station 1 */}
      <circle cx="150" cy="266" r="6" fill="var(--paper)" stroke="var(--teal-600)" strokeWidth="2" />
      <text x="150" y="296" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)" fontFamily="var(--sans)">
        1 · Read
      </text>
      <text x="150" y="316" textAnchor="middle" fontSize="12.5" fill="var(--body)" fontFamily="var(--sans)">
        <tspan x="150" dy="0">What matters here: the</tspan>
        <tspan x="150" dy="17">cancer, the stage, what</tspan>
        <tspan x="150" dy="17">has been tried, where</tspan>
        <tspan x="150" dy="17">you live.</tspan>
      </text>

      {/* station 2 */}
      <circle cx="390" cy="266" r="6" fill="var(--paper)" stroke="var(--teal-600)" strokeWidth="2" />
      <text x="390" y="296" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)" fontFamily="var(--sans)">
        2 · Search
      </text>
      <text x="390" y="316" textAnchor="middle" fontSize="12.5" fill="var(--body)" fontFamily="var(--sans)">
        <tspan x="390" dy="0">The government registry,</tspan>
        <tspan x="390" dy="17">live. Trials near you first —</tspan>
        <tspan x="390" dy="17">then wider, if the first</tspan>
        <tspan x="390" dy="17">look is thin.</tspan>
      </text>

      {/* station 3 */}
      <circle cx="620" cy="266" r="6" fill="var(--paper)" stroke="var(--teal-600)" strokeWidth="2" />
      <text x="620" y="296" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)" fontFamily="var(--sans)">
        3 · Screen
      </text>
      <text x="620" y="316" textAnchor="middle" fontSize="12.5" fill="var(--body)" fontFamily="var(--sans)">
        <tspan x="620" dy="0">Read the actual rules each</tspan>
        <tspan x="620" dy="17">trial sets — not just</tspan>
        <tspan x="620" dy="17">matching words.</tspan>
      </text>

      {/* station 4 */}
      <circle cx="820" cy="266" r="6" fill="var(--paper)" stroke="var(--teal-600)" strokeWidth="2" />
      <text x="820" y="296" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)" fontFamily="var(--sans)">
        4 · Explain
      </text>
      <text x="820" y="316" textAnchor="middle" fontSize="12.5" fill="var(--body)" fontFamily="var(--sans)">
        <tspan x="820" dy="0">In plain English —</tspan>
        <tspan x="820" dy="17">no jargon, no false</tspan>
        <tspan x="820" dy="17">reassurance.</tspan>
      </text>

      {/* ── WHAT COMES BACK ── */}
      <rect x="255" y="395" width="480" height="150" rx="3" fill="var(--teal-050)" stroke="var(--teal-100)" strokeWidth="1" />
      <rect x="255" y="395" width="3" height="150" fill="var(--teal-600)" />
      <path d="M820 395 L737 420" fill="none" stroke="var(--teal-600)" strokeWidth="2" strokeLinecap="round" />

      <text x="278" y="422" fontSize="12.5" fontWeight="700" fill="var(--ink)" fontFamily="var(--sans)">
        What comes back
      </text>

      {[
        "A handful of trials — ranked, not a wall of results",
        "Why each one may fit — and what might not",
        "A link to the official listing. That page decides.",
        "Questions to bring to your doctor",
      ].map((line, i) => (
        <g key={line}>
          <circle cx="284" cy={447 + i * 24} r="3.5" fill="var(--teal-600)" />
          <text x="298" y={451 + i * 24} fontSize="12.5" fill="var(--body)" fontFamily="var(--sans)">
            {line}
          </text>
        </g>
      ))}

      <path
        d="M251 470 L120 470"
        fill="none"
        stroke="var(--muted)"
        strokeWidth="1.4"
        strokeDasharray="4 4"
        markerEnd={`url(#${arrow})`}
      />
      <text x="186" y="462" textAnchor="middle" fontSize="11.5" fill="var(--muted)" fontFamily="var(--sans)">
        back to you
      </text>

      {/* ── AND THEN: NOTHING ── */}
      <rect x="50" y="580" width="820" height="72" rx="3" fill="var(--surface)" stroke="var(--line)" strokeWidth="1" />
      <text x="74" y="607" fontSize="13" fontWeight="700" fill="var(--ink)" fontFamily="var(--sans)">
        What happens to your words afterward: nothing.
      </text>
      <text x="74" y="627" fontSize="12.5" fill="var(--body)" fontFamily="var(--sans)">
        They run this one search and are let go. No account. No database. No record anyone could look up.
      </text>
      <text x="74" y="645" fontSize="12" fontStyle="italic" fill="var(--muted)" fontFamily="var(--sans)">
        Which is why you should leave out names, birthdays, and record numbers — the search never needs them.
      </text>

      <text
        x="460"
        y="678"
        textAnchor="middle"
        fontSize="11.5"
        fontStyle="italic"
        fill="var(--muted)"
        fontFamily="var(--sans)"
      >
        TrialThread cannot tell you whether you qualify. Only a trial&rsquo;s team can do that. It can tell you where to look.
      </text>
    </svg>
  );
}

export function HowYourWordsTravel() {
  const [open, setOpen] = useState(false);

  // Esc closes. Body scroll locks while open — nothing worse than a modal you
  // can scroll behind.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <figure style={{ margin: "28px 0 32px", padding: 0 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Enlarge the diagram: how your words travel through TrialThread"
          style={{
            display: "block",
            width: "100%",
            padding: 0,
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            background: "var(--paper)",
            cursor: "zoom-in",
            overflow: "hidden",
          }}
        >
          <Diagram idSuffix="inline" />
        </button>
        <figcaption
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "var(--muted)",
            fontFamily: "var(--sans)",
            textAlign: "center",
          }}
        >
          Click the diagram to enlarge it.
        </figcaption>
      </figure>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="How your words travel through TrialThread — enlarged"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(30, 27, 24, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "3vmin",
            cursor: "zoom-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(1400px, 96vw)",
              maxHeight: "94vh",
              overflow: "auto",
              background: "var(--paper)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius)",
              padding: "clamp(12px, 2vw, 28px)",
              cursor: "default",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              autoFocus
              aria-label="Close the enlarged diagram"
              style={{
                position: "absolute",
                top: 10,
                right: 12,
                zIndex: 1,
                border: "1px solid var(--line-strong)",
                background: "var(--surface)",
                color: "var(--body)",
                borderRadius: "var(--radius)",
                padding: "4px 10px",
                fontSize: 13,
                fontFamily: "var(--sans)",
                cursor: "pointer",
              }}
            >
              Close ✕
            </button>
            <Diagram idSuffix="modal" />
          </div>
        </div>
      )}
    </>
  );
}
