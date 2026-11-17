# Phase 00 — Repository & Supabase Baseline Evidence

**Status:** IN PROGRESS — not signed off  
**Canonical repository:** `fadliansyah36/Agentzy-platform`, branch `main`  
**Canonical Supabase:** `Agentzy-db`, ref `cwhjdnkotuhueeudpgeu`  
**Evidence date:** 2026-11-17

## 1. Scope and governing sources

This evidence record follows:
- `AGENTS.md` — mandatory engineering and Definition of Done rules.
- `docs/AGENTZY_MASTER_PRD_v2.0.md` — Phase 00 exit: PRD, glossary, decision log, AGENTS, coding standards, ADR, domain ownership, repository audit, asset/dependency/license inventory and environment/secret inventory. Exit requires agreed boundaries, repository conventions and source of truth.
- `docs/AGENTZY_TECHNICAL_IMPLEMENTATION_BLUEPRINT_v1.0.md` — modular monolith, portal structure, API, data, security, migration and ADR guidance.
- `docs/AGENTZY_IMPLEMENTATION_BACKLOG_PER_PHASE.md` — executable phase/task registry.
- `docs/AGENTZY_REPOSITORY_SUPABASE_AUDIT_2026-11-17.md` — live findings.

User delivery constraint: direct work on `main`; no staging or real-world/UAT testing before Phase 22. Minimum engineering checks from AGENTS.md remain required and must be truthfully reported.

## 2. Repository snapshot

- Recursive Git tree at commit `a9482d864aa6683027bbec02321ca469f1251596`: 282 entries, `truncated=false`.
- Existing application areas: `apps/admin/` (55 paths), `apps/corporate/` (49), `apps/ai-workforce/` (42), root `app/` (28). Root `app/` is the Next.js App Router and already contains landing/workforce route wrappers; do not create duplicate portals or move these routes without a route-by-route ownership review.
- Present: root `AGENTS.md`, root README, PRD, Blueprint, backlog, audit and ADR register. Root also contains `components/`, `hooks/`, `lib/`, `public/`, `src/`, `package.json`, and canonical Bun lockfile `bun.lock` (274,134 bytes; blob SHA `635cf4455bc8f37bafd73f4c6e82f77dd492da07`).
- Not present in the recursive tree: `apps/api/`, `apps/landing/`, `apps/workforce/`, `supabase/`, `packages/api-client/`, `packages/api-contracts/`, `packages/design-tokens/`, `workers/`, `services/`, `infrastructure/`.
- Root app contains Next.js route handlers for AI content generation, maps config and reverse geocoding. Direct source review confirms the AI handler invokes Google GenAI directly, hardcodes a model, and accepts tenantName from the request body. This violates the intended FastAPI gateway/server-resolved tenant boundary and is tracked for implementation remediation.
- Maps config GET handler may return the server-side GOOGLE_MAPS_API_KEY if the NEXT_PUBLIC key is absent; treat as a credential-exposure risk and move provider calls/configuration behind a restricted backend contract. A browser key must be separately referrer/API restricted.
- `package.json` declares Next.js `^15.4.9`, React `^19.2.1`, TypeScript `5.9.3`, Tailwind `4.1.11`, and `eslint-config-next` `16.0.8`; this Next/ESLint-config major mismatch requires compatibility review. `bun.lock` is the only root lockfile observed; no pnpm/npm/yarn lockfile was found. Full resolved dependency license/SBOM reconciliation remains open.
- Existing admin/corporate/AI workforce screens and portal modules remain the UI baseline; no redesign is authorized.

This is a structural inventory. It does not claim every source file has been line-by-line reviewed.

## 3. Domain and API ownership matrix (Phase 00 boundary proposal)

Canonical rule: browser portal → typed frontend API client → FastAPI `/api/v1` → domain application service → repository adapter → Supabase PostgreSQL. Direct frontend business writes are prohibited. Supabase Auth client may support identity/session flows only; authorization and tenant context are server-resolved.

| Portal / UI area | Domain ownership | Canonical API ownership (to be implemented) | Primary data boundary |
|---|---|---|---|
| Public Landing / partnership acquisition | Public catalogue, application, consent, lead qualification | Public read catalogue and partnership application endpoints | FastAPI public application services; persisted records in Supabase |
| Corporate / ISP | Tenant profile, contract/SOW, catalogue/order, workforce operations, finance views, reports, notifications | Tenant-scoped corporate endpoints; domain-specific routes under `/api/v1` | FastAPI + tenant-scoped PostgreSQL repositories |
| Human Workforce | Worker passport, onboarding, skills/certifications, availability, training, work orders, field evidence | Workforce self-service and operations endpoints | FastAPI identity/workforce domains |
| AI Workforce Management | Worker registry/studio, model policy, skills/tools, knowledge/RAG, memory, runs, workflows, approvals, budgets | AI workforce endpoints; AI invocation only via gateway/runtime | FastAPI AI Gateway, registry, memory, RAG and orchestration domains |
| Super Admin | Tenant operations, master data, RBAC, provider/model/skill governance, finance controls, security, audit, break-glass | Privileged admin endpoints with step-up/approval/audit policies | FastAPI control-plane services; privileged server-side access only |

