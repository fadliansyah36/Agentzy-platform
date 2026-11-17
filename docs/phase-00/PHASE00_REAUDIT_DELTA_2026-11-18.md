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

## 8. Execution re-audit — 18 November 2026 (connector-confirmed)

This section supersedes earlier tree-count snapshots in this file where they differ. It does not close Phase 00 or authorize schema changes.

### Repository head and complete recursive tree

- main resolves to commit 71bc1920afdec076f4818dc092a9fcdd4e417a46 (commit message: docs(backlog): record phase 00 license inventory outcomes).
- Recursive Git tree response reports truncated=false.
- Tree contains 1,302 entries: 101 directory entries and 1,201 tracked files. Earlier 291-entry snapshots are stale and must not be reused as the current inventory.
- Current path distribution: app/ 14 files, apps/ 90, components/ 17, hooks/ 1, lib/ 5, src/ 6, public/ 28, and docs/ 1,017. The docs count includes 949 .txt files in the retained upstream license-evidence bundle; this explains most of the increase and is not evidence of additional application code.
- Infrastructure target directories remain absent: apps/api/, supabase/, packages/api-client/, packages/api-contracts/, packages/design-tokens/, services/, workers/, and infrastructure/. Existing portal paths remain authoritative; do not duplicate them.

### Fresh Supabase read-only recheck

- list_migrations returned an empty Agentzy migration list.
- public application relation count remains zero.
- Supabase-managed relation counts observed in auth, storage, realtime, and vault are platform-owned and must not be counted as Agentzy tables.
- Storage buckets: 0; Storage objects: 0; auth.users rows: 0.
- pg_policies returned no policies for public or storage.
- Publication supabase_realtime exists, but pg_publication_tables returned no tables attached to it. Do not describe this as absence of the publication itself.
- Installed extensions reconfirmed: vector 0.8.2, pgcrypto 1.3, pg_stat_statements 1.11, supabase_vault 0.3.2, and uuid-ossp 1.1.
- Settings observed: row_security=on, ssl=on, statement_timeout=120000ms, default_transaction_isolation=read committed.
- Performance Advisor returned no lints. Security Advisor still returns two WARN findings for public.rls_auto_enable().

### rls_auto_enable() exact read-only evidence

- SECURITY DEFINER, owner postgres, search_path=pg_catalog.
- ACL string observed: =X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres.
- Event trigger ensure_rls is enabled (O), fires on ddl_command_end for CREATE TABLE, CREATE TABLE AS, and SELECT INTO, and references rls_auto_enable().
- No ACL, function, trigger, schema, policy, grant, setting, or migration was modified. The Advisor finding and fail-open exception handling remain unresolved. Do not apply a production ACL change without authoritative privilege-semantics evidence and the approved validation path.

### Current acceptance disposition

| Criterion | Current status | Verified disposition |
|---|---|---|
| P00-AC-01 | PARTIAL | Governance sources exist; final sign-off not recorded. |
| P00-AC-02 | PARTIAL | Recursive tree refreshed; full source/route/environment/component ownership scan remains incomplete. |
| P00-AC-03 | PARTIAL | 1,037-coordinate SBOM and automated report exist; 26 LGPL/MPL, 5 manual-expression and 40 missing-license-file findings still require evidence-based disposition; asset dimensions/provenance and deployment env reconciliation remain open. |
| P00-AC-04 | PARTIAL | Proposed portal/domain ownership matrix exists; complete screen/action/API inventory and owner sign-off remain open. |
| P00-AC-05 | PARTIAL | Database catalogs rechecked; Auth provider/security settings, Data API exposed schemas, complete role/default-privilege interpretation and Storage service configuration remain unverified. |
| P00-AC-06 | OPEN | Two Security Advisor WARN findings remain; function ACL/fail-open behavior has not been remediated. |
| P00-AC-07 | COMPLETE | ADR register exists; ADR-003/004/008/010/011 remain open decisions for their relevant future phases. |
| P00-AC-08 | PARTIAL | M000–M220 batch map exists; M000 policy/sign-off and final reconciliation are not closed. |
| P00-AC-09 | OPEN | Phase 00 Definition of Done evidence is incomplete. |
| P00-AC-10 | OPEN | Phase 01 readiness and authorization are not approved. |

### Execution boundary

This re-audit was read-only against Supabase. No migration, DDL, ACL, RLS policy, function, trigger, project setting, seed, or application-data change was made. No staging, UAT, real-world test, load test, security acceptance, or production deployment was run. Phase 01 has not started.