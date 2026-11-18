# M012 — Security Permission Registry Verification

**Project:** Agentzy-db  
**Project ref:** `cwhjdnkotuhueeudpgeu`  
**Remote migration version:** `20261118065058`  
**Remote migration name:** `phase_01_m012_security_permissions`  
**Repository source:** `supabase/migrations/20261118065058_m012_security_permissions.sql`  
**Status:** APPLIED; live catalog verification performed on 2026-11-18.

## 1. Migration ledger

The remote Supabase migration ledger returned six applied migrations, in order:

| Version | Name |
|---|---|
| 20261117175948 | phase_01_platform_core_identity_tenant |
| 20261117181011 | phase_01_system_roles_permissions_auth_profile |
| 20261117182410 | phase_01_profile_email_projection |
| 20261118062335 | phase_01_m010_identity_tenant_completion |
| 20261118062647 | phase_01_m011_abac_security_lifecycle |
| 20261118065058 | phase_01_m012_security_permissions |

The migration listing endpoint does not expose an applied-at timestamp or actor. No timestamp is inferred here.

## 2. M012 source intent

M012 adds nine permission definitions for platform audit export, corporate audit export, break-glass lifecycle, and auth-provider event management/read. It grants the defined platform emergency/security permissions to the platform super-admin and security-admin role templates, and corporate audit export to the corporate-admin role template. It then ensures a global baseline ABAC policy and version snapshot exist for every permission.

The migration is additive and uses `ON CONFLICT DO NOTHING`. It does not insert tenant or user business records.

## 3. Live catalog verification

Live SQL checks against the canonical project returned:

| Check | Actual result |
|---|---:|
| Permission definitions | 67 |
| Access policies | 67 |
| Global `rbac_baseline:` policies | 67 |
| Policy version snapshots | 67 |
| Auth provider events | 0 |
| Break-glass requests | 0 |
| Idempotency records | 0 |

All 67 access policies are currently `allow / active`; no tenant-specific explicit DENY policy has yet been configured. The evaluator supports explicit DENY precedence, but the live tenant-policy administration/operational process still needs further validation.

Role mapping query returned:
- `platform_security_admin`: five break-glass permissions and platform audit export.
- `platform_super_admin`: five break-glass permissions and platform audit export.
- `corporate_admin`: corporate audit export.

The permission table contains the full registry, but these mappings alone do not prove that every portal UI consumes it.

## 4. RLS and grants

Catalog query returned 18 public application tables, all with RLS enabled. FORCE RLS is false on all inspected tables.

The M011 server-only tables `access_policies`, `access_policy_versions`, `auth_provider_events`, `break_glass_requests`, `idempotency_records`, and M010 `revoked_sessions` have no table grants to `anon`, `authenticated`, or `service_role`. They have RLS enabled and no client policies; access is intended through FastAPI's private DB connection.

The client-facing hierarchy tables `organization_units`, `branches`, and `departments` have authenticated SELECT grants only. The catalog shows SELECT-only policies for these tables. This is intentional: business mutations must pass through FastAPI.

The live `public.rls_auto_enable()` remains SECURITY DEFINER, but current ACL checks return EXECUTE=false for `anon`, `authenticated`, and `service_role`. Its body enables RLS and raises on errors rather than swallowing them.

## 5. Security Advisor

Current Security Advisor output reports six INFO findings: RLS-enabled server-only tables with no client policies (`access_policies`, `access_policy_versions`, `auth_provider_events`, `break_glass_requests`, `idempotency_records`, `revoked_sessions`). These are intentionally deny-all for client roles and are not a zero-finding result.

The earlier `anon_security_definer_function_executable` and `authenticated_security_definer_function_executable` WARN findings were not present in the current returned Advisor payload. This is not a full security acceptance.

## 6. Verification SQL

```sql
select version, name
from supabase_migrations.schema_migrations
order by version;

select
  (select count(*) from public.permissions) as permissions,
  (select count(*) from public.access_policies) as policies,
  (select count(*) from public.access_policies
    where tenant_id is null and policy_key like 'rbac_baseline:%') as baseline_policies,
  (select count(*) from public.access_policy_versions) as policy_versions,
  (select count(*) from public.auth_provider_events) as provider_events,
  (select count(*) from public.break_glass_requests) as break_glass_requests,
  (select count(*) from public.idempotency_records) as idempotency_records;

select c.relname, c.relrowsecurity, c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p')
order by c.relname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and table_name in (
    'access_policies','access_policy_versions','auth_provider_events',
    'break_glass_requests','idempotency_records','revoked_sessions'
  )
  and grantee in ('anon','authenticated','service_role')
order by table_name,grantee,privilege_type;

select p.proname,p.prosecdef,
       has_function_privilege('anon',p.oid,'EXECUTE') as anon_exec,
       has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_exec,
       has_function_privilege('service_role',p.oid,'EXECUTE') as service_exec
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='rls_auto_enable';
```

## 7. Known limitations

1. No authenticated users exist in the live Auth catalog at the time of this inspection; therefore break-glass approval/activation, real membership resolution, and provider event flows were not exercised with real identities.
2. No tenant-specific DENY policies are present in the current live policy set.
3. Auth provider event ingestion is configured only when the webhook secret is deployed; connector inspection does not prove runtime secret configuration or provider webhook registration.
4. Idempotency persistence is present, but zero command records exist and runtime replay/concurrency behavior has not been exercised against the live database.
5. No production runtime deployment, UAT, staging, load test, security acceptance, or release testing was performed.

## 8. Evidence and disposition

- Repository source: `supabase/migrations/20261118065058_m012_security_permissions.sql`
- Remote history: version `20261118065058`, name `phase_01_m012_security_permissions`
- Supabase live catalog: 67 permissions, 67 policies, 67 policy snapshots
- RLS: 18/18 public tables enabled; FORCE RLS 0/18
- Server-only security tables: no anon/authenticated/service_role table grants
- Current Security Advisor: six INFO findings for server-only tables without client policies
- Phase 01 remains **PARTIAL / IN PROGRESS**. Migration completion is not equivalent to Phase 01 completion.
