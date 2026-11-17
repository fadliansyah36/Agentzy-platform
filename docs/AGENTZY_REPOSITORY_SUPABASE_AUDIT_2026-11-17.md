# AGENTZY — REPOSITORY & SUPABASE AUDIT

Date: 17 November 2026  
Repository: `fadliansyah36/Agentzy-platform`  
Branch: `main`  
Initial source audit HEAD: `110f5d923507fe02c0740cdd8f548f630f03d4e0`  
Governance update HEAD (Phase 00 evidence and ADR alignment): `d3000bfd093d64318f6f0ae3957826fdd4dbea2f`  
Supabase ref: `cwhjdnkotuhueeudpgeu`

## Executive result
Existing portal UI is present. Implementation should be backend-first, not a UI redesign. No Python/FastAPI backend or Supabase migration directory was found in the audited repository tree. Portal hooks/services contain local initial collections and local React state. Corrected GitHub write access and Supabase project access are now available.

## Repository
- 282 entries in recursive tree at the latest Phase 00 snapshot, not truncated (tree SHA `a9482d864aa6683027bbec02321ca469f1251596`). Existing portal path counts: `apps/admin` 55, `apps/corporate` 49, `apps/ai-workforce` 42, root `app` 28. The counts are paths, including directories, not source-file counts.
- `apps/admin/`, `apps/corporate/`, and `apps/ai-workforce/` contain UI feature modules.
- Root `app/` contains wrappers for admin, AI workforce, corporate, workforce and root landing route.
- Missing: `apps/api/`, `apps/landing/`, `apps/workforce/`, `supabase/`, `packages/api-client/`, `packages/api-contracts/`, `packages/design-tokens/`, `workers/`, `services/`, and `infrastructure/`. Root `docs/` and `AGENTS.md` are now present.
- Package versions: Next.js 15, React 19, TypeScript 5.9, Tailwind 4; Firebase and Google GenAI dependencies.
- `.env.example` lists Gemini and Google Maps keys.

## Code observations
- Admin service returns `INITIAL_*` collections; admin hook initializes authenticated state locally.
- Corporate hook initializes tenant and domain collections locally; authentication starts as true.
- AI Workforce hook initializes workers/providers/skills/tools/memory/workflows/runs/credits from constants.
- AI Workforce service is primarily formatting/artifact helper logic, not FastAPI API client integration.
- `app/api/ai-workforce/generate-content/route.ts` invokes Google GenAI from a Next.js handler, hardcodes model ID and accepts tenantName from request body. Move invocation to FastAPI AI Gateway and resolve tenant from authenticated membership.
- Maps handlers exist in Next.js under `app/api/maps/` and `app/api/config/maps/`; consolidate under backend architecture after audit.

## Corrected connector bindings and live Supabase audit
- GitHub binding: `More Ai` / account `fadliansyah36`, link `link_6af361418a4481919cc84f9f7e0d522b`; repository permissions observed: pull, push and admin.
- Supabase binding: `Agentzy DB`, project ref `cwhjdnkotuhueeudpgeu`, link `link_6afc797a7c44819192023bb809b8cae1`.
- Project status: `ACTIVE_HEALTHY`; region `ap-northeast-1`; PostgreSQL `17.12`.
- `public` schema table inventory: empty. Supabase project migration history: empty. This does not mean the platform-managed schemas are empty.
- All-schema inventory includes Supabase-managed `auth`, `storage`, `realtime`, and `vault` relations. `auth.schema_migrations` (84 rows), `storage.migrations` (81 rows), and `realtime.schema_migrations` (97 rows) are platform-managed migration histories, not Agentzy application migrations. `storage.buckets` and `storage.objects` currently contain 0 rows; Auth users and Realtime subscriptions also report 0 rows.
- Extensions observed installed: `vector` 0.8.2 and `pgcrypto` 1.3 in `extensions`, `pg_stat_statements` 1.11, `supabase_vault` 0.3.2, and `uuid-ossp` 1.1. PostGIS 3.3.7 is available but not installed.
- Security Advisor reports two WARN findings for the same function: `public.rls_auto_enable()` is `SECURITY DEFINER` and executable by `anon` and `authenticated` through RPC. Its current definition is an event-trigger function that enables RLS on newly created tables in `public`; its ACL includes execute for `PUBLIC` (shown as `=X/postgres`), `anon`, `authenticated`, `service_role`, and `postgres`. Do not invoke it as part of Agentzy setup. Catalog confirms enabled event trigger `ensure_rls`, owned by `postgres`, is attached to this function for `CREATE TABLE`, `CREATE TABLE AS`, and `SELECT INTO`. Do not invoke it manually. Determine whether RPC exposure can be safely removed without affecting event-trigger execution, then remediate with a reviewed privilege/function change only after impact analysis. [Advisor: SECURITY DEFINER RPC exposure](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).
- Performance and health advisors returned no lints at audit time.
- No database changes have been applied by this audit.
- Read-only catalog inspection returned no rows from `pg_policies`; this currently indicates no row policies are catalogued for the queried schemas. Do not interpret platform-managed table grants as application grants. `information_schema.role_table_grants` includes broad platform-managed role grants on `storage`/`realtime` internals; these require provider-aware interpretation and must not be modified as Agentzy policy.
- Event trigger inventory: `ensure_rls` enabled and attached to `public.rls_auto_enable()`; additional Supabase-managed event triggers `issue_graphql_placeholder`, `issue_pg_cron_access`, `issue_pg_graphql_access`, `issue_pg_net_access`, `pgrst_ddl_watch`, and `pgrst_drop_watch` are present. Row-trigger inventory shows platform-managed triggers in `storage` and `realtime`; no Agentzy application-owned triggers were identified.
- `pg_policies` returned no rows for `public` and `storage`. `pg_publication_tables` returned no rows; Realtime subscription count is 0. Storage bucket/object counts are 0.
- Database settings observed: `row_security=on`, `ssl=on`, `statement_timeout=120000`, `default_transaction_isolation=read committed`.
- Security Advisor: 2 WARN lint records, both for `public.rls_auto_enable()` (anon and authenticated execution). Performance and health advisors: no lints.
- Still pending: verify Auth provider and security configuration, Data API exposed schemas, database-level grants/default privileges, full function/trigger dependencies and provider-specific configuration. The SQL catalog does not expose all project dashboard settings; these require a supported project-settings connector or dashboard evidence. No changes have been applied to Supabase.

## Current blockers / readiness
1. Connector-access blockers are closed; use the verified GitHub and Supabase bindings documented in the backlog.
2. FastAPI backend and `supabase/` migration source are absent from the initial audited tree; these are implementation gaps, not connector blockers.
3. Supabase application `public` schema and project migration history are empty. Platform-managed `auth`, `storage`, `realtime`, and `vault` schemas remain present and must not be mistaken for Agentzy-owned schema.
4. Existing demo/local-state paths must be replaced phase-by-phase by typed FastAPI API clients.
5. The exposed SECURITY DEFINER function and remaining Auth/Storage/Realtime/Data API settings require a reviewed security baseline before migrations.
6. Do not apply migrations or invent schema until the Master PRD and Technical Blueprint domain model is reconciled with the full live Supabase inventory.

See `docs/phase-00/BASELINE_EVIDENCE_AND_ACCEPTANCE.md` for the portal/domain/API ownership proposal, migration strategy, explicit audit limitations and Phase 00 acceptance matrix. This report remains a partial source/security audit, not a Phase 00 completion claim.
