# Agentzy Platform — Phase 00 Closure Re-audit & Phase 01 Readiness

**Audit date:** 18 November 2026  
**Repository:** `fadliansyah36/Agentzy-platform`  
**Branch:** `main`  
**Audited HEAD before this documentation commit:** `4d3db7b36df411aefc5ad81aaa04e5892d99493c`  
**Supabase project:** `Agentzy-db` / `cwhjdnkotuhueeudpgeu`  
**Overall disposition:** **PHASE 00 PARTIAL / BLOCKED — NOT CLOSED**  
**Phase 01 readiness:** **NOT APPROVED — do not start additional Phase 01 coding**

This re-audit supersedes conflicting earlier repository/Supabase snapshots only where this report contains later, directly verified evidence. It does not rewrite historical records or imply that a previously applied Phase 01 migration was authorized by Phase 00 closure.

## 1. Executive decision

The canonical GitHub and Supabase bindings are reachable and resolve to the requested resources. The latest pre-audit `main` HEAD was `4d3db7b36df411aefc5ad81aaa04e5892d99493c`. The Supabase project is `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`.

The audit confirms three Phase 01 migrations already exist in source and in remote migration history. The live `public` schema contains nine Agentzy application tables and RLS is enabled on all nine. This corrects older Phase 00 snapshots that described an empty Agentzy schema and empty migration history. The three applied migrations are existing implementation state; they do not close Phase 00 or authorize further Phase 01 implementation.

No production Supabase DDL, grants, policies, function, event trigger, Auth configuration, Storage configuration, data, or migration was changed in this audit. No application source code or UI was changed. No staging, UAT, real-world, load, security-acceptance, or production deployment test was performed.

## 2. Gate disposition

| Gate | Status | Evidence and current decision | Residual risk / closure owner |
|---|---|---|---|
| P00-AC-01 Governance | PARTIAL | `AGENTS.md`, PRD v2.0, Blueprint v1.0, backlog and ADR register are present and reviewed. Historical applied Phase 01 migrations are documented as existing state. | Final Phase 00 sign-off remains absent. Owner: Product Owner + Engineering Lead. |
| P00-AC-02 Screen/action inventory | PARTIAL | Latest recursive tree is complete (`truncated=false`); portal routes, service modules, hooks, feature modules and Next.js API handlers were counted. A screen-to-button/form/hook/action inventory is not yet complete. | Action-by-action inspection and evidence mapping remain. Owner: Frontend Lead + each portal domain owner. |
| P00-AC-03 License & asset provenance | PARTIAL / BLOCKED | 1,037 exact package coordinates reconcile; 966 attribution-check, 26 LGPL/MPL, 5 manual-expression and 40 missing-license-file findings; 988 license texts and two NOTICE files retained. Thirty-one raster assets have size/hash metadata and six exact duplicate groups. | The 71 flagged package records need source-backed dispositions; all asset provenance/rights and full usage are not established. Owner: Dependency Maintainer + Asset Owner + Legal/IP reviewer. |
| P00-AC-04 API ownership | PARTIAL | Existing FastAPI routers and Next.js handlers are mapped at domain level below. The typed API client and portal services exist. | Full control-level API/permission/database mapping and domain-owner approval remain. Owner: Backend Lead + Domain Owners. |
| P00-AC-05 Supabase configuration & least privilege | PARTIAL / BLOCKED | Live catalog, migrations, roles, grants, defaults, policies, extensions and Storage bucket inventory were queried. Auth provider/security settings and actual Data API exposed-schema settings are not available from the current connector evidence. | Broad table/default grants remain; live Auth/Data API/Storage dashboard settings and a least-privilege migration decision are not approved/applied. Owner: Supabase Admin + Security Lead. |
| P00-AC-06 RLS security remediation | BLOCKED | `ensure_rls` is enabled and invokes `public.rls_auto_enable()`; the function is SECURITY DEFINER and catches all exceptions while only logging. Advisor reports two WARN findings for anon/authenticated EXECUTE. | Fail-open behavior and safe ACL/trigger remediation remain unresolved. Owner: Database/Security Lead. |
| P00-AC-07 ADR register | COMPLETE (register only) | ADR register exists and aligns with the Blueprint. Future domain decisions remain open under their owning phases. | Any new baseline-changing decision still needs an ADR. Owner: Architecture Owner. |
| P00-AC-08 Migration reconciliation | PARTIAL | M000–M220 have been compared with source, remote migration history and live catalog. M010 has three applied migrations; other batches are not applied. | Full batch-by-batch design evidence for future batches remains phase-owned; M000 audit sign-off is not recorded. Owner: Database Lead + Domain Owners. |
| P00-AC-09 Definition of Done | PARTIAL | Final DoD checklist is specified in §8, aligned to AGENTS.md/PRD/Blueprint. | Formal acceptance of the checklist and task evidence is pending. Owner: Engineering Lead + Product Owner. |
| P00-AC-10 Phase 01 readiness | BLOCKED / NOT APPROVED | Readiness checklist is in §9. No explicit approval record exists. | Must remain blocked until every mandatory gate is closed and the Product Owner explicitly approves. Owner: Product Owner. |

**No gate is marked CLOSED by this report.** P00-AC-03, AC-05, AC-06, AC-02/04, AC-08 and AC-09 still contain material residual work. AC-10 is deliberately not approved.

## 3. P00-AC-06 — RLS security assessment and remediation decision

### 3.1 Live catalog evidence

Read-only catalog queries against project `cwhjdnkotuhueeudpgeu` returned:

