# M010 — Post-Migration Verification

**Target:** Agentzy-db  
**Project ref:** `cwhjdnkotuhueeudpgeu`  
**Project URL:** `https://cwhjdnkotuhueeudpgeu.supabase.co`  
**Migration source:** `supabase/migrations/20261118062335_phase_01_m010_identity_tenant_completion.sql`  
**Migration history name:** `phase_01_m010_identity_tenant_completion`  
**Remote migration version:** `20261118062335`  
**Status:** APPLIED; catalog verification completed with documented limitations  
**Verification observation:** 2026-11-18 06:23:59 UTC (Supabase Advisor observation timestamp)

## 1. Execution evidence

The migration was read from the repository `main` branch and submitted to the connected Supabase project whose returned project ref was `cwhjdnkotuhueeudpgeu`. Supabase returned `{"success":true}`.

Remote migration history now contains exactly these four entries:

| Version | Name |
|---|---|
| 20261117175948 | phase_01_platform_core_identity_tenant |
| 20261117181011 | phase_01_system_roles_permissions_auth_profile |
| 20261117182410 | phase_01_profile_email_projection |
| 20261118062335 | phase_01_m010_identity_tenant_completion |

The migration API assigned version `20261118062335`; the source file was subsequently renamed to that exact version so the repository and remote migration ledger agree. The SQL content was not changed by this filename reconciliation. The three previously applied migrations were not edited.

## 2. Expected vs actual schema

The five new expected tables exist:

- `public.organization_units`
- `public.branches`
- `public.departments`
- `public.access_policies`
- `public.revoked_sessions`

The existing `profiles`, `tenants`, `memberships`, `roles`, `permissions`, and `membership_roles` tables now expose the M010 columns. `profiles.locale` and `profiles.timezone` already existed before M010 and remained unchanged.

New table column types were inspected through `information_schema.columns`. IDs are UUID; hierarchy references are UUID; conditions/settings are JSONB; lifecycle timestamps are `timestamp with time zone`; priority/version are integer. Required/non-null columns and defaults match the migration source.

## 3. Constraints and relationships

Catalog inspection confirmed:

- `organizations_tenant_id_id_unique` composite unique key.
- Composite tenant/organization foreign keys from organization units, branches and departments to organizations.
- Composite parent and branch relationships for hierarchy records.
- `memberships_tenant_org_unique` and tenant/organization-scoped foreign keys to organization units, branches and departments.
- Membership scope checks for organization and department/branch consistency.
- `membership_roles_scope_type_check` and `membership_roles_validity_check`.
- `roles_scope_type_check`.
- `permissions_risk_level_check`.
- `access_policies` tenant FK and unique tenant/policy key.
- `revoked_sessions` user FK, session primary key, and expiry-after-revocation check.

No duplicate `(tenant_id,key)` role rows were found.

## 4. Index reconciliation

All hierarchy, membership-scope, access-policy and revoked-session indexes declared by M010 are present.

**Documented pre-existing index-name difference:** M010 contains `CREATE UNIQUE INDEX IF NOT EXISTS roles_tenant_key_unique ... NULLS NOT DISTINCT`. Before applying M010, the live database already had an index with that name defined as a partial unique index for non-null tenant IDs, plus `roles_platform_key_unique` as a partial unique index for null tenant IDs. Because of `IF NOT EXISTS`, PostgreSQL preserved the existing definitions. Together those two indexes enforce per-tenant and platform role-key uniqueness, but the catalog definition is not byte-for-byte identical to the M010 statement. This is a known schema-definition deviation, not an unexplained missing object. A later additive migration should normalize the naming/definition if one unified index is required.

## 5. RLS, policies and grants

- RLS is enabled on all 14 public application tables inspected (9 existing + 5 new).
- FORCE ROW LEVEL SECURITY is not enabled on these 14 tables.
- New read policies exist for organization units, branches, departments and tenant-scoped access policies.
- `revoked_sessions` has RLS enabled and intentionally has no client policy; client roles therefore have no row access through RLS.
- The new hierarchy and access-policy tables have authenticated SELECT only; no client INSERT/UPDATE/DELETE grants.
- M010 revoked broad table privileges from `anon` and `authenticated` on the nine existing tables and re-granted authenticated SELECT only. `anon` has no table grants on those application tables.
- Existing `service_role` privileges on the nine pre-existing tables remain. The FastAPI private database connection remains the business-write path; the service-role key must not be used as a general business repository credential.

