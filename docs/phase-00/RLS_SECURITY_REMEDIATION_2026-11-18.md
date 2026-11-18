# Phase 00 — RLS Security Remediation Assessment

**Date:** 18 November 2026  
**Repository:** fadliansyah36/Agentzy-platform / main  
**Supabase:** Agentzy-db / cwhjdnkotuhueeudpgeu  
**Status:** **BLOCKED — remediation SQL reviewed, not applied to production**

## 1. Current verified state

Read-only catalog evidence from PostgreSQL 17.12:

| Property | Current value |
|---|---|
| Function | public.rls_auto_enable() |
| Owner | postgres |
| SECURITY DEFINER | true |
| search_path | pg_catalog |
| Event trigger | ensure_rls |
| Event | ddl_command_end |
| Enabled | O (enabled) |
| Tags | CREATE TABLE, CREATE TABLE AS, SELECT INTO |
| Function EXECUTE | PUBLIC, anon, authenticated, service_role, postgres |
| Application public tables | 9 |
| RLS enabled | 9/9 |
| FORCE RLS | 0/9 |
| Security Advisor | 0028 and 0029 WARN |

The helper scans `pg_event_trigger_ddl_commands()`, filters to table/partitioned table commands in `public`, and runs `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Its inner exception block catches `WHEN OTHERS`, logs a generic message and returns normally.

## 2. Failure mode and impact

PostgreSQL executes event triggers inside the transaction of the DDL statement. An error raised by a `ddl_command_end` event trigger aborts the transaction and rolls back the DDL. The current handler catches the exception, so a failure while enabling RLS does not reach the event-trigger caller and can allow the original CREATE TABLE transaction to commit.

This is a fail-open control gap for future public tables. It does not mean the nine current tables have RLS disabled: catalog evidence shows RLS is enabled on all nine. It means the automatic future-table guard is not fail-closed.

The current fixed `search_path=pg_catalog` is retained as a positive hardening property. SECURITY DEFINER remains necessary for the helper's owner-level ALTER TABLE operation; public API execution is not necessary.

## 3. PostgreSQL 17 invocation privilege review

The PostgreSQL 17 stable implementation of `EventTriggerInvoke` resolves the stored function OID with `fmgr_info` and invokes it with `FunctionCallInvoke`; this invocation path does not perform an end-user EXECUTE ACL check on every event. The function's SECURITY DEFINER property then runs it with its owner privileges. The event trigger itself is owned by postgres.

Source evidence:
- [PostgreSQL 17 event_trigger.c — EventTriggerInvoke](https://github.com/postgres/postgres/blob/REL_17_STABLE/src/backend/commands/event_trigger.c)
- [PostgreSQL 17 CREATE EVENT TRIGGER](https://www.postgresql.org/docs/17/sql-createeventtrigger.html)
- [PostgreSQL event trigger transaction semantics](https://www.postgresql.org/docs/18/event-trigger-definition.html)

This supports revoking Data API callers while preserving the trigger's internal invocation path. It is source-code evidence for PostgreSQL 17, not a substitute for post-change verification on the managed Supabase build.

## 4. Remediation decision

**Decision:** retain the event trigger and SECURITY DEFINER function; make RLS activation fail closed; remove direct EXECUTE access from Data API roles.

Candidate additive migration SQL (review draft; NOT applied):

```sql
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'partitioned table')
  LOOP
    IF cmd.schema_name = 'public' THEN
      SELECT c.relname
        INTO tbl
      FROM pg_catalog.pg_class AS c
      WHERE c.oid = cmd.objid;

      IF tbl IS NULL THEN
        RAISE EXCEPTION
          'rls_auto_enable could not resolve relation for %',
          cmd.object_identity
          USING ERRCODE = '55000';
      END IF;

      EXECUTE format(
        'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
        cmd.schema_name,
        tbl
      );

      RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
    ELSE
      RAISE LOG 'rls_auto_enable: skipped % (schema %)',
        cmd.object_identity, cmd.schema_name;
    END IF;
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'rls_auto_enable failed: SQLSTATE %, SQLERRM %',
      SQLSTATE, SQLERRM;
    RAISE;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()
  FROM PUBLIC, anon, authenticated, service_role;
```

Notes:
- The exception handler logs context and re-raises; it no longer swallows failure.
- The function retains postgres ownership, SECURITY DEFINER and fixed pg_catalog search_path.
- No GRANT is required to the event-trigger caller based on the PostgreSQL 17 invocation implementation; postgres remains the function owner.
- The event trigger is not dropped or disabled.
- RLS is never disabled.
- The candidate migration changes no existing table policy or application-table grant.

## 5. Security Advisor findings

| Finding | Current status | Planned fix | Verification required |
|---|---|---|---|
| 0028 anon_security_definer_function_executable | WARN | Revoke EXECUTE from PUBLIC and anon | Advisor must no longer return finding; verify has_function_privilege('anon', ...) = false |
| 0029 authenticated_security_definer_function_executable | WARN | Revoke EXECUTE from PUBLIC and authenticated | Advisor must no longer return finding; verify has_function_privilege('authenticated', ...) = false |

The function is also directly granted to service_role; that grant is removed because service_role has no legitimate need to invoke the DDL guard via RPC. The owner postgres retains owner privileges.

## 6. Recovery and blast-radius plan

Before applying:
1. Capture exact function definition, owner, proconfig, ACL, event-trigger definition/owner/enabled state, all public table RLS flags, policies, table/column grants, default ACLs and migration history.
2. Prepare an additive migration and verify its source checksum.
3. Confirm the managed database supports the PostgreSQL 17 event-trigger invocation behavior above.
4. Confirm a database backup/PITR recovery point is available through the project owner/dashboard.

Apply:
- Function replacement and ACL revocation must be in one transaction/migration.
- If migration fails, PostgreSQL transactional DDL should roll back the function and ACL changes together.
- Do not disable RLS or drop the event trigger.
- After applying, verify event trigger remains enabled; owner/search_path/security mode unchanged; function ACL restricted; new public table DDL produces relrowsecurity=true; and the two Advisor findings disappear.

Emergency recovery:
- If fail-closed behavior blocks a legitimate DDL, stop schema changes and repair the function with a forward migration.
- Temporarily disabling `ensure_rls` is an emergency DBA-only break-glass action, not the normal rollback. It requires an explicit incident record, owner approval, immediate repair, re-enable and post-incident verification.
- Never use a destructive database reset.

## 7. Why no production change was applied in this pass

- Supabase CLI is not installed in the available execution environment; `supabase --version` returned command-not-found and `npx supabase@latest --version` timed out.
- The Supabase skill requires creating migration files with `supabase migration new`; that command could not be run here.
- No verified isolated PostgreSQL 17 reproduction or managed-project backup/PITR confirmation is available.
- The user explicitly forbids speculative production ACL/trigger changes.

Therefore the remediation is technically specified but **BLOCKED / NOT APPLIED**. No before/after state change is claimed.

## 8. Evidence owner and approval

| Item | Status | Owner |
|---|---|---|
| Catalog audit | DONE (read-only evidence) | Database Engineering |
| PostgreSQL 17 invocation review | DONE (upstream source review) | Database Engineering |
| Fail-closed SQL review | PARTIAL — draft only | Database/Security Lead |
| Supabase migration creation and apply | BLOCKED — CLI/access | Supabase Admin |
| Post-change catalog and Advisor verification | BLOCKED — remediation not applied | Supabase Admin + Security Lead |
| Security sign-off | PENDING APPROVAL | Security Owner |

