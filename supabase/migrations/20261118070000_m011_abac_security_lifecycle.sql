-- Phase 01 continuation: versioned ABAC policies, provider event correlation,
-- break-glass lifecycle and idempotent command records.
-- Target: cwhjdnkotuhueeudpgeu. Additive; no business records are seeded.
begin;

alter table public.access_policies
  add column if not exists policy_name text,
  add column if not exists description text,
  add column if not exists effective_from timestamptz,
  add column if not exists effective_until timestamptz;

update public.access_policies
set policy_name = policy_key
where policy_name is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'access_policies_effective_window_check'
      and conrelid = 'public.access_policies'::regclass
  ) then
    alter table public.access_policies
      add constraint access_policies_effective_window_check
      check (effective_until is null or effective_from is null or effective_until > effective_from);
  end if;
end $$;

create table if not exists public.access_policy_versions (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.access_policies(id) on delete restrict,
  tenant_id uuid,
  version integer not null check (version > 0),
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (policy_id, version)
);

create table if not exists public.auth_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid,
  tenant_id uuid references public.tenants(id) on delete set null,
  request_id text,
  occurred_at timestamptz,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'received'
    check (processing_status in ('received','processing','processed','failed','ignored')),
  payload_digest text,
  metadata jsonb not null default '{}'::jsonb,
  unique (provider, provider_event_id)
);

create table if not exists public.break_glass_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  requester_user_id uuid not null references auth.users(id) on delete restrict,
  approver_user_id uuid references auth.users(id) on delete restrict,
  activated_by uuid references auth.users(id) on delete set null,
  revoked_by uuid references auth.users(id) on delete set null,
  reason text not null check (length(trim(reason)) >= 20),
  requested_scope jsonb not null,
  status text not null default 'requested'
    check (status in ('requested','approved','active','expired','revoked','rejected','reviewed')),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  reviewed_at timestamptz,
  review_notes text,
  request_id text,
  check (approver_user_id is null or approver_user_id <> requester_user_id),
  check (expires_at is null or activated_at is null or expires_at > activated_at)
);

create table if not exists public.idempotency_records (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  command_key text not null,
  idempotency_key text not null,
  request_fingerprint text not null,
  status text not null default 'processing'
    check (status in ('processing','completed','failed')),
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (length(idempotency_key) between 8 and 128),
  check (length(request_fingerprint) between 32 and 128),
  check (expires_at > created_at)
);

create unique index if not exists idempotency_records_scope_key_unique
  on public.idempotency_records(actor_user_id, tenant_id, command_key, idempotency_key)
  nulls not distinct;
create index if not exists idempotency_records_expiry_idx
  on public.idempotency_records(expires_at);
create index if not exists auth_provider_events_user_time_idx
  on public.auth_provider_events(user_id, received_at desc);
create index if not exists auth_provider_events_status_time_idx
  on public.auth_provider_events(processing_status, received_at);
create index if not exists break_glass_tenant_status_idx
  on public.break_glass_requests(tenant_id, status, requested_at desc);
create index if not exists break_glass_expiry_idx
  on public.break_glass_requests(status, expires_at);

-- A version snapshot is retained for every mutation; initial versions are recorded here.
insert into public.access_policy_versions(policy_id, tenant_id, version, snapshot, changed_by)
select p.id, p.tenant_id, p.version, to_jsonb(p), p.updated_by
from public.access_policies p
where not exists (
  select 1 from public.access_policy_versions v
  where v.policy_id = p.id and v.version = p.version
);

-- Baseline ABAC policies bind the existing central permission registry to resource/action.
-- They are global templates; tenant policies may further restrict or explicitly deny.
insert into public.access_policies(
  tenant_id, policy_key, policy_name, description, resource, action,
  effect, conditions, priority, status, version
)
select
  null,
  'rbac_baseline:' || p.key,
  'RBAC baseline — ' || p.key,
  'ABAC baseline requires the resolved subject to hold the matching permission key.',
  coalesce(p.resource, p.domain),
  p.action,
  'allow',
  jsonb_build_object('path','subject.permissions','op','contains','value',p.key),
  0,
  'active',
  1
from public.permissions p
where not exists (
  select 1 from public.access_policies existing
  where existing.tenant_id is null
    and existing.policy_key = 'rbac_baseline:' || p.key
);

insert into public.access_policy_versions(policy_id, tenant_id, version, snapshot, changed_by)
select p.id, p.tenant_id, p.version, to_jsonb(p), p.updated_by
from public.access_policies p
where p.policy_key like 'rbac_baseline:%'
  and not exists (
    select 1 from public.access_policy_versions v
    where v.policy_id = p.id and v.version = p.version
  );

alter table public.access_policy_versions enable row level security;
alter table public.auth_provider_events enable row level security;
alter table public.break_glass_requests enable row level security;
alter table public.idempotency_records enable row level security;

-- Policy bodies and privileged security records are server-only.
drop policy if exists access_policies_read_scope on public.access_policies;
revoke all privileges on table public.access_policies,
  public.access_policy_versions, public.auth_provider_events,
  public.break_glass_requests, public.idempotency_records
from anon, authenticated, service_role;

commit;