# Phase 00 — Supabase Security Remediation

**Status: BLOCKED — no production security change applied**  
**Observed:** 18 November 2026, 05:03 UTC  
**Repository snapshot:** main, latest inspected commit `f40119c07e64fee01c8a0817433fa13fcab126aa`  
**Supabase:** `Agentzy-db` / `cwhjdnkotuhueeudpgeu` / PostgreSQL 17.12

## 1. Scope and authority
This records the evidence and remediation design portion of Workstream A. It is not a Security Lead approval and does not claim completed remediation. Canonical risk IDs and owners remain in `PHASE00_RESIDUAL_RISK_REGISTER_2026-11-18.md`. Supabase skill was read before this review. Live project identity, schema, migration history, extensions, policies, function/event-trigger definition, grants, default ACLs and Security Advisor were rechecked read-only.

## 2. Live findings
- Nine Agentzy tables exist in `public`; RLS is enabled on 9/9 and FORCE RLS on 0/9.
- Nine current policies are SELECT-only for authenticated users.
- `ensure_rls` is enabled on `ddl_command_end` for CREATE TABLE, CREATE TABLE AS and SELECT INTO.
- `public.rls_auto_enable()` is SECURITY DEFINER, owner `postgres`, fixed `search_path=pg_catalog`.
- Its inner `WHEN OTHERS` handler logs but does not re-raise. RLS-enable failure can therefore be swallowed before the DDL transaction commits.
- Function ACL grants EXECUTE to PUBLIC, postgres, anon, authenticated and service_role.
- Security Advisor reports 0028 (anon) and 0029 (authenticated) WARN.
- anon, authenticated and service_role have broad table privileges on all nine public tables.
- Default ACLs include broad privileges for postgres-created objects in public and storage and supabase_admin defaults across public and managed schemas.

## 3. Remediation design
### RR-001 — fail-closed RLS event trigger
Technical direction: replace the swallowed exception with a re-raised exception so the originating DDL transaction rolls back if RLS cannot be enabled. Preserve current event-trigger scope and secure search_path; do not broaden into managed schemas.

Supabase's current event-trigger guide uses the fail-closed pattern: log the failure and `RAISE`. PostgreSQL 17 documents that a failing ddl_command_end event trigger aborts the containing transaction:
- https://supabase.com/docs/guides/database/postgres/event-triggers
- https://www.postgresql.org/docs/17/event-trigger-definition.html

**Not applied:** verified backup/PITR recovery point and named DBA/Security Lead approval have not been supplied. The connector does not provide backup/PITR evidence. No staging or disposable reproduction was run under the explicit no-staging constraint.

### RR-002 — function EXECUTE ACL
Do not revoke EXECUTE blindly. PostgreSQL documentation establishes that only superusers can create event triggers, but available official references do not conclusively document the exact privilege-check timing for an already-created event trigger after ACL revocation on this managed PostgreSQL deployment. Preserve the event trigger and prove it still fires after ACL hardening before applying.

### RR-003 / RR-004 — least privilege
No blanket revoke is approved. First produce the complete per-object privilege matrix and identify browser, FastAPI, migration and service-role data paths. Distinguish project-owned defaults from Supabase-managed objects/schemas. Use reviewed additive migrations, not untracked SQL.

## 4. Recovery and impact gate
Before production mutation:
1. Supabase Project Owner supplies verified backup/PITR recovery point and retention details.
2. DBA records before-state grants, function definition/owner/config, event-trigger definition/owner and migration state.
3. Security Lead approves SQL, blast radius, rollback SQL and recovery sequence.
4. Migration is committed before application and immutable once applied.
5. Post-change catalog, event-trigger, permission-denial and Advisor evidence is collected.

No destructive SQL or privilege change was executed. No database object, migration, grant, policy, function or trigger was changed.

## 5. Decision
**RR-001: BLOCKED. RR-002: BLOCKED. RR-003: BLOCKED. RR-004: BLOCKED.** This is remediation design, not sign-off or closure.
