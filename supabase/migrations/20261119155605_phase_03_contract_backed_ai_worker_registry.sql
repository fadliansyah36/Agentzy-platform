-- Applied migration 20261119155605: tenant AI Worker registry governed by active contract entitlement.
create table if not exists public.tenant_ai_workers (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 contract_id uuid not null references public.contracts(id) on delete restrict,
 service_key text not null references public.public_catalogue_items(service_key) on delete restrict,
 worker_code text not null,
 display_name text not null,
 model_provider text not null,
 model_key text not null,
 capabilities jsonb not null default '[]'::jsonb,
 runtime_config jsonb not null default '{}'::jsonb,
 status text not null default 'draft' check (status in ('draft','active','suspended','retired')),
 created_by uuid not null references auth.users(id) on delete restrict,
 updated_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (tenant_id,worker_code)
);
create index if not exists tenant_ai_workers_capacity_idx
 on public.tenant_ai_workers(tenant_id,service_key,status);
alter table public.tenant_ai_workers enable row level security;
revoke all on public.tenant_ai_workers from public,anon,authenticated,service_role;
insert into public.permissions(key,domain,action,description,resource,risk_level)
values
 ('corporate.ai_workers.read','corporate.ai_workers','read','Read tenant AI Worker registry.','ai_worker','sensitive'),
 ('corporate.ai_workers.manage','corporate.ai_workers','manage','Create, activate and manage tenant AI Workers within contract limits.','ai_worker','privileged')
on conflict(key) do update set domain=excluded.domain,action=excluded.action,
 description=excluded.description,resource=excluded.resource,risk_level=excluded.risk_level;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where r.key in ('corporate_owner','corporate_admin','corporate_ai_manager')
 and p.key in ('corporate.ai_workers.read','corporate.ai_workers.manage')
on conflict do nothing;
