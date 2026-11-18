-- Phase 01 completion: organization hierarchy, scoped membership, session revocation and least privilege.
-- Target: cwhjdnkotuhueeudpgeu / Agentzy-db. Additive; no business records are seeded.
-- Recovery: take a verified logical backup before applying. Roll forward by correcting this migration;
-- do not edit the three previously applied Phase 01 migrations.

begin;

alter table public.profiles
  add column if not exists locale text,
  add column if not exists timezone text;

alter table public.tenants
  add column if not exists legal_name text,
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists default_timezone text not null default 'Asia/Jakarta',
  add column if not exists default_currency char(3) not null default 'IDR',
  add column if not exists data_region text;

alter table public.memberships
  add column if not exists invited_by uuid references auth.users(id) on delete set null,
  add column if not exists invitation_expires_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists organization_unit_id uuid,
  add column if not exists branch_id uuid,
  add column if not exists department_id uuid;

alter table public.roles
  add column if not exists scope_type text not null default 'tenant';
update public.roles set scope_type='platform' where tenant_id is null and key like 'platform_%';
create unique index if not exists roles_tenant_key_unique
  on public.roles (tenant_id,key) nulls not distinct;

alter table public.permissions
  add column if not exists resource text,
  add column if not exists risk_level text not null default 'standard';
update public.permissions set resource=domain where resource is null;

alter table public.membership_roles
  add column if not exists scope_type text not null default 'tenant',
  add column if not exists scope_id uuid,
  add column if not exists valid_from timestamptz not null default now(),
  add column if not exists valid_until timestamptz;

update public.membership_roles mr
set scope_type='platform',scope_id=null
from public.roles r
where r.id=mr.role_id and r.tenant_id is null and r.key like 'platform_%';

alter table public.organizations
  add constraint organizations_tenant_id_id_unique unique (tenant_id,id);

create table if not exists public.organization_units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  organization_id uuid not null,
  parent_unit_id uuid,
  name text not null,
  code text not null,
  unit_type text not null check (unit_type in ('division','unit','team','cost_center')),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,organization_id,id),
  unique (tenant_id,organization_id,code),
  foreign key (tenant_id,organization_id)
    references public.organizations(tenant_id,id) on delete cascade,
  foreign key (tenant_id,organization_id,parent_unit_id)
    references public.organization_units(tenant_id,organization_id,id) on delete restrict,
  check (parent_unit_id is null or parent_unit_id <> id)
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  organization_id uuid not null,
  organization_unit_id uuid,
  name text not null,
  code text not null,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,organization_id,id),
  unique (tenant_id,organization_id,code),
  foreign key (tenant_id,organization_id)
    references public.organizations(tenant_id,id) on delete cascade,
  foreign key (tenant_id,organization_id,organization_unit_id)
    references public.organization_units(tenant_id,organization_id,id) on delete restrict
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  organization_id uuid not null,
  branch_id uuid,
  parent_department_id uuid,
  name text not null,
  code text not null,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,organization_id,id),
  unique (tenant_id,organization_id,code),
  foreign key (tenant_id,organization_id)
    references public.organizations(tenant_id,id) on delete cascade,
  foreign key (tenant_id,organization_id,branch_id)
    references public.branches(tenant_id,organization_id,id) on delete restrict,
  foreign key (tenant_id,organization_id,parent_department_id)
    references public.departments(tenant_id,organization_id,id) on delete restrict,
  check (parent_department_id is null or parent_department_id <> id)
);

do $do$
begin
  if not exists (select 1 from pg_constraint where conname='memberships_tenant_org_unique') then
    alter table public.memberships add constraint memberships_tenant_org_unique unique (tenant_id,organization_id,id);
  end if;
  if not exists (select 1 from pg_constraint where conname='memberships_tenant_org_unit_fk') then
    alter table public.memberships add constraint memberships_tenant_org_unit_fk
      foreign key (tenant_id,organization_id,organization_unit_id)
      references public.organization_units(tenant_id,organization_id,id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='memberships_tenant_org_branch_fk') then
    alter table public.memberships add constraint memberships_tenant_org_branch_fk
      foreign key (tenant_id,organization_id,branch_id)
      references public.branches(tenant_id,organization_id,id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='memberships_tenant_org_department_fk') then
    alter table public.memberships add constraint memberships_tenant_org_department_fk
      foreign key (tenant_id,organization_id,department_id)
      references public.departments(tenant_id,organization_id,id) on delete restrict;
  end if;
end $do$;

do $do$
begin
  if not exists (select 1 from pg_constraint where conname='memberships_scope_requires_organization') then
    alter table public.memberships add constraint memberships_scope_requires_organization
      check (
        (organization_unit_id is null and branch_id is null and department_id is null)
        or organization_id is not null
      );
  end if;
  if not exists (select 1 from pg_constraint where conname='memberships_department_requires_branch') then
    alter table public.memberships add constraint memberships_department_requires_branch
      check (department_id is null or branch_id is not null);
  end if;
end $do$;