## 6. Function and trigger

- `public.rls_auto_enable()` remains SECURITY DEFINER with `search_path = pg_catalog`.
- Its body is now fail-closed: inability to enable RLS aborts the DDL transaction rather than swallowing the exception.
- Function EXECUTE ACL inspection returned only `postgres`; PUBLIC, anon, authenticated and service_role are not granted EXECUTE.
- Existing event trigger `ensure_rls` remains enabled and still references `rls_auto_enable()`.

## 7. Supabase Advisor results

Security Advisor after M010 no longer reported the earlier anon/authenticated SECURITY DEFINER execution warnings. It returned one INFO finding:

- `rls_enabled_no_policy`: `public.revoked_sessions` has RLS enabled but no policy. This is an intentional deny-all client posture. After M011, the same INFO finding also applies to `access_policies`, `access_policy_versions`, `auth_provider_events`, `break_glass_requests`, and `idempotency_records`. Server-side private database access is used for these records.

Performance Advisor returned informational findings:

- 20 unindexed foreign-key findings, including created_by/updated_by audit references and some composite parent/scope relationships.
- 14 unused-index findings. The database has no operational workload history yet, so unused-index findings are not sufficient evidence to remove the indexes.

These Advisor findings remain visible and are not represented as security acceptance.

## 8. API compatibility

The Phase 01 backend's session verifier references `public.revoked_sessions`; the table and columns it queries now exist. The migration does not by itself prove end-to-end runtime compatibility or authorization behavior. No production deployment, UAT, staging, load test or security acceptance was performed.

## 9. Verification SQL

The following catalog checks were executed against the canonical project:

```sql
-- New M010 tables
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'organization_units', 'branches', 'departments',
    'access_policies', 'revoked_sessions'
  )
order by tablename;

-- M010 new table columns and data types
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'organization_units', 'branches', 'departments',
    'access_policies', 'revoked_sessions'
  )
order by table_name, ordinal_position;

-- RLS and FORCE RLS
select c.relname, c.relrowsecurity, c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','p')
order by c.relname;

-- Policies
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Event trigger
select evtname, evtenabled, evtfoid::regprocedure
from pg_event_trigger
where evtname = 'ensure_rls';

-- SECURITY DEFINER function grants
select p.proname, coalesce(r.rolname, 'PUBLIC') as grantee,
       a.privilege_type, a.is_grantable
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral aclexplode(
  coalesce(p.proacl, acldefault('f', p.proowner))
) a
left join pg_roles r on r.oid = a.grantee
where n.nspname = 'public' and p.proname = 'rls_auto_enable';

-- Duplicate role keys
select tenant_id, key, count(*)
from public.roles
group by tenant_id, key
having count(*) > 1;
```

All queries returned catalog results; the duplicate role-key query returned no rows.

## 10. Known limitations

1. No database-wide FORCE RLS is enabled. The application must continue using tenant-aware policies and explicit backend authorization.
2. `revoked_sessions` is deny-all to client roles by design; its Advisor INFO finding is expected.
3. The existing split partial unique indexes for platform and tenant roles differ from the single `NULLS NOT DISTINCT` declaration in the M010 source.
4. Performance Advisor reports 20 unindexed FKs and 14 unused indexes; these require workload-aware review.
5. M010 establishes storage for ABAC policies but does not implement the FastAPI policy evaluator or administration lifecycle.
6. M010 is not equivalent to Phase 01 completion.

## 11. Evidence references

- Repository migration source: `supabase/migrations/20261118062335_phase_01_m010_identity_tenant_completion.sql`
- Remote migration ledger: version `20261118062335`, name `phase_01_m010_identity_tenant_completion`
- Supabase project ref: `cwhjdnkotuhueeudpgeu`
- Migration execution result: `success: true`
- Catalog checks: tables, columns, constraints, indexes, RLS policies, function ACL and event trigger queried after apply
- Security Advisor observation: 2026-11-18T06:23:59.190Z
- Performance Advisor observation: 2026-11-18T06:23:59.219Z


**Follow-up migration:** M011 (`20261118062647`) completed the ABAC policy metadata/version history and server-only access hardening. See `docs/phase-01/M011_SECURITY_LIFECYCLE_VERIFICATION.md`.
