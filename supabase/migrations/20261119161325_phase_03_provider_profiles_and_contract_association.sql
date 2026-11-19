-- Applied migration 20261119161325: tenant-owned provider profiles and contract association.
create table if not exists public.provider_profiles (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 corporate_profile_id uuid references public.corporate_profiles(tenant_id) on delete restrict,
 provider_code text not null, provider_name text not null,
 provider_type text not null check (provider_type in ('isp','telecom','managed_service','technology','other')),
 registration_number text, contact_email text, contact_phone text,
 service_regions jsonb not null default '[]'::jsonb,
 service_metadata jsonb not null default '{}'::jsonb,
 status text not null default 'draft' check (status in ('draft','active','suspended','archived')),
 created_by uuid not null references auth.users(id) on delete restrict,
 updated_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_id,provider_code), unique(tenant_id,id)
);
create index if not exists provider_profiles_tenant_status_idx
 on public.provider_profiles(tenant_id,status,provider_name);
alter table public.provider_profiles enable row level security;
revoke all on public.provider_profiles from public,anon,authenticated,service_role;
alter table public.contracts add column if not exists provider_profile_id uuid;
alter table public.contracts add constraint contracts_provider_profile_tenant_fk
 foreign key(tenant_id,provider_profile_id)
 references public.provider_profiles(tenant_id,id) on delete restrict;
insert into public.permissions(key,domain,action,description,resource,risk_level)
values
 ('corporate.providers.read','corporate.providers','read','Read tenant provider profiles.','provider_profile','sensitive'),
 ('corporate.providers.manage','corporate.providers','manage','Create and manage tenant provider profiles.','provider_profile','privileged')
on conflict(key) do update set domain=excluded.domain,action=excluded.action,
 description=excluded.description,resource=excluded.resource,risk_level=excluded.risk_level;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where r.key in ('corporate_owner','corporate_admin','corporate_finance_manager')
 and p.key in ('corporate.providers.read','corporate.providers.manage')
on conflict do nothing;
