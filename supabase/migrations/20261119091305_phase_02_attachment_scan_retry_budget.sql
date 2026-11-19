-- Phase 02 malware scanner retry budget and operator recovery.
-- Additive: existing pending/clean/infected/rejected rows begin at zero attempts.
-- Recovery: if rollback is required, remove the retry API/worker usage first,
-- then drop the non-negative constraint and scan_attempts column.

alter table public.public_partnership_attachments
  add column if not exists scan_attempts integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='public_partnership_attachments_scan_attempts_nonnegative'
      and conrelid='public.public_partnership_attachments'::regclass
  ) then
    alter table public.public_partnership_attachments
      add constraint public_partnership_attachments_scan_attempts_nonnegative
      check (scan_attempts >= 0);
  end if;
end $$;
