# AGENTZY — REPOSITORY & SUPABASE AUDIT

Date: 17 November 2026  
Repository: `fadliansyah36/Agentzy-platform`  
Branch: `main`  
Observed HEAD at initial audit: `110f5d923507fe02c0740cdd8f548f630f03d4e0`  
Supabase ref: `cwhjdnkotuhueeudpgeu`

## Executive result
Existing portal UI is present. Implementation should be backend-first, not a UI redesign. No Python/FastAPI backend or Supabase migration directory was found in the audited repository tree. Portal hooks/services contain local initial collections and local React state. Corrected GitHub write access and Supabase project access are now available.

## Repository
- 272 entries in recursive tree, not truncated.
- `apps/admin/`, `apps/corporate/`, and `apps/ai-workforce/` contain UI feature modules.
- Root `app/` contains wrappers for admin, AI workforce, corporate, workforce and root landing route.
- Missing: `apps/api/`, `apps/landing/`, `apps/workforce/`, `supabase/`, `docs/`, and root `AGENTS.md`.
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
- Security Advisor reports two WARN findings for the same function: `public.rls_auto_enable()` is `SECURITY DEFINER` and executable by both `anon` and `authenticated` through RPC. Do not invoke it as part of the Agentzy setup. Inspect its definition, ownership, grants and intended purpose; remediate through a reviewed migration/privilege change after impact analysis. [Advisor: SECURITY DEFINER RPC exposure](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).
- Performance and health advisors returned no lints at audit time.
- No database changes have been applied by this audit.
- Still pending: detailed grants and policies, full function/trigger definitions, Auth provider/configuration settings, Storage bucket policies, Realtime publication configuration, Data API exposure settings, and review of `public.rls_auto_enable()`.

## Current blockers / readiness
1. Connector-access blockers are closed.
2. FastAPI backend is absent from the audited tree and must be established under the approved modular-monolith architecture.
3. Supabase `public` schema and migration history are empty, but this is not proof that all project schemas/services are empty. Complete the remaining Supabase baseline audit before designing migrations.
4. Existing demo/local-state paths must be replaced phase-by-phase by typed FastAPI API clients.
5. Do not apply migrations or invent schema until the Master PRD and Technical Blueprint domain model is reconciled with the full live Supabase inventory.

This report covers repository metadata/tree and selected files plus a partial live Supabase audit. It is not a complete source review, security assessment, or phase-completion claim.
