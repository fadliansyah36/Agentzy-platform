# Phase 00 — RLS & Grants Evidence

**Observation:** 18 November 2026, 05:03 UTC  
**Project:** `cwhjdnkotuhueeudpgeu` / PostgreSQL 17.12  
**Source:** read-only Supabase catalog queries.

## 1. Table-level permission matrix — current state
All nine tables have RLS enabled. For each table below, live `information_schema.role_table_grants` returned the same privileges for `anon`, `authenticated`, and `service_role`: `DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE`.

| Table | RLS | FORCE RLS | anon | authenticated | service_role |
|---|---:|---:|---|---|---|
| profiles | ON | OFF | all listed | all listed | all listed |
| tenants | ON | OFF | all listed | all listed | all listed |
| organizations | ON | OFF | all listed | all listed | all listed |
| memberships | ON | OFF | all listed | all listed | all listed |
| roles | ON | OFF | all listed | all listed | all listed |
| permissions | ON | OFF | all listed | all listed | all listed |
| role_permissions | ON | OFF | all listed | all listed | all listed |
| membership_roles | ON | OFF | all listed | all listed | all listed |
| audit_logs | ON | OFF | all listed | all listed | all listed |

This is not least privilege. RLS is an independent row-filtering layer and does not replace SQL grants.

## 2. Current policies
Nine policies were returned, all SELECT policies for authenticated: audit_logs_read_own_actor, membership_roles_read_self, memberships_read_self, organizations_read_by_active_membership, permissions_read_authenticated, profiles_read_self, role_permissions_read_visible_roles, roles_read_platform_or_member, tenants_read_by_active_membership. No INSERT, UPDATE or DELETE policies were returned for the application tables.

## 3. Function privilege matrix
`public.rls_auto_enable()` currently grants EXECUTE to PUBLIC, anon, authenticated, postgres and service_role. Owner is postgres; SECURITY DEFINER is true; `search_path=pg_catalog`.

## 4. Default ACL evidence
Live `pg_default_acl` shows postgres defaults in public for sequences, functions and tables grant anon, authenticated and service_role. postgres defaults also exist in storage. supabase_admin defaults in public and Supabase-managed schemas include broad ACL entries. Managed schemas/grants must not be changed as a shortcut.

## 5. Permission matrix — target decision not approved
| Principal | Target boundary | Current disposition |
|---|---|---|
| anon | No business table access unless a documented public read use case requires it | Broad grants observed; remediation pending |
| authenticated | Explicit user-scoped reads and narrowly authorized commands; sensitive business writes through FastAPI | Broad grants observed; remediation pending |
| service_role | Server-only exceptional administrative access; never browser-exposed | Broad grants observed; application dependency inventory pending |
| postgres / supabase_admin | Administrative/migration ownership only | Managed defaults require separate scope review |

## 6. Verification and status
- RLS enabled 9/9; FORCE RLS 0/9; policies 9, SELECT-only.
- Storage buckets/objects/policies 0/0/0.
- No grants, default ACLs, policies, tables, functions or triggers changed.
- RR-003 and RR-004 remain BLOCKED pending complete data-path inventory, Security/DBA approval, recovery plan, additive migration and post-change verification.
