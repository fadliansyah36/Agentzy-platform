-- Phase 01: Platform Core, Identity & Tenant
-- Additive schema. No business/demo records are seeded.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text, avatar_path text,
  locale text not null default 'id-ID',
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique,
  tenant_type text not null check (tenant_type in ('corporate','provider','internal','other')),
  status text not null default 'pending' check (status in ('pending','active','suspended','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  parent_id uuid references public.organizations(id) on delete restrict,
  name text not null, slug text not null,
  organization_type text not null default 'company' check (organization_type in ('company','division','department','branch','team')),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, slug), check (parent_id is null or parent_id <> id)
);
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  status text not null default 'invited' check (status in ('invited','active','suspended','revoked')),
  joined_at timestamptz, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), unique (tenant_id, user_id)
);
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  key text not null, name text not null, description text,
  is_system boolean not null default false, created_at timestamptz not null default now(),
  check (key ~ '^[a-z][a-z0-9_.-]{1,79}$')
);
create unique index roles_platform_key_unique on public.roles(key) where tenant_id is null;
create unique index roles_tenant_key_unique on public.roles(tenant_id,key) where tenant_id is not null;
create table public.permissions (
  key text primary key, domain text not null, action text not null,
  description text, created_at timestamptz not null default now(),
  check (key ~ '^[a-z][a-z0-9_.-]{1,119}$')
);
create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  created_at timestamptz not null default now(), primary key(role_id,permission_key)
);
create table public.membership_roles (
  membership_id uuid not null references public.memberships(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(), primary key(membership_id,role_id)
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null, resource_type text not null, resource_id text,
  request_id text, ip_address inet, user_agent text,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index memberships_user_status_idx on public.memberships(user_id,status);
create index memberships_tenant_status_idx on public.memberships(tenant_id,status);
create index organizations_tenant_parent_idx on public.organizations(tenant_id,parent_id);
create index membership_roles_role_idx on public.membership_roles(role_id);
create index audit_logs_tenant_created_idx on public.audit_logs(tenant_id,created_at desc);
create index audit_logs_actor_created_idx on public.audit_logs(actor_user_id,created_at desc);

alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.membership_roles enable row level security;
alter table public.audit_logs enable row level security;

grant usage on schema public to authenticated;
grant select on public.profiles,public.tenants,public.organizations,public.memberships,
 public.roles,public.permissions,public.role_permissions,public.membership_roles,public.audit_logs to authenticated;

create policy profiles_read_self on public.profiles for select to authenticated
 using (user_id=(select auth.uid()));
create policy tenants_read_by_active_membership on public.tenants for select to authenticated using (
 exists(select 1 from public.memberships m where m.tenant_id=tenants.id and m.user_id=(select auth.uid()) and m.status='active'));
create policy organizations_read_by_active_membership on public.organizations for select to authenticated using (
 exists(select 1 from public.memberships m where m.tenant_id=organizations.tenant_id and m.user_id=(select auth.uid()) and m.status='active'));
create policy memberships_read_self on public.memberships for select to authenticated using (user_id=(select auth.uid()));
create policy roles_read_platform_or_member on public.roles for select to authenticated using (
 tenant_id is null or exists(select 1 from public.memberships m where m.tenant_id=roles.tenant_id and m.user_id=(select auth.uid()) and m.status='active'));
create policy permissions_read_authenticated on public.permissions for select to authenticated using (true);
create policy role_permissions_read_visible_roles on public.role_permissions for select to authenticated using (
 exists(select 1 from public.roles r where r.id=role_permissions.role_id and
 (r.tenant_id is null or exists(select 1 from public.memberships m where m.tenant_id=r.tenant_id and m.user_id=(select auth.uid()) and m.status='active'))));
create policy membership_roles_read_self on public.membership_roles for select to authenticated using (
 exists(select 1 from public.memberships m where m.id=membership_roles.membership_id and m.user_id=(select auth.uid()) and m.status='active'));
create policy audit_logs_read_own_actor on public.audit_logs for select to authenticated using (actor_user_id=(select auth.uid()));

insert into public.permissions(key,domain,action,description) values
 ('platform.tenants.read','platform.tenants','read','View tenant records available to the caller'),
 ('platform.tenants.manage','platform.tenants','manage','Create and manage platform tenants'),
 ('platform.memberships.read','platform.memberships','read','View memberships within authorized scope'),
 ('platform.memberships.manage','platform.memberships','manage','Invite and manage tenant memberships'),
 ('platform.roles.read','platform.roles','read','View role definitions'),
 ('platform.roles.manage','platform.roles','manage','Manage role assignments and permissions'),
 ('platform.audit.read','platform.audit','read','View authorized audit events')
on conflict(key) do nothing;
