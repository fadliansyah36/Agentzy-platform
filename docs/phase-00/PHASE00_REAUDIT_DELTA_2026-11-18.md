# Phase 00 Re-audit Delta — 18 November 2026

Repository: `fadliansyah36/Agentzy-platform`
Branch: `main`
Observed HEAD: `cc15ff671dfbbe9d4bfdf068bc8a7d169ea53a9e`
Recursive tree: 291 entries; `truncated=false`.
Supabase project: `Agentzy-db` / `cwhjdnkotuhueeudpgeu`
Status: **Phase 00 IN PROGRESS — not signed off.**

## 1. Corrected connector state

- GitHub connector `More Ai` is bound to `fadliansyah36`; repository permission response confirms `pull=true`, `push=true`, `admin=true`.
- Supabase connector `Agentzy DB` resolves the canonical project ref `cwhjdnkotuhueeudpgeu`.
- The previous backlog statement that GitHub was pull-only and Supabase was not connected is stale. The blockers BLK-001 and BLK-002 are closed by current connector evidence; do not repeat the earlier access state as current.

## 2. Current repository / platform baseline

- Existing frontend route and portal directories remain present. The existing UI remains the baseline; no portal redesign or folder relocation is authorized.
- The current recursive tree still has no `apps/api/`, `supabase/`, `packages/api-client/`, `packages/api-contracts/`, or `packages/design-tokens/`.
- Root `package.json` identifies Next.js `^15.4.9`, React `^19.2.1`, TypeScript `5.9.3`, Tailwind `4.1.11`, and `eslint-config-next 16.0.8`. Compatibility review remains open; no dependency changes are authorized by this audit.
- Root `.env.example` declares `GEMINI_API_KEY`, `GOOGLE_MAPS_API_KEY`, and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Prior targeted review also found `DISABLE_HMR` in `next.config.ts`. This is not a complete source-wide scan and does not reconcile hosting-provider settings.
- `vercel.json` is not present at repository root. This does not establish the absence of Vercel project dashboard settings, build configuration, or environment variables.

## 3. Fresh Supabase read-only evidence

- Project is `ACTIVE_HEALTHY`, PostgreSQL 17.12.0.000, region `ap-northeast-1`.
- `public` application table inventory is empty.
- Supabase project migration history is empty.
- Installed extensions include `pg_stat_statements 1.11`, `pgcrypto 1.3`, `supabase_vault 0.3.2`, `uuid-ossp 1.1`, and `vector 0.8.2`.
- Security Advisor still reports two WARN findings for `public.rls_auto_enable()`: anon and authenticated can execute a SECURITY DEFINER function through RPC. Remediation reference: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable and https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

### Function and event-trigger semantics

Read-only catalog inspection on 2026-11-18 confirms:

- Function: `public.rls_auto_enable()`
- Owner: `postgres`
- Security: `SECURITY DEFINER`
- Function search_path: `pg_catalog`
- EXECUTE roles observed: `anon`, `authenticated`, `postgres`, `service_role` (PUBLIC inheritance also requires explicit ACL interpretation).
- Event trigger: `ensure_rls`
- Event: `ddl_command_end`
- Enabled: `O` (enabled)
- Tags: `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO`
- The function scopes the action to `public` and attempts `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Its inner exception handler catches `WHEN OTHERS` and only emits a log message. Consequently, a failure to enable RLS may be swallowed while the DDL operation completes. This is a material control gap to resolve, not merely an Advisor cosmetic warning.

**Disposition:** no ACL/function/event-trigger modification was made. Do not remove grants or alter the function based solely on the Advisor recommendation: confirm event-trigger invocation privileges and ownership semantics against authoritative PostgreSQL/Supabase documentation and a controlled non-production reproduction. The user has prohibited staging/real-world testing, so that reproduction is not currently authorized. Preserve the current database state until a safe, evidence-backed decision is approved. Do not manually invoke the event-trigger function.

## 4. Phase 00 acceptance status

| Criterion | Current status | Remaining evidence / action |
|---|---|---|
| P00-AC-01 Governance authority | PARTIAL | PRD/Blueprint/AGENTS alignment exists; Phase 00 sign-off remains open. |
| P00-AC-02 Repository baseline | PARTIAL | Tree snapshot current; source-wide env scan and full route/component mapping remain open. |
| P00-AC-03 Dependencies, licenses, env, assets, design tokens | PARTIAL | 1,037 package coordinates identified; license/NOTICE reconciliation open; deployment env matching open; 31 raster assets inventoried but pixel dimensions/provenance/complete use mapping open. |
| P00-AC-04 Domain/API ownership | PARTIAL | Proposed ownership matrix exists; complete existing route/handler inventory and owner sign-off open. |
| P00-AC-05 Supabase baseline | PARTIAL | Public tables, migration history, extensions, function and event trigger reviewed; authoritative Auth and Data API settings and complete ACL/config evidence open. |
| P00-AC-06 Security Advisor disposition | OPEN | Two WARN findings remain; safe ACL/function disposition not approved or applied. |
| P00-AC-07 ADR register | COMPLETE (proposed defaults) | Any implementation decision changing baseline still requires ADR approval. |
| P00-AC-08 Migration strategy | PARTIAL | Strategy exists; M000–M220 reconciliation and migration ledger not complete. |
| P00-AC-09 Phase 00 Definition of Done | OPEN | Required evidence and task closure not complete. |
| P00-AC-10 Phase 01 readiness | OPEN | Phase 00 must close and be signed off first. |

## 5. Explicitly not performed

- No Supabase schema, data, ACL, policy, function, trigger, project setting, or migration was changed.
- No staging, UAT, real-world testing, load testing, security acceptance, or deployment was performed.
- No source-wide environment scan is claimed complete.
- No package license is inferred from package name.
- No asset dimensions or provenance are claimed verified without binary inspection.
- No Phase 00 completion or Phase 01 start is claimed.

## 6. Ordered work still required

1. Reconcile authoritative license, LICENSE, NOTICE, attribution, and transitive obligations for all 1,037 resolved package coordinates; record exceptions and update the SBOM only with source-backed declarations.
2. Scan every tracked source/configuration file for environment reads and declarations; reconcile names and required values (never secret values) with Vercel and any other deployment configuration.
3. Obtain binary bytes for all 31 raster assets; record decoded dimensions, file format, provenance/rights, complete source usage, production purpose, and duplicate disposition.
4. Obtain authoritative Supabase Dashboard/API evidence for Auth providers, URL/redirect allowlists, password/MFA/SMTP/security controls, Data API exposed schemas, and related grants.
5. Complete PostgreSQL event-trigger privilege analysis for `rls_auto_enable()`; document a defensible ACL and exception-handling decision. Do not mutate production ACL without adequate evidence and approval.
6. Close all Phase 00 acceptance criteria, ADR/domain ownership decisions, and migration batch reconciliation; then report the next phase (Phase 01) only after sign-off.

## 7. Engineering and delivery constraint

Continue direct work on `main`. Preserve the existing frontend and design tokens. The backend target remains a Python FastAPI modular monolith; Supabase PostgreSQL remains the sole business source of truth. Minimum engineering checks required by `AGENTS.md` remain mandatory. Full real-world testing, staging, UAT, load/security acceptance, and release gate remain Phase 22 activities.
