# v2 — Semantic Recall Arm (scaffold)

Read [SPEC.md](SPEC.md) first; it is the contract. This folder compiles nothing into the app and changes no v1 behavior.

| File | What it is |
|------|-----------|
| `SPEC.md` | Bounded spec: design, the boundary that must not move, eval gate, cost envelope |
| `schema.sql` | pgvector schema — trial archetypes only, never patient data |
| `ingest.mjs` | Nightly ingest skeleton (pager → archetype synthesis → Voyage embed → upsert) |
| `retrieve.ts` | Typed query-side contract; `semanticCandidates()` is the seam `lib/loop.ts` will call as one more broadening rung |

Env additions when built: `DATABASE_URL`, `VOYAGE_API_KEY` (query side + ingest).

The one-sentence version of the whole design: **embeddings widen the net; the LLM criteria parse still decides what's in it.**

Lineage: the hybrid dense+lexical fusion and the "embed a synthesized description, not raw text" move both come from the deep-memory v3 retrieval work ([deep-memory](https://github.com/ericporres/deep-memory)), where hybrid lifted lexical hit@10 from 70% to 87% without hurting semantic recall.
