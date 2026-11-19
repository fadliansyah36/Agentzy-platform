-- Phase 03 integrity and idempotency migration applied to Supabase as 20261119154914.
alter table public.contract_versions
 add column if not exists parent_version_id uuid references public.contract_versions(id) on delete restrict,
 add column if not exists change_summary text,
 add column if not exists effective_from date;
alter table public.contract_documents
 add column if not exists idempotency_key text,
 add column if not exists upload_fingerprint text;
create unique index if not exists contract_documents_tenant_idempotency_idx
 on public.contract_documents(tenant_id,idempotency_key) where idempotency_key is not null;
alter table public.contract_renewals add column if not exists idempotency_fingerprint text;
alter table public.contract_payment_references add column if not exists idempotency_fingerprint text;
alter table public.contract_invoices add column if not exists idempotency_fingerprint text;
create schema if not exists app_private;
create or replace function app_private.prevent_contract_version_snapshot_mutation()
returns trigger language plpgsql
set search_path = pg_catalog, public
as $$
begin
 if tg_op='DELETE' then
   raise exception 'Contract version snapshots are immutable';
 end if;
 if row(old.tenant_id,old.contract_id,old.version_number,old.scope_summary,old.terms,
   old.commercial_snapshot,old.content_hash,old.created_by,old.parent_version_id,
   old.change_summary,old.effective_from)
   is distinct from
   row(new.tenant_id,new.contract_id,new.version_number,new.scope_summary,new.terms,
   new.commercial_snapshot,new.content_hash,new.created_by,new.parent_version_id,
   new.change_summary,new.effective_from) then
   raise exception 'Contract version snapshot fields are immutable';
 end if;
 return new;
end;
$$;
revoke all on function app_private.prevent_contract_version_snapshot_mutation() from public,anon,authenticated;
drop trigger if exists contract_versions_immutable_snapshot on public.contract_versions;
create trigger contract_versions_immutable_snapshot
before update or delete on public.contract_versions
for each row execute function app_private.prevent_contract_version_snapshot_mutation();
