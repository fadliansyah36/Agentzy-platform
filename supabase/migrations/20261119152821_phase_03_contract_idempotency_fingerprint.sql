-- Phase 03 continuation: bind create-contract idempotency keys to request payload fingerprints.
alter table public.contracts
  add column if not exists idempotency_fingerprint text;
