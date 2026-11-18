# M011 — ABAC and Security Lifecycle Migration Verification

**Project:** Agentzy-db  
**Project ref:** `cwhjdnkotuhueeudpgeu`  
**Remote migration version:** `20261118062647`  
**Remote migration name:** `phase_01_m011_abac_security_lifecycle`  
**Repository source:** `supabase/migrations/20261118062647_m011_abac_security_lifecycle.sql`  
**Status:** APPLIED; schema and policy seed verification completed  
**Advisor observation:** 2026-11-18 06:32:33 UTC

## Execution and migration history

Supabase returned `success: true` when M011 was applied to project ref `cwhjdnkotuhueeudpgeu`. Remote history now contains M010 and M011 after the three original Phase 01 migrations:

- `20261118062335 / phase_01_m010_identity_tenant_completion`
- `20261118062647 / phase_01_m011_abac_security_lifecycle`

Repository migration filenames were reconciled to those remote versions. Earlier migration files were not edited.

## Objects and schema verified

M011 adds and the live catalog now exposes:

- `access_policies.policy_name`, `description`, `effective_from`, `effective_until`
- `access_policy_versions` — immutable policy snapshot history keyed by policy and version
- `auth_provider_events` — provider event identifier, event type, identity/session references, timestamps, request correlation, processing state and payload digest
- `break_glass_requests` — request/approval/activation/expiry/revocation/review fields, reason and scoped request payload
- `idempotency_records` — actor/tenant/command/key, fingerprint, execution status, response and expiry

Foreign keys, primary/unique keys, check constraints and supporting indexes were inspected through the live Supabase catalog. The migration added no user or tenant records.

## Baseline ABAC policy seed

The central permission registry currently contains 58 permission definitions. M011 created exactly 58 global baseline ABAC policies with keys prefixed `rbac_baseline:`. A query confirmed:

- total policy rows: 58
- global baseline policy rows: 58
- policies missing `policy_name`: 0

Each baseline policy binds its resource/action pair to the corresponding permission key in `subject.permissions`. Tenant-specific policy records can add restrictions or explicit DENY policies. The evaluator applies explicit DENY precedence and deny-by-default semantics.

## Least-privilege table access

M011 removed client table privileges from:

- `access_policies`
- `access_policy_versions`
- `auth_provider_events`
- `break_glass_requests`
- `idempotency_records`

The same check confirmed no `anon`, `authenticated`, or `service_role` table grants remain on those server-only security tables. Their RLS is enabled and there are no client policies. Policy bodies, event records, break-glass requests and idempotency responses are therefore server-only and must be accessed through FastAPI's private database connection.

## Security Advisor

Security Advisor returned six INFO findings for RLS-enabled tables without client policies:

- `access_policies`
- `access_policy_versions`
- `auth_provider_events`
- `break_glass_requests`
- `idempotency_records`
- `revoked_sessions`

This is intentional deny-all client access for server-only tables. It is not represented as a clean/zero-finding Advisor result.

## Verification SQL

```sql
select count(*) as policies,
       count(*) filter (where tenant_id is null and policy_key like 'rbac_baseline:%') as baseline,
       count(*) filter (where policy_name is null) as missing_names
from public.access_policies;

select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'access_policy_versions', 'auth_provider_events',
    'break_glass_requests', 'idempotency_records'
  )
order by table_name, ordinal_position;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'access_policies', 'access_policy_versions', 'auth_provider_events',
    'break_glass_requests', 'idempotency_records', 'revoked_sessions'
  )
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;

select c.relname, c.relrowsecurity, c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'access_policies', 'access_policy_versions', 'auth_provider_events',
    'break_glass_requests', 'idempotency_records', 'revoked_sessions'
  );
```

Results: 58/58 baseline policies; zero missing names; zero client grants on the listed server-only tables; RLS enabled on all six tables.

## Known limitations

1. M011 provides durable data structures; it does not by itself complete provider webhook ingestion, event processing, break-glass API lifecycle, or idempotency middleware.
2. The policy version table is populated for initial policy snapshots. Policy administration code must write a new snapshot for each mutation.
3. The Security Advisor INFO findings are expected because these tables intentionally have no client policies.
4. No UAT, staging, load, security acceptance or production release testing was performed.