**Cross-cutting owners:** Identity & Tenant; Authorization; Audit; Files/Storage; Notifications; Integrations; Event/Outbox; Observability.  
**Contract conventions:** `/api/v1`, typed Pydantic request/response schemas, generated OpenAPI, standard error envelope, cursor pagination, allowlisted filters/sorts, UTC timestamps, Decimal money, request/correlation/trace IDs, idempotency keys for sensitive commands.  
**Important:** exact endpoint paths and DTOs are to be specified by each phase contract; this matrix establishes ownership, not an assertion that endpoints already exist.

## 4. Existing design-token baseline

The current global CSS establishes a light, clean blue/azure visual system. Preserve and reuse these existing tokens rather than introducing a competing palette:
- Brand: sky-light `#ADD8E6`, sky `#87CEEB`, azure `#0284C7`, azure-hover `#0369A1`, navy `#17324D`, deep-blue `#245477`, muted-blue `#5F879E`.
- Surfaces: canvas `#F5F8FA`, default `#FFFFFF`, subtle `#EAF2F6`, sky `#E6F4F9`.
- Borders: default `#D8E3E9`, strong `#B8C9D3`.
- Text: primary `#172B3A`, secondary `#526675`, muted `#718391`, inverse `#FFFFFF`.
- Status/data colors: success `#247A55`, warning `#A96816`, danger `#B23A48`, info `#2D6F91`; data teal `#3B8C91`, amber `#C18A3A`, violet `#786A9C`, slate `#718391`.
- Radius: 6/10/14/20px; shadows use existing `--az-shadow-sm` and `--az-shadow-md`.
- Typography: Plus Jakarta Sans for UI; JetBrains Mono for tabular technical values.

Source: `app/globals.css` at the recorded Phase 00 snapshot. Component-specific button/form tokens still require component inventory.

## 5. Supabase live baseline (read-only)

- Project: `cwhjdnkotuhueeudpgeu`, `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`.
- No Agentzy application relations observed in `public`; project migration history empty.
- Supabase-managed schemas `auth`, `storage`, `realtime`, `vault` exist; their platform migrations are not Agentzy migrations.
- Installed extensions: `pg_stat_statements 1.11`, `pgcrypto 1.3`, `supabase_vault 0.3.2`, `uuid-ossp 1.1`, `vector 0.8.2`. PostGIS is available but not installed.
- No `pg_policies` rows observed for `public` or `storage`; no Storage buckets or objects; no Realtime publication tables or active subscriptions observed.
- Database setting observations: `row_security=on`, `ssl=on`, `statement_timeout=120000`, `default_transaction_isolation=read committed`.
- Event trigger `ensure_rls` is enabled for CREATE TABLE / CREATE TABLE AS / SELECT INTO and owned by postgres. It is attached to `public.rls_auto_enable()`.
- `public.rls_auto_enable()` is SECURITY DEFINER, owned by postgres; its ACL allows EXECUTE to PUBLIC, anon, authenticated, service_role and postgres. Security Advisor reports two WARN findings for anon/authenticated. Current audit confirms `ensure_rls` is enabled and bound to this function. Proposed disposition for review: preserve the event trigger/function, remove only unnecessary API execution grants for PUBLIC/anon/authenticated, and retain trigger operation. Do not apply until the privilege behavior is verified against the live event-trigger ownership and a controlled non-production reproduction; no ACL change has been made.
- Catalog inspection shows platform-owned objects and grants in managed schemas. Do not change platform-managed grants/policies as a shortcut for Agentzy setup.
- Auth users currently 0; Realtime subscriptions 0; Storage objects 0 (as observed in the project snapshot).

## 6. Outstanding audit limitations (explicit)

The connected Supabase tools expose project metadata, database catalogs, migrations, extensions and advisors, but this run has not obtained authoritative project-level configuration for:
- Auth provider enablement, redirect allowlists, password/MFA/SMTP/security settings (not exposed by the connected project metadata/catalog tools; requires Dashboard evidence or supported settings endpoint).
- Data API exposed schemas and API-level configuration (not exposed by the connected project metadata/catalog tools; requires Dashboard evidence or supported settings endpoint).
- Complete role/database ACL and default-privilege review across all objects, with provider-specific grant interpretation.
- Storage service-level configuration beyond catalogued buckets/policies.
- Full inventory of all database functions and triggers across every platform schema, beyond the public function and observed storage/realtime triggers.
- Environment secret values and external provider account settings (values must never be copied into repository documentation).

