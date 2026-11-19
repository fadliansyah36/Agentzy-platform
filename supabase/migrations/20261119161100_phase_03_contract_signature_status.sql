-- Applied migration 20261119161100: signature lifecycle status for corporate contracts.
alter table public.contracts
 add column if not exists signature_status text not null default 'not_started'
  check (signature_status in ('not_started','pending','signed','rejected','cancelled','expired')),
 add column if not exists signature_provider text,
 add column if not exists signature_reference text,
 add column if not exists signature_requested_at timestamptz,
 add column if not exists signed_at timestamptz,
 add column if not exists signature_failure_reason text;
