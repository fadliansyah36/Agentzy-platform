# Phase 01 — RLS & Grants Matrix

## Live baseline (read-only observation)

- Nine existing public application tables were observed.
- RLS was enabled on all nine; FORCE RLS was not enabled.
- Existing policies were SELECT-oriented.
- Broad table privileges existed for `anon`, `authenticated` and `service_role`.
- `public.rls_auto_enable()` was SECURITY DEFINER and swallowed exceptions; Security Advisor reported function EXECUTE warnings.
- Broad default ACL entries existed.

## M010 intended post-apply state

- Existing application tables: revoke client privileges from `anon` and `authenticated`; grant authenticated SELECT only. No direct client business INSERT/UPDATE/DELETE.
- New tenant-owned hierarchy tables: RLS enabled, tenant-active-membership SELECT policy, authenticated SELECT only.
- `access_policies`: tenant membership SELECT policy.
- `revoked_sessions`: RLS enabled, no client/service-role table grants; backend private database connection only.
- New postgres-owned tables/functions: remove broad anon/authenticated default privileges.
- `rls_auto_enable()`: fail closed; DDL aborts if RLS cannot be enabled; direct Data API EXECUTE grants revoked.

FastAPI remains the business write authority and performs server-side authorization before using the private database connection.

## Status

**M010 is not applied.** Live grants, RLS function body and Advisor findings are unchanged. Post-apply verification must inspect every table's RLS/force-RLS state, policies, grants, function ACL, event trigger behavior and Security Advisor output.