These are not marked complete. If the connector cannot expose a configuration category, record the dashboard evidence required rather than guessing.

## 7. Migration strategy decision

1. No migration is applied in Phase 00.
2. No synthetic M000 schema is generated from assumptions. M000 must be a reviewed baseline after reconciliation of Blueprint migration batches M000–M220 with live catalog state.
3. Migration source of truth: `supabase/migrations/`; sequential immutable timestamp/versioned files; one bounded, reviewable purpose per migration.
4. Additive expand → migrate/backfill → contract sequence; no drop/recreate database; no mutation of applied migrations; no manual untracked schema edits.
5. Every persisted-data phase includes constraints, indexes, RLS, grants, Storage/Realtime policy where relevant, rollback/recovery notes, migration ledger and remote version evidence.
6. RLS is enabled on tenant-owned tables. Tenant ID is never trusted from client input; resolve tenant/membership on server and enforce RBAC + ABAC + object-level checks in FastAPI and database.
7. Keep Supabase service-role keys and provider secrets server-side. Private Storage by default; signed URLs are short-lived and issued only after authorization.
8. Supabase-managed schemas/migration histories are excluded from Agentzy migration numbering.

## 8. Acceptance criteria and evidence checklist

| ID | Acceptance criterion | Evidence required | Status |
|---|---|---|---|
| P00-AC-01 | PRD/Blueprint/AGENTS authority and phase sequence are explicit. | Source references and repo governance docs | PARTIAL |
| P00-AC-02 | Repository tree and application boundaries inventoried. | Recursive tree SHA, count, path inventory | PARTIAL — structural tree captured; source-level review pending |
| P00-AC-03 | Dependency, license, environment-name, asset and design-token inventory complete. | Generated inventories, license reconciliation, token map | PARTIAL — CSS tokens and package/env names sampled; lockfile license and full asset inventory pending |
| P00-AC-04 | Portal-to-domain-to-API ownership agreed. | This matrix plus owner sign-off and route inventory | PARTIAL — proposed boundaries documented; endpoint inventory and owner sign-off pending |
| P00-AC-05 | Supabase schema, migration history, extensions, RLS, grants, functions, triggers, Storage and Realtime reviewed. | Read-only SQL outputs, advisor snapshots, config evidence | PARTIAL — project catalogs reviewed; configuration categories listed above open |
| P00-AC-06 | Security Advisor findings disposition approved. | Finding, impact analysis, remediation approval/commit and re-advisor evidence | OPEN |
| P00-AC-07 | ADR register aligned with Blueprint IDs and defaults. | `docs/adr/README.md` | COMPLETE — proposed choices remain explicitly open |
| P00-AC-08 | Migration strategy documented and reconciled with live DB. | Strategy plus M000–M220 reconciliation matrix | PARTIAL — strategy documented; batch-by-batch reconciliation pending |
| P00-AC-09 | Phase 00 Definition of Done evidence is complete. | Task checklist, commit SHA, API/permission/UI/observability artifacts where applicable | OPEN |
| P00-AC-10 | Phase 01 scope/dependencies are ready. | Approved Phase 01 scope and dependency list | OPEN |

## 9. Phase 00 completion rule

Phase 00 remains **IN PROGRESS** until all mandatory acceptance criteria are closed with inspectable evidence. No source code, Supabase schema, data, grants, policies, functions, project settings or migrations were changed by this read-only baseline record. No staging or real-world/UAT testing was performed.

## 8. Continuation evidence update — 2026-11-18

The current continuation evidence, including the resolved dependency inventory, environment-variable findings, asset metadata, Supabase Auth/Data API evidence gap, and `rls_auto_enable()` disposition is recorded in:

- `docs/phase-00/PHASE00_CONTINUATION_EVIDENCE_2026-11-18.md`
- `docs/phase-00/sbom/bun-lock.cdx.json` — 1,037 unique resolved package coordinates; license status remains `NOASSERTION` pending reconciliation.
- `docs/phase-00/ASSET_METADATA_INVENTORY_2026-11-18.md` — 31 raster assets, byte sizes, Git blob hashes, duplicate groups and targeted usage references; dimensions remain pending binary inspection.
- `docs/phase-00/FRONTEND_STRUCTURE_ALIGNMENT.md` — verified existing frontend folder mapping; backend/platform target paths unchanged.

A targeted security fix removed the server-only Maps key fallback from `app/api/config/maps/route.ts` (commit `00592945136770307b17d4e87b5db1ad112748c3`). No Supabase configuration, schema, ACL, policy, function or trigger was changed. Phase 00 remains IN PROGRESS and Phase 01 remains blocked on acceptance/sign-off.
