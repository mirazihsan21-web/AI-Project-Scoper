-- Initial schema for the AI Project Scoper.
-- Only the server touches these tables, with the secret key (service_role). Browsers never query Supabase
-- directly: RLS is on with no policies, and anon/authenticated get no grants, so the Data API exposes nothing.

-- A scope generated from a visitor's brief.
-- The id is a random UUID because it is the unguessable share link (/s/<id>).
create table public.scopes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  brief text not null check (char_length(brief) between 1 and 10000),
  scope jsonb not null,
  -- Snapshot of the pricing shown to the visitor, so later rate changes do not rewrite old quotes.
  estimate jsonb not null,
  model text not null,
  latency_ms integer not null check (latency_ms >= 0),
  input_tokens integer not null check (input_tokens >= 0),
  output_tokens integer not null check (output_tokens >= 0)
);

-- "Book a call" submissions, one per click, linked to the scope they asked about.
create table public.leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  scope_id uuid not null references public.scopes (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  company text check (char_length(company) <= 200),
  notes text check (char_length(notes) <= 5000),
  -- Set once the owner notification email is sent; null means it still needs sending.
  notified_at timestamptz
);

-- Postgres does not index foreign keys automatically.
create index leads_scope_id_idx on public.leads (scope_id);

-- One row per scope request, used for per-visitor rate limiting.
-- Stores a salted hash of the IP, never the IP itself.
create table public.scope_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  ip_hash text not null
);

create index scope_requests_ip_hash_created_at_idx on public.scope_requests (ip_hash, created_at desc);

alter table public.scopes enable row level security;
alter table public.leads enable row level security;
alter table public.scope_requests enable row level security;

-- New projects no longer grant table access by default (Supabase change, 2026-04-28); be explicit both ways.
revoke all on public.scopes, public.leads, public.scope_requests from anon, authenticated;
grant select, insert, update, delete on public.scopes, public.leads, public.scope_requests to service_role;
