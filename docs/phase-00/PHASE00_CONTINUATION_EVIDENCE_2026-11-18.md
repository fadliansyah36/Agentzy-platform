# Phase 00 Continuation Evidence — 18 November 2026

Repository: `fadliansyah36/Agentzy-platform`  
Branch: `main`  
Latest inspected repository commit before this evidence update: `8fe6141610fab3a01026a4966f5090dab4dbc016`  
Supabase: `Agentzy-db`, ref `cwhjdnkotuhueeudpgeu`  
Status: **Phase 00 remains IN PROGRESS; no sign-off.**

## 1. Resolved dependency inventory / SBOM

Source evidence:
- Root `package.json`, package `ai-studio-applet@0.1.0`.
- Canonical lockfile `bun.lock`, Git blob SHA `635cf4455bc8f37bafd73f4c6e82f77dd492da07`, 274,134 bytes.
- Bun lock format `lockfileVersion=2`, `configVersion=1`.
- Lockfile contains 1,130 package locator entries; deduplication by exact package name + version produces **1,037 unique resolved npm package coordinates**.
- CycloneDX 1.6 SBOM: `docs/phase-00/sbom/bun-lock.cdx.json`.

**Important qualification:** this is a resolved dependency inventory, not a completed license reconciliation. The Bun lockfile contains package identities, exact versions, dependency metadata and integrity values, but no license declarations. SBOM components therefore use `NOASSERTION` as unresolved metadata. A proportionate automated Dependency & License Risk Review is now implemented in `docs/phase-00/DEPENDENCY_LICENSE_RISK_REVIEW.md`, `scripts/audit-dependency-licenses.mjs`, and `.github/workflows/dependency-license-review.yml`. It scans direct, transitive and development dependencies, reconciles exact package/version coordinates, flags unknown/copy-left/manual-review signals, and records LICENSE/NOTICE/COPYING evidence. **The workflow has not yet been executed; package-level results and keep/replace/exception decisions remain open.** Do not infer licenses from package names.

Manifest compatibility issue remains: `next ^15.4.9` and `eslint-config-next 16.0.8` are different major lines; compatibility review is open. No dependency versions were changed.

## 2. Environment-variable inventory and exposure review

Verified `.env.example` declares exactly:
- `GEMINI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Direct source references confirmed in reviewed files:
- `app/api/ai-workforce/generate-content/route.ts`: server-side `GEMINI_API_KEY`; the handler directly initializes Google GenAI and calls a hard-coded model from Next.js. This remains an architectural migration item for the FastAPI AI Gateway.
- `app/api/maps/reverse-geocode/route.ts`: server-side `GOOGLE_MAPS_API_KEY`, with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` fallback.
- `app/api/config/maps/route.ts`: browser-facing key configuration route. It previously fell back from the public key to the server-only `GOOGLE_MAPS_API_KEY`, which could disclose a secret to browser callers.

