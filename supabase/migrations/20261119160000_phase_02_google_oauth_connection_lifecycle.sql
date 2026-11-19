-- Phase 02 continuation: tenant-scoped Google OAuth credential lifecycle.
-- Tokens are encrypted by FastAPI before persistence; plaintext provider secrets are never stored.
create table if not exists public.provider_oauth_states (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('google_workspace')),
  state_hash text not null unique,
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  requested_scopes text[] not null,
  code_verifier text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists provider_oauth_states_expiry_idx
  on public.provider_oauth_states (expires_at) where consumed_at is null;

create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  provider text not null check (provider in ('google_workspace')),
  provider_subject text not null,
  provider_email text,
  granted_scopes text[] not null default '{}',
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  access_token_expires_at timestamptz,
  connected_by uuid not null references auth.users(id) on delete restrict,
  consented_at timestamptz not null,
  connected_at timestamptz not null default now(),
  last_refreshed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider, provider_subject)
);
create index if not exists provider_connections_tenant_provider_idx
  on public.provider_connections (tenant_id, provider, connected_at desc)
  where revoked_at is null;

insert into public.permissions (key,domain,action,description,resource,risk_level)
values ('corporate.integrations.manage','corporate.integrations','manage',
        'Manage tenant-scoped external provider connections and OAuth consent.',
        'provider_connection','privileged')
on conflict (key) do update set
  domain=excluded.domain, action=excluded.action, description=excluded.description,
  resource=excluded.resource, risk_level=excluded.risk_level;

insert into public.role_permissions(role_id,permission_key)
select r.id,'corporate.integrations.manage'
from public.roles r
where r.key in ('corporate_owner','corporate_admin')
on conflict do nothing;

alter table public.provider_oauth_states enable row level security;
alter table public.provider_connections enable row level security;
revoke all on public.provider_oauth_states, public.provider_connections
  from public, anon, authenticated, service_role;
