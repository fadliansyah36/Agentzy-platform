-- Phase 03 — Corporate & Contract Management (incremental, additive).
create table if not exists public.corporate_profiles (
  tenant_id uuid primary key references public.tenants(id) on delete restrict,
  legal_name text not null,
  registration_number text,
  billing_email text,
  billing_phone text,
  billing_address jsonb not null default '{}'::jsonb,
  tax_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete restrict
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  contract_number text not null,
  title text not null,
  contract_type text not null check (contract_type in ('master','statement_of_work','amendment')),
  status text not null default 'draft'
    check (status in ('draft','review_pending','approved','active','suspended','expired','terminated','rejected')),
  currency char(3) not null default 'IDR',
  effective_start date,
  effective_end date,
  renewal_at date,
  current_version integer not null default 1 check (current_version > 0),
  idempotency_key text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,contract_number),
  unique (tenant_id,idempotency_key),
  check (effective_end is null or effective_start is null or effective_end >= effective_start)
);
create index if not exists contracts_tenant_status_created_idx
  on public.contracts(tenant_id,status,created_at desc,id desc);

create table if not exists public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  contract_id uuid not null references public.contracts(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  version_status text not null default 'draft'
    check (version_status in ('draft','submitted','approved','rejected','superseded')),
  scope_summary text not null,
  terms text,
  commercial_snapshot jsonb not null default '{}'::jsonb,
  content_hash text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (contract_id,version_number),
  unique (tenant_id,id)
);
create index if not exists contract_versions_contract_idx
  on public.contract_versions(contract_id,version_number desc);

create table if not exists public.contract_services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  contract_id uuid not null references public.contracts(id) on delete restrict,
  contract_version_id uuid not null,
  service_key text not null references public.public_catalogue_items(service_key) on delete restrict,
  service_scope text not null,
  quantity integer not null default 1 check (quantity > 0),
  monthly_fee numeric(18,2) check (monthly_fee is null or monthly_fee >= 0),
  currency char(3) not null default 'IDR',
  sla jsonb not null default '{}'::jsonb,
  entitlement jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (tenant_id,contract_version_id)
    references public.contract_versions(tenant_id,id) on delete restrict
);
create index if not exists contract_services_version_idx
  on public.contract_services(contract_id,contract_version_id);

create table if not exists public.contract_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  contract_id uuid not null references public.contracts(id) on delete restrict,
  contract_version_id uuid not null,
  approval_step integer not null check (approval_step > 0),
  approver_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decision_reason text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (tenant_id,contract_version_id)
    references public.contract_versions(tenant_id,id) on delete restrict,
  unique (contract_version_id,approval_step,approver_user_id)
);
create index if not exists contract_approvals_assignee_idx
  on public.contract_approvals(tenant_id,approver_user_id,status,created_at desc);

create table if not exists public.contract_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  contract_id uuid not null references public.contracts(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete restrict,
  event_type text not null,
  from_status text,
  to_status text,
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  created_at timestamptz not null default now()
);
create index if not exists contract_events_contract_idx
  on public.contract_events(tenant_id,contract_id,created_at desc,id desc);

insert into public.permissions(key,domain,action,description,resource,risk_level)
values
 ('corporate.contracts.read','corporate.contracts','read','Read tenant contracts and version history.','contract','sensitive'),
 ('corporate.contracts.manage','corporate.contracts','manage','Create and edit draft contracts and submit review.','contract','privileged'),
 ('corporate.contracts.approve','corporate.contracts','approve','Approve or reject assigned contract versions.','contract_approval','critical')
on conflict(key) do update set domain=excluded.domain,action=excluded.action,
 description=excluded.description,resource=excluded.resource,risk_level=excluded.risk_level;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r
join public.permissions p on p.key in ('corporate.contracts.read','corporate.contracts.manage','corporate.contracts.approve')
where r.key in ('corporate_owner','corporate_admin','corporate_finance_manager')
on conflict do nothing;

alter table public.corporate_profiles enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_versions enable row level security;
alter table public.contract_services enable row level security;
alter table public.contract_approvals enable row level security;
alter table public.contract_events enable row level security;

revoke all on public.corporate_profiles,public.contracts,public.contract_versions,
 public.contract_services,public.contract_approvals,public.contract_events
 from public,anon,authenticated,service_role;
