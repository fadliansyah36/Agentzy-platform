-- Phase 02 upload idempotency.
-- Additive/reversible: nullable metadata keeps existing attachments readable.
-- Recovery: drop the partial unique index and check constraint, then drop the
-- two nullable columns only if no upload retry relies on these identifiers.

alter table public.public_partnership_attachments
  add column if not exists upload_idempotency_key text,
  add column if not exists request_fingerprint text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='public_partnership_attachments_upload_idempotency_pair'
      and conrelid='public.public_partnership_attachments'::regclass
  ) then
    alter table public.public_partnership_attachments
      add constraint public_partnership_attachments_upload_idempotency_pair
      check (
        (upload_idempotency_key is null and request_fingerprint is null)
        or (
          upload_idempotency_key ~ '^[A-Za-z0-9_-]{16,128}$'
          and request_fingerprint ~ '^[a-f0-9]{64}$'
        )
      );
  end if;
end $$;

create unique index if not exists uq_partnership_attachment_upload_idempotency
  on public.public_partnership_attachments(application_id,upload_idempotency_key)
  where upload_idempotency_key is not null;