| Item | Verified value |
|---|---|
| Function | `public.rls_auto_enable()` |
| Function owner | `postgres` |
| Security mode | `SECURITY DEFINER` |
| Function search_path | `pg_catalog` |
| ACL | `=X/postgres, postgres=X/postgres, anon=X/postgres, authenticated=X/postgres, service_role=X/postgres` |
| Event trigger | `ensure_rls` |
| Event | `ddl_command_end` |
| Enabled state | `O` (enabled) |
| Event tags | `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO` |
| Function scope | The function attempts to enable RLS only for objects in schema `public`. |
| Error handling | Inner `EXCEPTION WHEN OTHERS` catches the failure, writes `RAISE LOG`, and does not re-raise. |

The current function definition has a fixed `pg_catalog` search path, which is a positive hardening property. However, it is still a SECURITY DEFINER function owned by a role with BYPASSRLS. It is exposed in `public` and the ACL grants EXECUTE to PUBLIC, anon, authenticated and service_role. Supabase Security Advisor continues to report:
- `anon_security_definer_function_executable` (WARN): [remediation](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- `authenticated_security_definer_function_executable` (WARN): [remediation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)

### 3.2 Risk assessment

The exception handler creates a fail-open control gap: a failure in `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` may be swallowed while the table-creation DDL transaction continues. A log entry is not an enforceable RLS invariant. RLS on current tables does not prove future tables will be protected if the event-trigger function fails.

The current nine application tables all report `relrowsecurity=true`; none reports `relforcerowsecurity=true`. RLS is enabled on 9/9 current public application tables. Current policies are SELECT-only for authenticated users; there are no INSERT, UPDATE or DELETE policies for application roles. This means the observed grants do not by themselves prove that anon/authenticated can write rows: RLS remains an independent row gate. Nevertheless, broad SQL grants violate least privilege and enlarge the impact of any future policy or function mistake. Table owners and BYPASSRLS roles are outside ordinary RLS enforcement unless separately constrained.

### 3.3 Decision

**Decision: HOLD production ACL/function/trigger changes; remediate only after a reviewed validation path exists.**

Options considered:

1. **Revoke public API EXECUTE while preserving event-trigger invocation.** Candidate least-privilege direction: remove EXECUTE from PUBLIC, anon, authenticated and service_role; retain only the privilege required for the event-trigger owner/runtime. This must first be verified against PostgreSQL event-trigger function privilege semantics and a controlled isolated PostgreSQL reproduction. Do not assume revoking EXECUTE will or will not affect an already-created event trigger without evidence.
2. **Fail closed on RLS activation errors.** Replace the swallowed exception with an error that aborts the DDL transaction, while retaining explicit logging/context. This prevents silent creation of a public table after failed RLS activation. Validate supported command tags, partitioned tables and object resolution before deployment.
3. **Move helper out of exposed schema.** A private/non-exposed schema can reduce Data API exposure, but moving/rebinding an event-trigger function requires a reviewed migration and dependency/ownership analysis.
4. **Retain current function unchanged.** This is the current production state, not an accepted final security decision.

A safe change requires: exact PostgreSQL/Supabase documentation, an isolated non-production reproduction of event-trigger invocation after ACL changes, failure injection proving DDL aborts when RLS cannot be enabled, verification of event-trigger owner and function owner, migration/recovery plan, post-change catalog checks and a clean Security Advisor result. The user's no-staging/no-UAT/no-production-test policy remains respected; therefore that reproduction was not performed and no production change was applied.

### 3.4 Tenant-owned table verification

| Table | RLS | FORCE RLS | Current policy intent |
|---|---:|---:|---|
| `profiles` | Yes | No | SELECT self |
| `tenants` | Yes | No | SELECT through active membership |
| `organizations` | Yes | No | SELECT by active membership in tenant |
| `memberships` | Yes | No | SELECT self |
| `roles` | Yes | No | Platform roles or roles in active tenant |
| `permissions` | Yes | No | SELECT authenticated |
| `role_permissions` | Yes | No | SELECT for visible roles |
| `membership_roles` | Yes | No | SELECT own active membership |
| `audit_logs` | Yes | No | SELECT own actor rows |

**Assessment:** RLS is enabled on every current public application table, but tenant isolation is not fully accepted by this fact alone. Organization policy is tenant-membership scoped rather than consistently object/branch scoped; platform role metadata is broadly visible to authenticated users; no FORCE RLS is set; privileged backend connections may bypass RLS depending on their configured database role. Phase 01 must address ABAC/object scope and privileged connection design. No policy was modified in Phase 00.

## 4. P00-AC-05 — Supabase configuration evidence and least-privilege decision

### 4.1 Verified live project

- Project name/ref: `Agentzy-db` / `cwhjdnkotuhueeudpgeu`
- Status: `ACTIVE_HEALTHY`
- PostgreSQL: `17.12.0.000`
- Region: `ap-northeast-1`
- Auth users: 0 (catalog count)
- Storage buckets: 0; no application file bucket is configured in the inspected catalog.
- Installed extensions: `pg_stat_statements 1.11`, `pgcrypto 1.3`, `plpgsql 1.0`, `supabase_vault 0.3.2`, `uuid-ossp 1.1`, `vector 0.8.2`.

### 4.2 Repository Auth/API config — not proof of live dashboard state

The checked-in `supabase/config.toml` declares:
- API enabled; local declared schemas `public` and `graphql_public`.
- Auth enabled.
- Local `site_url` is `http://localhost:3000`; additional redirect URLs are localhost portal paths only.
- `jwt_expiry = 3600`.
- Public signup disabled (`enable_signup = false`, including `[auth.email]`).
- Email confirmations enabled and double confirmation for email changes enabled.

These values are repository configuration, not authoritative proof that the hosted project currently uses the same Auth provider, signup, redirect, email, MFA or session policy. The current Supabase connector does not expose the project's Auth provider list, password policy, SMTP configuration, live URL/redirect allowlist, MFA policy, or session timeout configuration. They remain **UNVERIFIED**. With zero Auth users, there is no active user factor/session evidence to inspect.

The config file's declared API schemas are also not proof of the hosted Data API exposed-schema configuration. A read of the current PostgREST role settings did not expose an authoritative `pgrst.db_schemas` value. The live Data API exposed schema setting remains **UNVERIFIED**. The Security Advisor confirms that `rls_auto_enable()` is callable through the REST RPC surface.

### 4.3 Live grants and default privileges

The live database reports `anon` and `authenticated` each have DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE and UPDATE on all nine public Agentzy tables. `service_role` has the same table privileges. RLS policies currently limit application-role row access, but these grants are broader than the platform's intended FastAPI business-authority boundary.

Live `pg_default_acl` includes broad public-schema table and sequence defaults for objects created by `postgres` and a parallel set for `supabase_admin`; function EXECUTE defaults also include PUBLIC/anon/authenticated/service_role. This is a default privilege configuration observation, not proof that every future object is exposed in the hosted Data API. Supabase's current documentation distinguishes grants (object reachability) from RLS (row authorization), and describes the October 30, 2026 rollout for automatically exposed tables: [Securing your API](https://supabase.com/docs/guides/api/securing-your-api) and [Data API exposure change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

### 4.4 Least-privilege target matrix — decision proposal, not applied

| Principal | Target access | Decision |
|---|---|---|
| `anon` | No access to Agentzy business tables, tenant data or privileged functions. Public landing/application actions use FastAPI public endpoints with validation/rate limiting. | REVOKE/DO NOT GRANT business-table and helper-function privileges. |
| `authenticated` | No direct business DML. Only the minimum RLS-scoped SELECT privileges required by the authenticated FastAPI database context; no client-side business writes. | SELECT-only where required; no INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER/REFERENCES. |
| FastAPI backend | Dedicated non-superuser, non-BYPASSRLS runtime DB role; minimum schema/table/function privileges; tenant context and policies applied; sensitive commands audited/idempotent. | Role and grant set are not yet verified/configured as a dedicated runtime boundary. Do not use owner/superuser as a generic application role. |
| `service_role` | Server-only Supabase administrative operations requiring bypass; never in browser; not the default FastAPI transaction role. | Keep secret server-side; narrow usage and audit; BYPASSRLS property verified. |
| `postgres` / `supabase_admin` | Administrative/migration owners only. | Not an application runtime identity. |

**Not applied:** no GRANT/REVOKE, default-privilege, role, Data API or Auth setting change was made. A grant change requires a separate reviewed migration, verification of API call paths and recovery plan.

### 4.5 Storage and Realtime

- `storage.buckets` returned zero rows. No application buckets or visibility policies were present in the inspected state.
- No application storage policies were found in the Phase 00 catalog snapshot.
- Recommended future default: private buckets; explicit object-level policies; authorized short-lived signed URLs; upload MIME/size validation and quarantine. This is a target decision, not current deployed configuration.
- Realtime publication exists in the earlier baseline, but no Agentzy application tables were verified as publication members. Do not infer active business Realtime delivery from publication existence.

## 5. P00-AC-03 — Dependency/license and asset provenance disposition

### 5.1 Package inventory

The generated license review reconciles **1,037/1,037** exact package coordinates: 960 installed-tree packages plus 77 platform-specific registry fallbacks; zero unresolved registry lookups. 988 license texts are consolidated and two NOTICE files were detected and retained (`bare-path@3.1.3`, `import-in-the-middle@3.6.0`).

| Finding | Count | Current disposition |
|---|---:|---|
| Permissive SPDX + license text detected | 966 | **KEEP WITH CONDITIONS** — retain attribution/license bundle; no formal legal approval implied. |
| LGPL/MPL | 26 | **KEEP WITH CONDITIONS / REVIEW** — confirm shipped/native/WASM inclusion, linking model, source availability and notice obligations. No automatic replacement. |
| Manual/non-standard expression | 5 | **PENDING EVIDENCE** — verify exact upstream license text and expression. |
| Metadata says MIT/Apache but package LICENSE file not found | 40 | **PENDING EVIDENCE** — retrieve exact upstream LICENSE/copyright evidence. Do not fabricate notices. |
| REPLACE | 0 | No replacement is justified by this automated report alone. |

Manual-review packages: `argparse@2.0.1`, `caniuse-lite@1.0.30001826`, `deep-freeze@0.0.1`, `url-template@2.0.8`, `valid-url@1.0.9`. The 26 LGPL/MPL group includes `@img/sharp*` / `@img/sharp-libvips*`, `lightningcss*` and `axe-core`.

**Gate decision:** P00-AC-03 remains PARTIAL. The automated scan is technical triage, not a legal opinion or final package-by-package approval.

### 5.2 Asset provenance

The repository inventory identifies 31 raster assets (PNG/JPG/WebP), 29,037,921 bytes total, six exact duplicate blob groups, with file sizes and Git blob SHAs recorded in `ASSET_METADATA_INVENTORY_2026-11-18.md`. Some logo/landing/PWA asset usage is confirmed by source references. Pixel dimensions were not decoded in this audit. A number of `public/assets/aistudio/` uploads are not mapped to production usage.

For **each of the 31 assets**, source author/owner, original source, license/permission, attribution requirement, commercial use permission and final usage location are not all evidenced. Current asset decision is **PENDING EVIDENCE**; do not remove, replace, redistribute or label as owned until provenance is established. Six duplicate pairs/groups are metadata duplicates, not automatic deletion candidates. The asset owner must record one of: KEEP, KEEP WITH CONDITIONS, REPLACE, EXCLUDE, or PENDING EVIDENCE with proof and usage reference.

## 6. P00-AC-02 / P00-AC-04 — Screen/action inventory and API ownership

### 6.1 Structural inventory on current main

The recursive Git tree is complete (`truncated=false`). The current frontend uses the existing root Next.js App Router and portal feature directories; preserve these locations and UI/UX.

| Surface | Verified structure | Current API status |
|---|---|---|
| Public landing | `app/page.tsx` plus shared landing components | Partnership/public acquisition API is not established in the currently inspected FastAPI router set. |
| Super Admin | `app/admin/*`, `apps/admin/` feature modules and service/hook | Tenant directory/create/update/archive, role catalogue, membership invite/list and bootstrap use FastAPI routes; other catalogue, finance, AI, governance and workforce actions remain unverified/not wired. |
| Corporate / ISP | `app/corporate/*`, `apps/corporate/` feature modules and service/hook | Organization list/create and member list/invite use FastAPI; analytics, workforce, finance, credits, contracts, alerts and reporting endpoints are not present in the current router set. |
| AI Workforce | `app/ai-workforce/*`, `apps/ai-workforce/` feature modules and service/hook | Auth and shell exist; worker/model/skill/tool/memory/knowledge/workflow/run/approval domains do not have complete FastAPI route coverage in the inspected router. |
| Human Workforce | `app/workforce/page.tsx` and shared workforce components | No dedicated workforce API router was found in the inspected API route set. |

Current source structure counts: 14 Next.js page/layout/route files under `app/` (11 page/layout files plus 3 concrete Next.js API route handlers); 89 TS/TSX/JS/JSX feature files under `apps/admin`, `apps/corporate`, `apps/ai-workforce`; 3 portal service modules; 4 shared/portal hooks; 16 top-level `lib` and `apps/web/lib` entries (including nested auth/supabase modules). The FastAPI backend directory contains 20 tracked files; the API v1 router currently includes four route modules: `identity`, `tenants`, `management`, `bootstrap`.

This is a structural inventory, **not** a claim that every screen, button, form, menu action, modal, hook callback or service method has been inspected. P00-AC-02 and P00-AC-04 therefore remain PARTIAL.

### 6.2 Current API ownership map

| Screen / action | Current API or handler | Backend/domain owner | Permission boundary | Database entity / status |
|---|---|---|---|---|
| Auth sign-in, OAuth, sign-out, session restoration, MFA assurance | Supabase Auth client via `apps/web/lib/auth/useAgentzyAuth.ts` | Identity provider (Supabase Auth); FastAPI validates bearer JWT | Supabase Auth session; privileged platform actions require AAL2 | `auth.users`, `auth.sessions`; Auth dashboard settings unverified |
| Identity/profile context | `GET /api/v1/me` | Identity | Authenticated user; membership-scoped query | `profiles`, `memberships`, `tenants`, `membership_roles`, `roles`, `role_permissions` |
| Tenant switch/list | `GET /api/v1/tenants` | Tenant & Membership | Active membership for subject | `tenants`, `memberships` |
| Organization list | `GET /api/v1/tenants/{tenant_id}/organizations` | Organization | `corporate.organization.read` or platform tenant-read with AAL2 | `organizations`, membership/role joins |
| Organization create | Existing management route under tenant organization | Organization | Tenant organization manage permission | `organizations`; parent/tenant integrity requires further review |
| Tenant directory/create/update/archive | Existing management routes | Platform Tenant Management | Platform permission + AAL2 for privileged actions | `tenants`, `audit_logs` |
| Membership list/invite | Existing management routes | Membership & Invitation | Tenant membership read/manage permission | `memberships`, `membership_roles`, `audit_logs`; invite lifecycle is incomplete |
| Role catalogue | `GET /api/v1/roles` | RBAC / Permission Catalogue | Role visibility and platform scoping require further review | `roles`, `permissions`, `role_permissions` |
| First platform admin bootstrap | `POST /api/v1/bootstrap/platform-admin` | Platform Bootstrap / Identity | One-time bootstrap token; Supabase service role server-side; MFA after invite | `auth.users`, `tenants`, `memberships`, `membership_roles`, `audit_logs` |
| AI content generation | `POST /api/ai-workforce/generate-content` (Next.js handler) | Should be FastAPI AI Gateway / Model Router | Current direct provider route is transitional and must not remain business authority | No canonical persisted run/usage contract confirmed; ownership gap |
| Maps browser config | `GET /api/config/maps` (Next.js handler) | Maps integration/config | Public restricted browser key only; no server secret | No business entity; key handling reviewed separately |
| Reverse geocode | `GET /api/maps/reverse-geocode` (Next.js handler) | Maps/Location integration | Server-side provider access and quota/privacy controls | No canonical API owner contract confirmed |
| Human Workforce actions | Existing UI components/hooks | Human Workforce domain | Must be server-authorized by tenant/organization/branch/object | No dedicated API route in current router set; GAP |
| Corporate analytics, finance, commission, credits, contracts, reports, notifications | Existing feature modules | Respective corporate bounded contexts | Domain-specific read/write permission + tenant/object scope | No complete API contracts in current router set; GAP |
| AI Worker, model, skills, tools, memory, RAG, workflow, approvals and runs | Existing feature modules | AI Workforce / AI Platform | Tenant/worker/resource scope; high-risk actions require approval/audit | No complete API contracts in current router set; GAP |
| Super Admin finance, provider, product, subscription, integrations, governance, incidents | Existing feature modules | Respective platform domains | Platform role + AAL2 + audit | No complete API contracts in current router set; GAP |

Canonical ownership rule: FastAPI `apps/api/app/api/v1` owns business APIs and domain logic. Next.js `app/api` handlers are transitional adapters only; they must not become the authoritative AI/business execution layer. Supabase Auth owns authentication/session issuance; PostgreSQL owns persistent business state. Frontend service modules are presentation/adapters, not business authority.

### 6.3 Local/demo/fallback findings

- `apps/admin/services/admin-service.ts` initializes empty collections but also contains hard-coded model-routing simulation and commission-preview calculation logic. These are not authoritative provider/model decisions or payable commission calculations.
- `apps/corporate/services/corporate-service.ts` returns zero-valued snapshots and empty collections where endpoints are not provisioned. These values must be clearly treated as unavailable/empty state, not real metrics.
- `apps/ai-workforce/services/ai-workforce-service.ts` includes client-side artifact formatting/export helpers. This is presentation/export behavior, not persisted AI run lifecycle.
- `app/api/ai-workforce/generate-content/route.ts` is a Next.js provider-facing handler and conflicts with the target FastAPI AI Gateway ownership until migrated.
- Other direct database/provider accesses and every component action require a complete source-wide scan. This report does not claim that no additional local/demo paths exist.

## 7. P00-AC-08 — Migration reconciliation M000–M220

### 7.1 Actual source/history/catalog comparison

Remote Supabase migration history contains:
1. `20261117175948` — `phase_01_platform_core_identity_tenant`
2. `20261117181011` — `phase_01_system_roles_permissions_auth_profile`
3. `20261117182410` — `phase_01_profile_email_projection`

The same three SQL files exist in `supabase/migrations/`. Their current remote schema result is nine public tables with RLS enabled. The schema includes the `profiles.email` projection and `profiles_email_lower_idx` introduced by the third migration. No migration history or schema evidence was inferred merely from file presence.

### 7.2 Batch-by-batch reconciliation

| Batch | Blueprint phase/domain owner | Schema scope / principal tables | Status vs source/history/catalog | Dependencies / order | RLS, grants, constraints, indexes | API contract / compatibility / recovery |
|---|---|---|---|---|---|---|
| M000 | 00 — Platform Baseline / Database Governance | No application tables; audit artifacts and migration policy only | **NOT APPLICABLE as DDL**; evidence docs exist; no remote migration entry | Precedes all batches | Catalog/security/migration evidence only; no schema DDL | No API. Preserve audit records; correct via superseding evidence, not synthetic baseline schema. |
| M010 | 01 — Identity & Tenant | `profiles`, `tenants`, `organizations`, `memberships`, `roles`, `permissions`, `role_permissions`, `membership_roles`, `audit_logs` | **APPLIED**: 3 source SQL files match 3 remote history entries; 9/9 tables exist; RLS enabled on 9/9 | Depends on Supabase Auth `auth.users`; foundation for every tenant-owned domain | RLS SELECT policies present; broad table grants to anon/authenticated/service_role; 15 system roles, 45 permission keys, 134 role-permission links. PK/FK/check/unique constraints and indexes cataloged. No FORCE RLS. Cross-tenant composite integrity and object-level scope still incomplete. | Existing API: `/me`, `/tenants`, tenant organizations, tenant directory/management, memberships, roles, bootstrap. Additive forward-only corrections; do not rewrite applied migrations. Recovery: additive fix migration and verified backup/restore plan; no destructive reset. |
| M020 | 02 — Partnership Acquisition | Partnership applications, public service catalogue, consent, attachment references | **NOT APPLIED**; no source migration/history/table observed | After M010 identity/tenant foundation; public prospect flow may create pre-tenant records | RLS/grants/policies/constraints/indexes not yet designed/applied; public write must be controlled by FastAPI, no public prospect reads | Partnership application API contract not implemented in current router. Backward compatibility: additive new domain; recovery via forward fix/compensating records. |
| M030 | 03 — Corporate & Commercial | Corporate profiles, contracts, versions, SOW, entitlements, invoices | **NOT APPLIED** | Depends M010 tenant/org; M020 partnership conversion and contract approval | Not yet designed/applied; tenant ownership, private document access, financial immutability and indexes required | Contract/entitlement/invoice API contracts not complete. Preserve existing portal; additive migrations; recover by forward correction and ledger/document reconciliation. |
| M040 | 04 — Human Workforce | Workforce profiles, contracts, skills, availability, training | **NOT APPLIED** | Depends M010 identity/membership/org; M030 entitlement/contract rules where applicable | Not yet designed/applied; RLS by worker/tenant/organization/assignment and private evidence storage required | No complete Human Workforce API router. Lifecycle changes must be audited; additive migration and reversible status transitions. |
| M050 | 05 — Provider, Product & Sales | Providers, products, leads, customers, orders, attribution, provider events | **NOT APPLIED** | Depends M020/030 partnership and provider contract; M010 tenant model | Not yet designed/applied; provider/tenant scoping, unique provider event IDs, idempotency indexes and RLS required | Provider integration/API contracts not complete. Event replay/reconciliation and compensating updates required. |
| M060 | 06 — Affiliate | Affiliate profiles, invitations, agreements, referrals, attribution | **NOT APPLIED** | Depends M040 workforce identity and M050 sales/attribution | Not yet designed/applied; attribution integrity, invitation expiry and audit constraints required | Affiliate lifecycle APIs absent. Preserve attribution history; correct via adjustment/event, not destructive rewrite. |
| M070 | 07 — Commission | Commission schemes, versions, rules, events, calculations, ledger, payout | **NOT APPLIED** | Depends M050 productivity and M060 attribution; M030 contract rules | Not yet designed/applied; immutable ledger, Decimal values, unique source events, approval and idempotency indexes required | Deterministic commission API not present. Backward compatibility through versioned schemes and adjustment entries; never recalculate/overwrite settled ledger silently. |
| M080 | 08 — Technical Operations | Technicians, work orders, assignments, events, evidence, QC, SLA | **NOT APPLIED** | Depends M040 workforce and M050 provider/product/service mapping | Not yet designed/applied; tenant/object RLS, event sequence, evidence object policies and SLA indexes required | Work order/dispatch APIs absent. Recovery through event replay and explicit rework/compensation. |
| M090 | 09 — AI Platform / Model Governance | Model registry, AI policies, usage metering, gateway configuration | **NOT APPLIED** | Depends M010 tenant/permissions and M030 entitlements/budget policy | Not yet designed/applied; model/provider secrets stay server-side; usage uniqueness/idempotency and tenant RLS required | AI Gateway API contract not complete. Versioned routing/policy, durable usage ledger; retry must be idempotent. |
| M100 | 10 — AI Workforce | AI worker registry, versions, skill/tool bindings, approvals | **NOT APPLIED** | Depends M090 model/policy; M010 tenant/RBAC | Not yet designed/applied; tenant/worker/object-level RLS, immutable version snapshots, approval audit required | AI Worker APIs not complete. Preserve versions; rollback by activating prior approved version. |
| M110 | 11 — Skills & Tools | Skill packages/versions, tool registry, knowledge documents/chunks | **NOT APPLIED** | Depends M090 policy and M100 AI worker bindings; external license provenance gate | Not yet designed/applied; provenance, license, permission and tenant scope constraints required | Registry/resolver API absent. Versioned package state; exclude/deactivate rather than delete provenance history. |
| M120 | 12 — Memory & Knowledge Governance | Memory records, permissions, retention, access logs | **NOT APPLIED** | Depends M010 tenant/identity, M090 policy and M110 knowledge sources | Not yet designed/applied; owner/tenant scope, consent, purpose, retention and deletion indexes/RLS required | Memory API absent. Deletion propagation and retention replay/repair plan required. |
| M130 | 13 — AI Runtime | AI runs, steps, events, checkpoints, execution leases | **NOT APPLIED** | Depends M090 model usage, M100 workers, M110 tools/skills, M120 memory | Not yet designed/applied; idempotency, unique run/event keys, leases, checkpoints and tenant RLS required | Durable run lifecycle APIs absent. Recover from checkpoints/event replay; cancellation and retry must be idempotent. |
| M140 | 14 — Workflow | Workflow definitions, versions, runs, steps, approvals | **NOT APPLIED** | Depends M130 runtime, M010 identity/permissions and M030 entitlements | Not yet designed/applied; immutable definitions/versions, run state constraints, approval and audit indexes required | Workflow APIs absent. Versioned definition; active runs pin version; compensation explicit. |
| M150 | 15 — Role Catalogue & Evaluation | Role catalogue, evaluation, performance measurement configuration | **NOT APPLIED** | Depends M010 RBAC and M040 workforce/M100 AI worker roles | Not yet designed/applied; role scope, metric definition/version and tenant ownership constraints required | Role/evaluation domain APIs incomplete. Version metrics and preserve historic evaluation basis. |
| M160 | 16 — AI Credits & Billing | AI credit wallets, transactions, reservations, top-ups, budgets | **NOT APPLIED** | Depends M030 entitlements/billing and M090 usage metering | Not yet designed/applied; immutable ledger, idempotent settlement, balance constraints and tenant RLS required | Credit/billing APIs absent. Recover with compensating ledger entries; never mutate settled transactions. |
| M170 | 17 — Analytics & KPI | Analytics events, aggregates, KPI definitions/targets/measurements, reports | **NOT APPLIED** | Depends M040–M160 source domains; event/outbox foundations | Not yet designed/applied; tenant filters, aggregate grain, time indexes and provenance required | Analytics/report APIs absent. Rebuild aggregates from canonical events; keep source event immutable. |
| M180 | 18 — Integrations & Notifications | Integration records, credential references, webhooks, notifications, outbox | **NOT APPLIED** | Depends M010 identity, M030 contract consent and M090/M130 integration consumers | Not yet designed/applied; encrypted credential references, replay protection, idempotency and delivery indexes required | Integration/webhook/notification APIs absent. Retry with dedupe and dead-letter/replay controls; revoke credentials. |
| M190 | 19 — Governance & Operations | Governance, feature flags, incident/security operations configuration | **NOT APPLIED** | Depends M010 RBAC/audit and cross-domain event/outbox | Not yet designed/applied; privileged action audit, approvals, policy scope and retention required | Governance/incident APIs incomplete. Retain audit records; feature flag rollback must be controlled. |
| M200 | 20 — Cross-domain Integrity | Cross-domain constraints, indexes, consistency fixes, obsolete-path cleanup | **NOT APPLIED** | Depends on all prior domain schemas; only after live data audit | Not yet designed/applied; validate duplicates/orphans first; additive constraints/indexes; no destructive cleanup without evidence | Cross-domain contract validation. Recovery via staged constraint validation and forward repair; never reset production DB. |
| M210 | 21 — Data Lifecycle & Finance Close | Retention/deletion jobs, data subject requests, finance close metadata | **NOT APPLIED** | Depends on data classification, retention policies and finance ledger domains | Not yet designed/applied; deletion authorization, legal hold, retention indexes and audit required | Data lifecycle APIs/jobs absent. Reversible quarantine/hold where lawful; immutable financial/audit records follow approved retention policy. |
| M220 | 22 — Release Reconciliation | Final migration reconciliation and release-readiness schema freeze | **NOT APPLIED**; future release gate | Depends on all prior phases/batches | Final schema/RLS/grants/constraints/indexes freeze and drift report required | Release OpenAPI/schema freeze and rollback package; production release only under Phase 22/23 gate. |

For M020–M220, absence of source SQL, remote history and public application tables is recorded as **not applied**, not as a defect to be filled during Phase 00. Their detailed implementation contracts remain owned by the corresponding future phase. Do not create these migrations early.

### 7.3 M010 current schema notes

The nine current public tables are listed in §3.3. Catalog evidence confirms primary keys, foreign keys, checks, unique constraints and indexes from the three applied migrations. The third migration adds nullable `profiles.email` and a partial lower-case email index. The profile synchronization trigger `on_auth_user_created` is AFTER INSERT OR UPDATE on `auth.users`; `handle_new_auth_user()` is SECURITY DEFINER with a fixed search path and EXECUTE revoked from PUBLIC/anon/authenticated. This helper is distinct from the still-exposed `rls_auto_enable()` event-trigger helper.

The existing M010 source/history/schema reconciliation is **APPLIED**, but Phase 01 acceptance is not complete: composite tenant-consistency constraints, complete membership lifecycle, branch/department resources, object-level ABAC, session revocation, and privileged DB role boundaries remain gaps.

## 8. P00-AC-09 — Final Definition of Done (approval pending)

A task/phase can be marked DONE only when all applicable evidence below is attached:

1. **Scope and acceptance:** requirement ID, explicit acceptance criteria, non-goals, affected domains/screens, owner and dependency.
2. **Repository:** implementation commit SHA on canonical branch; source files and no duplicate portal/source of truth.
3. **Migration:** ordered migration file, source checksum, remote migration-history entry, live catalog evidence (tables/columns/constraints/indexes), data/backfill reconciliation and backward-compatible recovery/rollback notes. Applied migrations are immutable; corrections are additive.
4. **API/OpenAPI:** typed Pydantic request/response/error schemas, documented `/api/v1` endpoint, pagination/filter/idempotency semantics, OpenAPI evidence and contract validation.
5. **Authorization/RLS:** authentication, RBAC + ABAC + object-level checks, tenant context, least-privilege grants, RLS policies, privileged role boundary and denied-access evidence.
6. **Frontend wiring:** existing screen/action uses typed FastAPI client; no direct business write or silent mock/demo fallback; loading, empty, error, forbidden and retry states are explicit; UI/UX and design tokens preserved.
7. **Integration/events:** outbox/event contract, webhook signature/replay protection, idempotent consumers, retry/dead-letter/replay, approval and compensation semantics where applicable.
8. **Observability/audit:** request/correlation/trace IDs, structured logs, metrics/alerts, security events, immutable audit trail and operator attribution.
9. **Data quality and privacy:** tenant isolation, data classification, consent/purpose, retention/deletion, storage access, secret handling and provenance.
10. **Documentation/operations:** architecture/API docs, runbooks, migration/recovery notes, known limitations, ownership and support procedure.
11. **Engineering checks:** lint, type-check, Python compile/import, migration consistency, schema/OpenAPI validation, static security and focused deterministic unit checks actually run with result/command/environment. Do not claim a check not executed.
12. **Release gate:** real-world tests, UAT, staging, load/security acceptance and production release are deferred to Phase 22; Phase 23 is controlled rollout/continuous improvement.

This DoD is recorded as the proposed final checklist. Formal P00-AC-09 acceptance is still pending Product Owner and Engineering Lead approval.

## 9. P00-AC-10 — Phase 01 readiness checklist and approval record

### Readiness checklist

- [ ] P00-AC-01 governance and phase order signed off.
- [ ] P00-AC-02 all screens, controls, forms, actions, hooks and services mapped to API/domain/permission/entity.
- [ ] P00-AC-03 every dependency and asset has an approved KEEP / KEEP WITH CONDITIONS / REPLACE / EXCLUDE / PENDING EVIDENCE disposition; no unresolved required license obligations.
- [ ] P00-AC-04 one canonical API/domain owner approved for every action.
- [ ] P00-AC-05 live Auth, Data API, Storage, grants, default privileges and backend/service-role boundary evidenced; least-privilege decisions approved.
- [ ] P00-AC-06 RLS event-trigger fail-open behavior remediated and verified; Security Advisor findings disposed with evidence.
- [ ] P00-AC-07 ADR register accepted.
- [ ] P00-AC-08 M000–M220 source/history/catalog reconciliation approved.
- [ ] P00-AC-09 Definition of Done approved and evidence record complete.
- [ ] Phase 01 scope, dependencies, existing applied migrations, known gaps and recovery plan reviewed.
- [ ] Minimum engineering checks executed and results recorded; no staging/UAT/real-world testing performed.
- [ ] Product Owner explicitly approves Phase 01 start.

### Approval record

| Field | Value |
|---|---|
| Phase 00 closure | NOT APPROVED |
| Phase 01 readiness | NOT APPROVED |
| Product Owner approval | Not received |
| Engineering Lead approval | Not received |
| Security/Database approval | Not received |
| Approval date | — |
| Authorized Phase 01 start commit | — |

No Phase 01 coding is authorized by this report. The already-applied M010 migrations are recorded as historical/current schema state only.

## 10. Engineering-check and execution evidence

- GitHub recursive tree returned `truncated=false`; source path inventory and counts recorded in §6. The GitHub branch API reports `main` is currently **not protected** and required status checks are disabled; this is a repository-governance residual (no branch-protection setting was changed because the requested execution model is direct-to-main and policy approval is required).
- Supabase project metadata, migration history, function definition, event trigger, table RLS flags, policies, grants, default ACLs, role attributes, constraints, indexes, extensions and Storage bucket count were queried read-only.
- Existing GitHub Actions dependency/license review run `44138463292` completed successfully on commit `ffb514ce42aa917e9b63382f153c5306872c710b` (17 Nov 2026). It validates package/license inventory collection and coordinate reconciliation, not the latest documentation HEAD, application build correctness or legal approval.
- Current Auth users = 0; Storage buckets = 0, objects = 0 and Storage policies = 0 in the live catalog. No authoritative hosted Auth settings or Data API schema setting was obtained. Build/lint/type-check, Python compile/import, migration consistency, OpenAPI validation and focused deterministic checks were **not executed in this audit**. A local repository checkout/runtime was not available through the current GitHub connector path; do not claim these checks passed. This remains an engineering evidence gap.
- No deployment, staging, UAT, real-world, load or security-acceptance tests were run.

## 11. Source and evidence references

- `AGENTS.md` — mandatory engineering and DoD rules.
- `docs/AGENTZY_MASTER_PRD_v2.0.md` — product scope and phase sequence.
- `docs/AGENTZY_TECHNICAL_IMPLEMENTATION_BLUEPRINT_v1.0.md` — architecture, domain ownership, migration batches and security.
- `docs/AGENTZY_IMPLEMENTATION_BACKLOG_PER_PHASE.md` — phase tracker and execution guard.
- `docs/AGENTZY_REPOSITORY_SUPABASE_AUDIT_2026-11-17.md` and `docs/AGENTZY_SOURCE_CODE_DEEP_DIVE_AUDIT_2026-11-17.md` — historical audit snapshots; use this report to supersede stale claims.
- `docs/phase-00/BASELINE_EVIDENCE_AND_ACCEPTANCE.md`
- `docs/phase-00/PHASE00_CONTINUATION_EVIDENCE_2026-11-18.md`
- `docs/phase-00/MIGRATION_BATCH_RECONCILIATION_M000_M220.md`
- `docs/phase-00/DEPENDENCY_LICENSE_FINDINGS_2026-11-18.md`
- `docs/phase-00/ASSET_METADATA_INVENTORY_2026-11-18.md`
- Supabase docs: [Securing your API](https://supabase.com/docs/guides/api/securing-your-api), [Data API exposure change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

**Final status: PHASE 00 PARTIAL / BLOCKED. Phase 01 remains NOT APPROVED and must not start.**


## 12. Phase 00 continuation — implementation evidence and residual blockers

This section is the latest addendum to the audit above.

### Work products added on main

- `docs/phase-00/RLS_SECURITY_REMEDIATION_2026-11-18.md` — PostgreSQL 17 invocation privilege analysis, fail-closed SQL draft, two Security Advisor remediation records, recovery plan and non-application reason.
- `docs/phase-00/LICENSE_ASSET_PROVENANCE_DISPOSITION_2026-11-18.md` — package exception groups, exact manual-review coordinates, asset evidence gaps and owner/approval assignments.
- `docs/phase-00/SCREEN_ACTION_API_DOMAIN_INVENTORY_2026-11-18.md` — verified route/module inventory and current API/domain ownership mapping; callback-level scan remains partial.
- `docs/phase-00/ENGINEERING_CHECKS_REPORT_2026-11-18.md` — workflow and actual CI evidence.

### RLS remediation source review

PostgreSQL 17 stable `EventTriggerInvoke` source uses `fmgr_info` and `FunctionCallInvoke` to call the registered event-trigger function, without a per-event end-user EXECUTE ACL check. This supports revoking EXECUTE from PUBLIC/anon/authenticated/service_role while retaining the postgres-owned event trigger. The SQL proposal is additive and fail-closed, but was **not applied** because the Supabase CLI required by the migration workflow is unavailable in the execution environment and no verified backup/PITR recovery point or isolated managed-build validation is available.

Latest live Security Advisor observation at 2026-11-18T02:36:44Z still shows both:
- `anon_security_definer_function_executable` WARN for `public.rls_auto_enable()`
- `authenticated_security_definer_function_executable` WARN for `public.rls_auto_enable()`

Function owner/search_path/event-trigger owner/enabled state and function ACL remain unchanged. No production database change is claimed.

### Engineering workflow result

Workflow `.github/workflows/phase-00-engineering-checks.yml` was added in commit `3a427e3a4990bee3889192eca83fcf285531e332`. Run `44224158408` failed:
- Migration filename/version/order check: PASS (3 files).
- Python compileall: PASS.
- Ruff: FAIL, 101 findings (including I001/E501; 7 auto-fixable).
- FastAPI import/OpenAPI: SKIPPED after Ruff failure.
- Bun frozen install: FAIL because `@supabase/supabase-js` is in package.json but absent from bun.lock.
- ESLint and TypeScript: SKIPPED after dependency install failure.

See `ENGINEERING_CHECKS_REPORT_2026-11-18.md`. These failures are now actionable engineering debt; no lint/type-check pass is claimed.

### Current decision

Phase 00 remains **PARTIAL / BLOCKED**. Phase 01 is not started. No UI, Phase 01 feature, migration, Supabase DDL, grant, policy, function, trigger, Auth setting, Storage setting, deployment or business data was changed by this continuation.


## 13. Additional evidence pack index

- RLS assessment/remediation draft: `RLS_SECURITY_REMEDIATION_2026-11-18.md`
- License/asset disposition register: `LICENSE_ASSET_PROVENANCE_DISPOSITION_2026-11-18.md`
- Screen/action/API/domain inventory: `SCREEN_ACTION_API_DOMAIN_INVENTORY_2026-11-18.md`
- Engineering checks actual run results: `ENGINEERING_CHECKS_REPORT_2026-11-18.md`
- Residual risk and owner register: `PHASE00_RESIDUAL_RISK_REGISTER_2026-11-18.md`

These files are evidence and decision records; they do not substitute for external Dashboard evidence, legal/asset-owner approval, complete callback-level inventory, production migration execution or independent sign-off.