**Code remediation committed:** `app/api/config/maps/route.ts` now returns only `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and never falls back to `GOOGLE_MAPS_API_KEY`. Commit: `00592945136770307b17d4e87b5db1ad112748c3`. No secret values are included in this report.

Additional configuration observations:
- `next.config.ts` references `DISABLE_HMR` for development-only HMR behavior; it is not listed in `.env.example`.
- `firebase-applet-config.json` contains Firebase client configuration, including a browser-visible API key and OAuth client identifier. These are client configuration values, not server secrets, but Firebase API key restrictions, authorized domains, and enabled APIs must be verified in Firebase Console.
- GitHub code-search requests for broad environment terms returned no results and are not reliable evidence of absence. The direct file review above is targeted, not a complete source-wide scan.

**Open:** complete a source-wide scan of every tracked source/config file and reconcile all discovered names with deployment environment configuration. Hosting/provider secret settings were not accessible from the GitHub connector. Never record values in the repository evidence.

## 3. Asset metadata and usage inventory

Detailed file list: `docs/phase-00/ASSET_METADATA_INVENTORY_2026-11-18.md`.

Verified from recursive Git tree:
- 31 raster image files by extension.
- Total size: 29,037,921 bytes (27.69 MiB).
- Six exact duplicate blob groups: six image pairs under `public/images/` and `src/assets/images/`; each pair has identical Git blob SHA and byte size.
- Every asset row records repository path, byte size and Git blob SHA.
- Targeted source references were confirmed for landing illustrations, Agentzy logo, workforce banners/field imagery, favicon and PWA icons.
- 13 files are in `public/assets/aistudio/`; their provenance and production suitability need review.

**Open:** pixel dimensions and decoded image metadata have not been measured because the current GitHub connector tree response provides only blob metadata and the available fetch operation does not provide binary image bytes. Complete usage mapping for every asset, image rights/provenance and duplicate disposition also remain open. Do not delete duplicate copies until import/build references are fully traced.

## 4. Supabase Auth and Data API configuration evidence

Fresh project metadata confirms:
- Project `Agentzy-db`, ref `cwhjdnkotuhueeudpgeu`.
- Status `ACTIVE_HEALTHY`.
- PostgreSQL 17.12.0.000; region `ap-northeast-1`.

The available Supabase connector exposes project metadata, database SQL/catalog inspection, migrations, tables, extensions and advisors. It does **not** expose authoritative Auth provider/security configuration or Data API exposed-schema configuration in the current tool surface.

Therefore the following are **not verified** and must not be assumed:
- Auth providers and provider enablement.
- Site URL and redirect allowlists.
- Password policy, MFA enforcement, session lifetime/revocation, rate limits and CAPTCHA/bot settings.
- SMTP/email sender configuration.
- Data API exposed schemas and API role exposure settings.

Required evidence source: authorized Supabase Dashboard configuration views or a supported Management API response for the exact project. Dashboard sections to capture include Authentication provider/URL/security settings and Integrations → Data API exposed schemas. Do not place secret values or SMTP credentials in evidence.

## 5. Security disposition — `public.rls_auto_enable()`

Fresh read-only evidence:
- Security Advisor reports two WARN findings: `anon_security_definer_function_executable` and `authenticated_security_definer_function_executable`.
- Function: `public.rls_auto_enable()`; `SECURITY DEFINER`; owner `postgres`; fixed `search_path = pg_catalog`.
- ACL observed: EXECUTE for PUBLIC, postgres, anon, authenticated and service_role.
- Event trigger `ensure_rls` is enabled (`evtenabled=O`), event `ddl_command_end`, tags `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO`, function `rls_auto_enable()`, event-trigger owner `postgres`.
- Function inspects DDL commands and enables RLS for newly created table/partitioned-table objects in schema `public`.
- Function catches `WHEN OTHERS` during ALTER TABLE and only raises a log message; it does not fail the originating DDL. This is a fail-open risk if enabling RLS fails.
- The function is an event-trigger function, not an ordinary application RPC. Advisor still flags its broad EXECUTE ACL as externally callable through the exposed schema.

**Disposition:**
1. Preserve the event trigger and function for now; do not manually invoke the event-trigger function.
2. Do not change ACLs in this production project during this audit. The user has explicitly disallowed staging/real-world testing, and no isolated disposable database was provisioned to validate privilege behavior before revocation.
3. The intended hardening direction is to remove unnecessary API-role execution (PUBLIC/anon/authenticated and likely service_role if no operational use), retaining only the privilege required for the event trigger to execute. Before applying, verify PostgreSQL's event-trigger function privilege semantics against the exact server version and a disposable non-production reproduction, or obtain equivalent authoritative evidence. The current no-staging constraint prevents that validation now.
4. Independently address the fail-open exception behavior in a reviewed migration/implementation decision; an RLS enforcement mechanism should not silently permit a table-creation operation to complete without its expected RLS state.
5. After an approved change, verify event trigger behavior and rerun Supabase Security Advisor. No ACL, function, trigger or schema changes were made in this audit.

## 6. Current Phase 00 disposition

| Acceptance area | Status | Evidence / remaining work |
|---|---|---|
| Repository tree and route ownership | PARTIAL | Verified inventory and folder alignment; full source ownership review remains |
| Dependency inventory | PARTIAL | 1,037-coordinate CycloneDX SBOM committed |
| License / NOTICE reconciliation | OPEN | Lockfile lacks license declarations; package-by-package review required |
| Environment names and references | PARTIAL | Key names and selected usages confirmed; complete tracked-source scan and deployment reconciliation pending |
| Asset byte metadata / hashes / duplicates | PARTIAL | 31 files, bytes, Git blob SHA, six duplicate groups |
| Asset dimensions / provenance / full usage | OPEN | Binary inspection and complete usage mapping pending |
| Supabase live database baseline | PARTIAL | Project metadata, schema/migration/extension/RLS/function/trigger/advisor evidence; Auth/Data API settings pending |
| `rls_auto_enable()` security disposition | PARTIAL / NO CHANGE | Risk analyzed; no ACL change until safe privilege validation |
| Migration batch M000–M220 | PARTIAL | Reconciliation document exists; Phase 00 sign-off remains open |
| Phase 00 acceptance and Phase 01 readiness | OPEN | Do not start Phase 01 until all applicable acceptance criteria have evidence and sign-off |

## 7. Explicit non-actions and constraints

- No staging environment was created or used.
- No real-world/UAT test was run.
- No Supabase schema, migration, grant, RLS policy, function, trigger, Auth setting or Data API setting was changed.
- No dependency version was changed.
- No asset was deleted or moved.
- No backend FastAPI or new frontend portal structure was created as part of this evidence pass.
- The Maps config secret fallback was removed as a targeted source security fix.


## 8. Dependency/license review implementation delta — 2026-11-18

Committed automated workflow and normalizer. The workflow is designed to fail if the installed dependency tree does not exactly reconcile with all 1,037 unique SBOM package coordinates. It uploads collected upstream license-file evidence and commits generated JSON/Markdown review reports to `main` when changed. No dependency versions or application code were changed. The workflow has not been run in this session; this task remains PARTIAL pending the actual report and review decisions.


## 9. Post-foundation live-state reconciliation — 18 November 2026

This section records a later live-state observation after the identity/tenant foundation migrations were applied. It supersedes the earlier statements in §§4–7 only where the later implementation state differs; the original audit snapshot remains preserved as historical evidence.

### Canonical Supabase state

- Project metadata rechecked: `Agentzy-db`, ref `cwhjdnkotuhueeudpgeu`, `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`.
- Applied migration history now contains:
  - `20261117175948` — `phase_01_platform_core_identity_tenant`
  - `20261117181011` — `phase_01_system_roles_permissions_auth_profile`
  - `20261117182410` — `phase_01_profile_email_projection`
- Read-only catalog query confirms 9 public application tables and RLS enabled on all 9.
- Read-only data/catalog counts: 15 system role templates, 45 permission keys, 134 role-permission grants, 0 Auth users, and 0 Storage buckets.
- No sample tenant, user, wallet, transaction, or other business records were seeded.

### Current advisor findings

- Security Advisor still reports two WARN findings for `public.rls_auto_enable()`: execution by `anon` and `authenticated` on a SECURITY DEFINER function. No ACL, function, or event-trigger change was applied.
- Performance Advisor currently reports five INFO findings for foreign keys without covering indexes and seven INFO findings for indexes not yet used. These are observations, not evidence that indexes should be removed; review the FK access paths and workload before changing indexes.
- The fail-open exception handling and event-trigger privilege semantics remain unresolved. Do not revoke grants or alter the event trigger without an evidence-backed, reviewed remediation.

### Implementation and release boundary

- The repository contains the FastAPI modular-monolith foundation, typed frontend API client, identity/tenant/RBAC endpoints, and existing portal wiring documented in the implementation backlog.
- FastAPI has not been deployed to a reachable runtime; backend private secrets and frontend production environment values are not configured through this evidence.
- Supabase Auth production URL/redirect/SMTP and provider/security settings remain unverified because the current connector surface does not expose authoritative configuration evidence.
- No first administrator has been invited; `auth.users` remains empty. Bootstrap and TOTP enrollment have not been executed.
- Static build/type/lint and Python compile/import checks have not been run in this continuation. No staging, UAT, real-world, load, security-acceptance, or production-release test was run.

### Phase status

Phase 00 remains **IN PROGRESS / NOT SIGNED OFF**. The later identity/tenant migrations are recorded as already-applied implementation state; they do not waive the Phase 00 exit gate or authorize additional Phase 01 scope ahead of sign-off. Phase 01 remains **IN PROGRESS / NOT COMPLETE** in the implementation tracker. Remaining Phase 00 acceptance items and the unresolved production security warning must be closed through the documented governance process.


## 10. Phase 01 pre-implementation readiness audit — 18 November 2026

This is a read-only readiness review of the already committed Phase 01 foundation. It does not mark Phase 01 as started again, does not authorize additional Phase 01 implementation before the Phase 00 gate, and does not modify code or remote database state.

### Repository/API inventory on current main

Current inspected branch HEAD before this evidence update: `da698a25819c877ccef49bc9a29579d225286854`. Recursive tree: 1,350 entries, `truncated=false`.

Phase 01 implementation files currently present:
- `apps/api/app/core/security.py`, `core/config.py`, `db/session.py`, `main.py`.
- `apps/api/app/api/v1/routes/identity.py`, `tenants.py`, `management.py`, `bootstrap.py`.
- `apps/api/app/schemas/identity.py`.
- `apps/web/lib/api-client.ts`, `lib/auth/useAgentzyAuth.ts`, `lib/supabase/client.ts`.
- Three existing migrations listed in §9.

No dedicated route modules yet exist for users/profile mutation, branches, departments, memberships lifecycle, access policies, permissions, audit-log queries, or security-event queries. There is no committed Phase 01 test/CI workflow in `.github/workflows/`; the only workflow found is the dependency/license review.

### Confirmed implementation already present

- FastAPI verifies Supabase JWT signatures using configured legacy HS256 or the project's JWKS (ES256/RS256 allowlist), issuer, audience and expiry.
- Authenticated SQLAlchemy sessions set transaction-local JWT claims and execute user-scoped reads under PostgreSQL role `authenticated`.
- `GET /api/v1/me`, `GET /api/v1/tenants`, organization list/create, tenant directory/create/update/archive, membership invite/list, role catalogue, one-time platform-admin bootstrap are present in the inspected route files.
- Browser Supabase Auth hook supports password sign-in, Google OAuth sign-in, sign-out, session restoration/auth-state subscription, and MFA assurance/enrollment flows referenced by the existing portal.
- Admin tenant operations and Corporate organization/member flows have selected FastAPI bindings. This is not evidence that every portal screen/action is integrated.

### Code-level gaps requiring resolution before Phase 01 can meet its DoD

1. **Auth lifecycle incomplete:** no API/UI flow was found for sign-up/registration, invite acceptance callback, email verification callback/resend, password recovery, password update, or profile update. Existing Auth configuration intentionally disables public signup and enables email confirmation; the registration contract must remain invitation-controlled unless an approved product decision changes that policy.
2. **Session revocation incomplete:** API JWT verification checks cryptographic signature/issuer/audience/expiry but does not validate the JWT `session_id` against `auth.sessions`. Sign-out exists in the browser, but immediate server-side rejection of revoked sessions is not implemented.
3. **Tenant/organization lifecycle partial:** tenant create/update/archive and organization list/create exist; no tenant settings API, organization update/archive, dedicated branch/department endpoints, or server-selected active tenant context was found. Branch and department currently exist only as organization type values.
4. **Membership lifecycle partial:** invitation and list exist; acceptance, update, suspension, revocation, scoped membership assignment and role reassignment endpoints are absent. The current invitation handler inserts membership status `active` before an acceptance transition exists.
5. **Authorization incomplete:** current permission checks are primarily permission-key/tenant-membership checks. Organization/branch/department scope is not consistently applied; there is no reusable policy layer for ABAC/object-level access across all resources. Some platform permission helpers do not explicitly constrain the granting role to a platform-scoped role.
6. **Database relationship integrity incomplete:** live constraints do not enforce that an organization parent belongs to the same tenant, a membership's organization belongs to its tenant, or an assigned role's tenant matches the membership's tenant. These need additive composite-key/FK or equivalent constraints and a recovery plan before use.
7. **Privilege boundary requires hardening:** privileged routes check authorization using a user-scoped authenticated session, then perform writes/reads through a separate database engine connection that uses the configured database role and bypasses ordinary RLS when that role owns/bypasses RLS. The boundary is documented in code flow but requires a narrowly scoped DB role/explicit repository privilege contract and audit.
8. **Least-privilege grants not met:** live `information_schema.role_table_grants` reports `anon` and `authenticated` each hold DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE and UPDATE on all nine Phase 01 tables. Live `pg_default_acl` shows global `public` table and sequence defaults granting all privileges to `anon`, `authenticated` and `service_role` for objects created by `postgres` (and a parallel default for `supabase_admin`). RLS is enabled on 9/9 tables, with policies currently limited to authenticated SELECT; RLS does not replace least-privilege SQL grants. Do not change production ACL/default privileges until the separate Phase 00 `rls_auto_enable()` event-trigger review is approved and its privilege semantics are resolved.
9. **Audit/observability partial:** selected tenant/organization/invitation actions insert audit rows; login/session events, denied-access security events, profile changes, membership/role changes, and audit/security read APIs are absent. Request ID exists, but separate trace/correlation propagation, trusted-proxy IP handling, and comprehensive structured event taxonomy are incomplete.
10. **API contract incomplete:** the current API has no reusable cursor-pagination contract for the listed collections, no centralized ABAC/object policy dependencies, and no complete `/auth`, `/users`, `/branches`, `/departments`, `/memberships`, `/permissions`, `/access`, `/audit-logs`, or `/security-events` route groups.
11. **Frontend integration partial:** the shared typed API client and auth hook exist, but the inspected repository inventory and previous portal source audit do not support a claim that every screen/action in Admin, Corporate, AI Workforce and Human Workforce is connected to real API data. Existing unimplemented domains must remain explicit empty/unavailable states, not be presented as integrated.
12. **Bootstrap and deployment incomplete:** no API runtime URL, backend secret configuration, frontend production environment, production Supabase Auth redirect/SMTP evidence, first-admin invitation, or TOTP enrollment has been supplied/verified.
13. **Engineering evidence absent:** no build/lint/type-check, Python compile/import, migration consistency, OpenAPI/schema validation, static security, or focused deterministic checks have been executed in this continuation. A local Git checkout could not be obtained in the current execution environment, so no local checks are claimed.

### Live Supabase security evidence

Read-only queries against canonical project `cwhjdnkotuhueeudpgeu` confirm:
- 9/9 public Phase 01 tables have RLS enabled; none currently has FORCE ROW LEVEL SECURITY.
- 9 tables have the current SELECT policy set; no INSERT/UPDATE/DELETE policies are present for the application roles.
- Global public-schema default table privileges grant all table operations to `anon`, `authenticated`, and `service_role` for objects created by `postgres` and `supabase_admin`.
- `handle_new_auth_user()` is SECURITY DEFINER with `search_path=public`; its current ACL is restricted to `postgres` and `service_role`, and the Auth trigger is AFTER INSERT OR UPDATE on `auth.users`.
- `rls_auto_enable()` remains SECURITY DEFINER with a fixed `pg_catalog` search path and EXECUTE grants to PUBLIC, `anon`, `authenticated`, and `service_role`. Security Advisor still reports the two external WARN findings. No grants, functions, triggers, RLS policies or schema objects were changed during this review.

### Phase 01 status and gate

Phase 01 is **PARTIAL / BLOCKED**, not DONE. The three migrations and identity/tenant foundation are existing committed/applied work; the gaps above prevent acceptance of the Phase 01 exit criteria.

The Phase 00 backlog execution guard remains authoritative: Phase 01 tasks cannot be marked IN PROGRESS until Phase 00 mandatory gates are signed off. P00-AC-06 (Security Advisor WARN/event-trigger fail-open behavior), P00-AC-05 (authoritative Auth/Data API/Storage configuration and grants/default privileges), P00-AC-03 (remaining license/asset dispositions), P00-AC-02/P00-AC-04 (complete source and screen/action ownership inventory), P00-AC-08 (M000–M220 reconciliation), P00-AC-09 (DoD evidence), and P00-AC-10 (Phase 01 readiness sign-off) remain open or partial.

No code, migration, grant, policy, function, trigger, Auth setting, deployment, or business data was changed by this review. No staging, UAT, real-world, load, security-acceptance, or production-release testing was run.


## 11. Phase 00 closure re-audit and readiness decision — 18 November 2026

A fresh re-audit was performed on `main` and the canonical Supabase project. Full gate-by-gate evidence and residual risks are in `docs/phase-00/PHASE00_CLOSURE_READINESS_REAUDIT_2026-11-18.md`.

### Repository and Supabase correction

- Audited pre-documentation HEAD: `4d3db7b36df411aefc5ad81aaa04e5892d99493c`; recursive tree: 1,350 entries, 1,233 files, 117 directories, `truncated=false`.
- The repository contains the existing frontend portals and the FastAPI backend; 11 page/layout route files, 3 Next.js API handlers, 89 portal feature source files, 3 portal service modules, 4 hooks and 20 tracked files under `apps/api/` were counted.
- Supabase `Agentzy-db` is `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`.
- Remote migration history has three Phase 01 entries matching the three source migrations. Live public schema contains nine Agentzy application tables, RLS enabled on all nine, 15 system roles, 45 permission keys and 134 role-permission links. Auth users and Storage buckets are both zero.
- These later verified values supersede older statements in this file and earlier audit documents that described zero public application tables or empty migration history. Historical snapshots are retained but must not be treated as current state.

### Security/configuration evidence

- `public.rls_auto_enable()` is SECURITY DEFINER, owned by postgres, fixed `pg_catalog` search_path, and callable by PUBLIC/anon/authenticated/service_role. Event trigger `ensure_rls` is enabled for CREATE TABLE, CREATE TABLE AS and SELECT INTO. The function catches `WHEN OTHERS` and only logs; RLS activation failure can therefore be swallowed. Security Advisor still returns two WARN findings.
- No production ACL/function/event-trigger modification was made. Fail-closed exception handling and narrow EXECUTE grants remain a candidate remediation requiring authoritative privilege semantics and controlled isolated reproduction.
- Current `anon` and `authenticated` table grants and global default privileges are broader than least privilege. RLS policies are SELECT-only; RLS being enabled does not itself satisfy least-privilege grants.
- Auth providers, live signup/confirmation/redirect/password/MFA/SMTP/session settings and hosted Data API exposed schemas could not be verified through the available connector. Repository `supabase/config.toml` values are local declarative configuration only. Storage has no buckets.

### Gate disposition

| Gate | Status |
|---|---|
| P00-AC-01 | PARTIAL |
| P00-AC-02 | PARTIAL — structure inventoried; screen/control/action-level inventory incomplete |
| P00-AC-03 | PARTIAL — package exceptions and all asset provenance/rights remain open |
| P00-AC-04 | PARTIAL — API ownership proposal exists; full action mapping and owner sign-off incomplete |
| P00-AC-05 | PARTIAL / BLOCKED — live Auth/Data API settings unverified; grants/default privileges not least-privilege |
| P00-AC-06 | BLOCKED — fail-open event-trigger function and two Security Advisor WARN findings unresolved |
| P00-AC-07 | COMPLETE (ADR register only) |
| P00-AC-08 | PARTIAL — M010 applied; M000 is audit-only; M020–M220 not applied and mapped to future phases |
| P00-AC-09 | PARTIAL — final DoD checklist drafted; formal acceptance pending |
| P00-AC-10 | BLOCKED / NOT APPROVED |

### Engineering checks and non-actions

The existing dependency/license GitHub Actions run `44138463292` is recorded as successful for exact package coordinate reconciliation. Build/lint/type-check, Python compile/import, migration consistency and OpenAPI checks were not executed in this re-audit; no passing result is claimed. No code, database schema, migration, data, ACL, policy, function, trigger, Auth setting, Storage setting or deployment was changed. No staging/UAT/real-world/load/security-acceptance/production-release test was run.

**Decision:** Phase 00 remains PARTIAL/BLOCKED. Phase 01 readiness has not been approved. Do not begin additional Phase 01 coding.
