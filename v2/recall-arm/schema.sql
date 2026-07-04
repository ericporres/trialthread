-- Semantic recall arm — trial archetype index (Postgres + pgvector)
-- One row per RECRUITING study. No patient data ever lands in this schema.

create extension if not exists vector;

create table if not exists trial_archetypes (
  nct_id        text primary key,
  archetype     text not null,            -- LLM-synthesized "who this trial wants" (~120 words)
  embedding     vector(1024) not null,    -- Voyage embedding of archetype
  brief_title   text not null,
  conditions    text[] not null default '{}',
  phases        text[] not null default '{}',
  overall_status text not null,           -- ingest filters to RECRUITING; kept for delta reconciliation
  last_update_posted date,                -- ctgov lastUpdatePostDate — drives delta ingest
  archetype_model text not null,          -- provenance: which model wrote the archetype
  embedded_at   timestamptz not null default now()
);

-- ANN index. Rebuild cost is trivial at ~45K rows; tune m/ef_construction only if recall demands it.
create index if not exists trial_archetypes_embedding_hnsw
  on trial_archetypes using hnsw (embedding vector_cosine_ops);

create index if not exists trial_archetypes_status_idx on trial_archetypes (overall_status);
create index if not exists trial_archetypes_updated_idx on trial_archetypes (last_update_posted);
