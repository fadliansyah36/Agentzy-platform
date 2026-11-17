# AGENTZY — REPOSITORY & SUPABASE AUDIT

Date: 18 November 2026  
Repository: `fadliansyah36/Agentzy-platform`  
Branch: `main`  
Supabase ref: `cwhjdnkotuhueeudpgeu`

## Executive result
Existing portal UI is present and must be preserved. The repository is a Next.js frontend-first codebase with no Python/FastAPI backend and no Agentzy Supabase migration source yet. Continue backend-first: add backend and database infrastructure alongside the existing frontend; do not rename or rebuild the existing portal folders.

## Repository structure verified on main
- Root contains `.env.example`, `app/`, `apps/`, `components/`, `hooks/`, `lib/`, `public/`, `src/`, `docs/`, `package.json`, `bun.lock`, and the governance files.
- Existing portal directories are `apps/admin/`, `apps/ai-workforce/`, and `apps/corporate/`.
- Root `app/` is the Next.js App Router and includes wrappers/routes for landing, corporate, workforce, admin and AI workforce. Thus the absence of `apps/landing/` or `apps/workforce/` does not mean those route surfaces are wholly absent; their current implementation is located in the root App Router and should be mapped before any move.
- Missing infrastructure folders confirmed by prior recursive tree audit: `apps/api/`, `supabase/`, `packages/api-client/`, `packages/api-contracts/`, `packages/design-tokens/`, `workers/`, `services/`, and `infrastructure/`. Do not create alternate copies of existing portal code.
- Root dependency manifest is `package.json`; canonical JS lockfile is `bun.lock` (274,134 bytes; blob SHA `635cf4455bc8f37bafd73f4c6e82f77dd492da07`). No `pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock` was found at repository root.
- Manifest declares Next.js `^15.4.9`, React `^19.2.1`, TypeScript `5.9.3`, Tailwind `4.1.11`, and `eslint-config-next` `16.0.8`. The Next/ESLint-config major mismatch is an inventory finding; do not upgrade dependencies without a compatibility and lockfile review.
- Full transitive license reconciliation is not yet complete. The Bun lockfile pins dependency resolutions but does not itself constitute a complete license report. Generate an auditable package-name/version/license/SBOM inventory from the resolved dependency graph before closing P00-AC-03.
- `.env.example` is the environment-name inventory starting point. Secret values must never be copied into repository docs. Full source-wide env reference inventory remains open.

## Existing code observations
- Admin service returns `INITIAL_*` collections; admin hook initializes authenticated state locally.
- Corporate hook initializes tenant and domain collections locally; authentication starts as true.
- AI Workforce hook initializes workers/providers/skills/tools/memory/workflows/runs/credits from constants.
- AI Workforce service is primarily formatting/artifact helper logic, not FastAPI API client integration.
- `app/api/ai-workforce/generate-content/route.ts` invokes Google GenAI from a Next.js handler, hardcodes model ID and accepts tenantName from request body. Move invocation to FastAPI AI Gateway and resolve tenant from authenticated membership.
- Maps handlers exist in Next.js under `app/api/maps/` and `app/api/config/maps/`; consolidate provider execution/configuration behind backend contracts. The config handler's potential server-key exposure remains a security remediation item.
- Existing UI baseline: preserve existing screens, CSS, fonts, components, buttons and colors. Missing components must follow the existing design tokens.

## Corrected connector bindings and live Supabase audit
- GitHub binding: `More Ai` / account `fadliansyah36`, link `link_6af361418a4481919cc84f9f7e0d522b`; repository permissions observed: pull, push and admin.
- Supabase binding: `Agentzy DB`, project ref `cwhjdnkotuhueeudpgeu`, link `link_6afc797a7c44819192023bb809b8cae1`.
- Project status: `ACTIVE_HEALTHY`; region `ap-northeast-1`; PostgreSQL `17.12.0.000`.
- Application-owned `public` relations: none observed. Supabase project migration history: empty. Supabase-managed schemas `auth`, `storage`, `realtime`, and `vault` are platform-managed and must not be treated as Agentzy schema.
- Installed extensions observed: `vector 0.8.2`, `pgcrypto 1.3`, `pg_stat_statements 1.11`, `supabase_vault 0.3.2`, and `uuid-ossp 1.1`. PostGIS is available but not installed.
- No `pg_policies` rows observed for `public` or `storage`; no Storage buckets/objects; no Realtime publication tables/subscriptions observed in the previous baseline.
- Event trigger `ensure_rls` is enabled for CREATE TABLE / CREATE TABLE AS / SELECT INTO and owned by postgres. It is attached to `public.rls_auto_enable()`.
- Current function catalog confirms `public.rls_auto_enable()` is `SECURITY DEFINER`, owned by postgres, with EXECUTE ACL for PUBLIC, postgres, anon, authenticated and service_role. Security Advisor reports two WARN findings: anon and authenticated can execute it via RPC. It is an event-trigger function that enables RLS on new public tables. Do not invoke it manually. Do not switch it to SECURITY INVOKER or move/drop it without a dependency review.
- **Disposition proposal for review:** preserve the event-trigger function and `ensure_rls`; remove only unnecessary API execution grants for PUBLIC/anon/authenticated while retaining the event-trigger association and owner execution. PostgreSQL event-trigger invocation is not an ordinary user RPC call, but this must be verified against the live trigger/function ownership and a controlled non-production reproduction before changing production ACL. No ACL change has been made. Phase 00 remains open pending approved remediation and post-change Advisor evidence.
- Performance and health advisors returned no lints at the recorded audit.
- Do not modify platform-managed grants or policies in `storage`/`realtime` as Agentzy application policy.
- Auth provider/security configuration, Data API exposed schemas, full role/database ACL and default privileges, Storage service-level configuration, and all-schema trigger/function dependencies remain unverified because the current connected project tools did not return authoritative dashboard configuration. Project metadata is available; do not infer these settings from SQL catalogs.
- The connector returned project metadata successfully, but no supported response for the requested Auth/Data API dashboard settings. Required evidence: export/screenshots of Auth provider, URL/redirect allowlist, password/MFA/SMTP/security controls and Data API exposed schemas / grants from the Supabase Dashboard or a supported settings endpoint.
- No Supabase schema, data, policy, function, grant, project setting or migration has been modified.

## Phase 00 readiness
1. Connector access blockers are closed.
2. Backend and migration source folders are implementation gaps; create them alongside existing frontend during the applicable implementation phase.
3. Auth/Data API configuration and full dependency/license inventory remain audit gaps.
4. `rls_auto_enable()` needs reviewed ACL disposition; no speculative production change.
5. Migration strategy and M000–M220 reconciliation remain incomplete.
6. Phase 00 remains IN PROGRESS. No staging or real-world/UAT testing was performed.

See `docs/phase-00/BASELINE_EVIDENCE_AND_ACCEPTANCE.md` for the detailed acceptance matrix and evidence limitations.

## Frontend structure errata

The authoritative frontend folder mapping is recorded in [`docs/phase-00/FRONTEND_STRUCTURE_ALIGNMENT.md`](phase-00/FRONTEND_STRUCTURE_ALIGNMENT.md). It documents the existing root `app/` route surfaces and `apps/admin/`, `apps/corporate/`, `apps/ai-workforce/` feature modules. Backend/API and platform target paths remain unchanged.
