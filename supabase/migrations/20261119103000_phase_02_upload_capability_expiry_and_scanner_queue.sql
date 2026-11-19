-- Phase 02: expire public upload capabilities and index pending malware scans.
-- Recovery: drop the partial index and column only if no application depends on
-- upload capability expiry; keep this additive migration immutable after apply.

alter table public.public_partnership_applications
  add column if not exists upload_token_expires_at timestamptz;

create index if not exists idx_partnership_attachments_pending_scan
  on public.public_partnership_attachments (uploaded_at, id)
  where scan_status = 'pending_scan';
