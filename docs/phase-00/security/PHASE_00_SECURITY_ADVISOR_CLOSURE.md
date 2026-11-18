# Phase 00 — Security Advisor Closure

**Status: NOT CLOSED — warnings remain**  
**Latest observation:** 2026-11-18 05:03:51.909 UTC  
**Project:** `cwhjdnkotuhueeudpgeu`

| Lint | Level | Object | Root cause | Status |
|---|---|---|---|---|
| 0028 `anon_security_definer_function_executable` | WARN | `public.rls_auto_enable()` | SECURITY DEFINER function callable by anon through Data API RPC | OPEN |
| 0029 `authenticated_security_definer_function_executable` | WARN | `public.rls_auto_enable()` | SECURITY DEFINER function callable by authenticated through Data API RPC | OPEN |

The function is owned by postgres, has `search_path=pg_catalog`, and ACL includes PUBLIC, anon, authenticated, postgres and service_role. `ensure_rls` remains enabled. The function catches `WHEN OTHERS` and logs without re-raising, creating a fail-open RLS activation path.

Official remediation:
- [Supabase lint 0028](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Supabase lint 0029](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Supabase event-trigger guidance](https://supabase.com/docs/guides/database/postgres/event-triggers)

No warning has been suppressed or accepted as a risk. No ACL, function or trigger change was applied. The fail-closed correction and least-privilege EXECUTE change remain blocked by missing verified backup/PITR evidence and required DBA/Security Lead approval.

Future closure requires migration SHA and remote history, post-change function/ACL and trigger catalog, proof that RPC is denied to anon/authenticated, clean corresponding Security Advisor results, recovery evidence and Security Lead sign-off.

**RR-001 and RR-002 remain BLOCKED. Phase 00 cannot close.**