alter table public.membership_roles
  add constraint membership_roles_scope_type_check
  check (scope_type in ('platform','tenant','organization','organization_unit','branch','department','resource')),
  add constraint membership_roles_validity_check
  check (valid_until is null or valid_until > valid_from);

alter table public.roles
  add constraint roles_scope_type_check
  check (scope_type in ('platform','tenant','organization','organization_unit','branch','department'));

alter table public.permissions
  add constraint permissions_risk_level_check
  check (risk_level in ('standard','sensitive','privileged','critical'));

create table if not exists public.access_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  policy_key text not null,
  resource text not null,
  action text not null,
  effect text not null check (effect in ('allow','deny')),
  conditions jsonb not null default '{}'::jsonb,
  priority integer not null default 100,
  status text not null default 'active' check (status in ('active','inactive')),
  version integer not null default 1 check (version > 0),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,policy_key)
);

create table if not exists public.revoked_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  revoked_at timestamptz not null default now(),
  expires_at timestamptz not null,
  reason text not null,
  request_id text,
  check (expires_at > revoked_at)
);

create index if not exists organization_units_tenant_org_status_idx
  on public.organization_units(tenant_id,organization_id,status);
create index if not exists branches_tenant_org_status_idx
  on public.branches(tenant_id,organization_id,status);
create index if not exists departments_tenant_org_branch_status_idx
  on public.departments(tenant_id,organization_id,branch_id,status);
create index if not exists memberships_tenant_status_created_idx
  on public.memberships(tenant_id,status,created_at desc);
create index if not exists memberships_branch_department_idx
  on public.memberships(tenant_id,branch_id,department_id);
create index if not exists membership_roles_scope_idx
  on public.membership_roles(scope_type,scope_id,valid_from,valid_until);
create index if not exists access_policies_lookup_idx
  on public.access_policies(tenant_id,resource,action,status,priority);
create index if not exists revoked_sessions_user_expiry_idx
  on public.revoked_sessions(user_id,expires_at);

alter table public.organization_units enable row level security;
alter table public.branches enable row level security;
alter table public.departments enable row level security;
alter table public.access_policies enable row level security;
alter table public.revoked_sessions enable row level security;

drop policy if exists organization_units_read_active_tenant on public.organization_units;
create policy organization_units_read_active_tenant on public.organization_units
for select to authenticated using (
  exists (
    select 1 from public.memberships m
    join public.tenants t on t.id=m.tenant_id
    where m.tenant_id=organization_units.tenant_id
      and m.user_id=(select auth.uid()) and m.status='active' and t.status='active'
      and (m.organization_id is null or m.organization_id=organization_units.organization_id)
      and (m.organization_unit_id is null or m.organization_unit_id=organization_units.id)
  )
);

drop policy if exists branches_read_active_tenant on public.branches;
create policy branches_read_active_tenant on public.branches
for select to authenticated using (
  exists (
    select 1 from public.memberships m
    join public.tenants t on t.id=m.tenant_id
    where m.tenant_id=branches.tenant_id
      and m.user_id=(select auth.uid()) and m.status='active' and t.status='active'
      and (m.organization_id is null or m.organization_id=branches.organization_id)
      and (m.organization_unit_id is null or m.organization_unit_id=branches.organization_unit_id)
      and (m.branch_id is null or m.branch_id=branches.id)
  )
);

drop policy if exists departments_read_active_tenant on public.departments;
create policy departments_read_active_tenant on public.departments
for select to authenticated using (
  exists (
    select 1 from public.memberships m
    join public.tenants t on t.id=m.tenant_id
    where m.tenant_id=departments.tenant_id
      and m.user_id=(select auth.uid()) and m.status='active' and t.status='active'
      and (m.organization_id is null or m.organization_id=departments.organization_id)
      and (m.branch_id is null or m.branch_id=departments.branch_id)
      and (m.department_id is null or m.department_id=departments.id)
  )
);

drop policy if exists access_policies_read_scope on public.access_policies;
create policy access_policies_read_scope on public.access_policies
for select to authenticated using (
  tenant_id is not null and exists (
    select 1 from public.memberships m
    join public.tenants t on t.id=m.tenant_id
    where m.tenant_id=access_policies.tenant_id
      and m.user_id=(select auth.uid()) and m.status='active' and t.status='active'
  )
);

-- Canonical baseline roles used by the shared portals. These are reference templates only.
insert into public.roles(tenant_id,key,name,description,is_system,scope_type) values
  (null,'sales_manager','Sales Manager','Manage sales team and lead pipeline',true,'tenant'),
  (null,'sales_supervisor','Sales Supervisor','Supervise scoped sales operations',true,'tenant'),
  (null,'sales_official','Sales Official','Manage own sales activity and assigned leads',true,'tenant'),
  (null,'affiliate_worker','Affiliate Worker','Manage own affiliate profile and referrals',true,'tenant'),
  (null,'technician','Technician','Access assigned technical work orders',true,'tenant'),
  (null,'field_quality_inspector','Field Quality Inspector','Review scoped field evidence and quality',true,'tenant'),
  (null,'ai_worker_supervisor','AI Worker Supervisor','Supervise AI worker operations',true,'tenant'),
  (null,'ai_platform_operator','AI Platform Operator','Operate approved AI platform capabilities',true,'tenant'),
  (null,'support_agent','Support Agent','Access assigned support workflows',true,'tenant')
