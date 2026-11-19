-- Applied migration 20261119160737: idempotent finance verification for submitted payment references.
alter table public.contract_payment_references
 add column if not exists verification_idempotency_key text,
 add column if not exists verification_fingerprint text;
create unique index if not exists contract_payment_verification_idempotency_idx
 on public.contract_payment_references(tenant_id,verification_idempotency_key)
 where verification_idempotency_key is not null;
