alter table public.public_partnership_applications
  add column if not exists request_fingerprint text;

comment on column public.public_partnership_applications.request_fingerprint is
  'SHA-256 canonical request fingerprint for public idempotency conflict detection.';
