-- Phase 02 continuation: secure public application upload capability and idempotent submission.
alter table public.public_partnership_applications
  add column if not exists upload_token_hash text,
  add column if not exists submission_idempotency_key text;

create unique index if not exists public_partnership_applications_idempotency_uq
  on public.public_partnership_applications (submission_idempotency_key)
  where submission_idempotency_key is not null;

create index if not exists public_partnership_applications_upload_token_idx
  on public.public_partnership_applications (upload_token_hash)
  where upload_token_hash is not null;

comment on column public.public_partnership_applications.upload_token_hash is
  'SHA-256 hash of one-time public upload capability; raw token is returned only once.';
comment on column public.public_partnership_applications.submission_idempotency_key is
  'Client-generated UUID key to make public submission retries deterministic.';