on conflict do nothing;

insert into public.permissions(key,domain,action,description,resource,risk_level) values
  ('workforce.profile.read','workforce.profile','read','Read workforce profile','workforce.profile','standard'),
  ('workforce.profile.manage','workforce.profile','manage','Manage workforce profile','workforce.profile','sensitive'),
  ('workforce.assignments.read','workforce.assignments','read','Read assigned workforce tasks','workforce.assignment','standard'),
  ('workforce.assignments.manage','workforce.assignments','manage','Manage workforce assignments','workforce.assignment','sensitive'),
  ('workforce.training.read','workforce.training','read','Read training and certification','workforce.training','standard'),
  ('sales.leads.read','sales.leads','read','Read assigned sales leads','sales.lead','standard'),
  ('sales.leads.manage','sales.leads','manage','Manage scoped sales leads','sales.lead','sensitive'),
  ('affiliate.profile.read','affiliate.profile','read','Read own affiliate profile','affiliate.profile','standard'),
  ('affiliate.profile.manage','affiliate.profile','manage','Manage own affiliate profile','affiliate.profile','sensitive'),
  ('technical.work_orders.read','technical.work_orders','read','Read assigned work orders','technical.work_order','standard'),
  ('technical.work_orders.manage','technical.work_orders','manage','Update assigned work orders','technical.work_order','sensitive'),
  ('technical.quality.review','technical.quality','review','Review field quality evidence','technical.evidence','sensitive'),
  ('ai.workers.read','ai.workers','read','Read AI worker registry','ai.worker','standard'),
  ('ai.workers.manage','ai.workers','manage','Manage AI worker registry','ai.worker','sensitive'),
  ('support.cases.read','support.cases','read','Read assigned support cases','support.case','standard')
on conflict(key) do nothing;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r join public.permissions p on
  (r.key='sales_manager' and p.key in ('workforce.profile.read','workforce.profile.manage','workforce.assignments.read','workforce.assignments.manage','sales.leads.read','sales.leads.manage','affiliate.profile.read'))
  or (r.key='sales_supervisor' and p.key in ('workforce.profile.read','workforce.assignments.read','sales.leads.read','sales.leads.manage'))
  or (r.key='sales_official' and p.key in ('workforce.profile.read','workforce.assignments.read','sales.leads.read','sales.leads.manage'))
  or (r.key='affiliate_worker' and p.key in ('workforce.profile.read','affiliate.profile.read','affiliate.profile.manage'))
  or (r.key='technician' and p.key in ('workforce.profile.read','workforce.assignments.read','technical.work_orders.read','technical.work_orders.manage','workforce.training.read'))
  or (r.key='field_quality_inspector' and p.key in ('workforce.profile.read','technical.work_orders.read','technical.quality.review','workforce.training.read'))
  or (r.key='ai_worker_supervisor' and p.key in ('ai.workers.read','ai.workers.manage','workforce.profile.read'))
  or (r.key='ai_platform_operator' and p.key in ('ai.workers.read','ai.workers.manage'))
  or (r.key='support_agent' and p.key in ('support.cases.read','workforce.profile.read'))
on conflict do nothing;

-- Client roles are read-only. Sensitive writes are routed through FastAPI using the
-- private database connection after server-side authorization.
revoke all privileges on table
  public.profiles, public.tenants, public.organizations, public.memberships,
  public.roles, public.permissions, public.role_permissions, public.membership_roles,
  public.audit_logs
from anon, authenticated;
grant select on table
  public.profiles, public.tenants, public.organizations, public.memberships,
  public.roles, public.permissions, public.role_permissions, public.membership_roles,
  public.audit_logs
to authenticated;

revoke all privileges on table
  public.organization_units, public.branches, public.departments, public.access_policies,
  public.revoked_sessions
from anon, authenticated, service_role;
grant select on table
  public.organization_units, public.branches, public.departments, public.access_policies
to authenticated;

-- New postgres-owned objects must not inherit broad client privileges.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- Keep the existing ensure_rls event trigger and function identity, but fail closed:
-- any inability to enable RLS aborts the DDL transaction instead of logging and continuing.
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  cmd record;
  tbl name;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table','partitioned table')
  loop
    if cmd.schema_name = 'public' then
      select c.relname into strict tbl
      from pg_catalog.pg_class c
      where c.oid = cmd.objid
        and c.relkind in ('r','p');
      execute format('alter table %I.%I enable row level security', cmd.schema_name, tbl);
      raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
    end if;
  end loop;
end;
$function$;

revoke all on function public.rls_auto_enable() from public, anon, authenticated, service_role;
grant execute on function public.rls_auto_enable() to postgres;

commit;
