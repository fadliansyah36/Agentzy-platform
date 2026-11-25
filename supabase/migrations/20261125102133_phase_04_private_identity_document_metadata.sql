-- Phase 04 follow-up: normalized private identity document metadata.
create table public.workforce_identity_documents (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete cascade,
 verification_id uuid not null,
 storage_bucket text not null default 'workforce-private-documents',
 storage_path text not null,
 document_type text not null,
 original_filename text not null,
 content_type text not null check(content_type in ('application/pdf','image/jpeg','image/png')),
 file_size_bytes bigint not null check(file_size_bytes between 1 and 10485760),
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
 scan_status text not null default 'pending_scan' check(scan_status in ('pending_scan','clean','infected','rejected')),
 retention_until timestamptz,
 redacted_at timestamptz,
 uploaded_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 foreign key(tenant_id,verification_id) references public.workforce_identity_verifications(tenant_id,id) on delete cascade,
 unique(storage_bucket,storage_path),
 unique(tenant_id,id)
);
create index workforce_identity_documents_verification_idx on public.workforce_identity_documents(tenant_id,verification_id,created_at desc);
alter table public.workforce_identity_documents enable row level security;
revoke all on public.workforce_identity_documents from anon,authenticated;
