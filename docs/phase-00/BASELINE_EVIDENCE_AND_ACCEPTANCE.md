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
- Existing application areas: `apps/admin/` (55 paths), `apps/corporate/` (49), `apps/ai-workforce/` (42), root `app/` (28).
- Present: root `AGENTS.md`, root README, PRD, Blueprint, backlog, audit and ADR register.
- Not present in the recursive tree: `apps/api/`, `apps/landing/`, `apps/workforce/`, `supabase/`, `packages/api-client/`, `packages/api-contracts/`, `packages/design-tokens/`, `workers/`, `services/`, `infrastructure/`.
- Root app contains Next.js route handlers for AI content generation, maps config and reverse geocoding. AI content handler was identified in prior source audit as directly invoking Google GenAI; this is a backend-boundary issue for the relevant implementation phase.
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

## 4. Supabase live baseline (read-only)

- Project: `cwhjdnkotuhueeudpgeu`, `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`.
- No Agentzy application relations observed in `public`; project migration history empty.
- Supabase-managed schemas `auth`, `storage`, `realtime`, `vault` exist; their platform migrations are not Agentzy migrations.
- Installed extensions: `pg_stat_statements 1.11`, `pgcrypto 1.3`, `supabase_vault 0.3.2`, `uuid-ossp 1.1`, `vector 0.8.2`. PostGIS is available but not installed.
- No `pg_policies` rows observed for `public` or `storage`; no Storage buckets or objects; no Realtime publication tables or active subscriptions observed.
- Database setting observations: `row_security=on`, `ssl=on`, `statement_timeout=120000`, `default_transaction_isolation=read committed`.
- Event trigger `ensure_rls` is enabled for CREATE TABLE / CREATE TABLE AS / SELECT INTO and owned by postgres. It is attached to `public.rls_auto_enable()`.
- `public.rls_auto_enable()` is SECURITY DEFINER; its function ACL allows EXECUTE to PUBLIC, anon, authenticated, service_role and postgres. Security Advisor reports two WARN findings for anon/authenticated. It enables RLS on newly created tables in public. Do not invoke manually. A privilege remediation needs reviewed impact analysis to ensure event-trigger behavior remains intact.
- Catalog inspection shows platform-owned objects and grants in managed schemas. Do not change platform-managed grants/policies as a shortcut for Agentzy setup.
- Auth users currently 0; Realtime subscriptions 0; Storage objects 0 (as observed in the project snapshot).

## 5. Outstanding audit limitations (explicit)

The connected Supabase tools expose project metadata, database catalogs, migrations, extensions and advisors, but this run has not obtained authoritative project-level configuration for:
- Auth provider enablement, redirect allowlists, password/MFA/SMTP/security settings.
- Data API exposed schemas and API-level configuration.
- Complete role/database ACL and default-privilege review across all objects, with provider-specific grant interpretation.
- Storage service-level configuration beyond catalogued buckets/policies.
- Full inventory of all database functions and triggers across every platform schema, beyond the public function and observed storage/realtime triggers.
- Environment secret values and external provider account settings (values must never be copied into repository documentation).

These are not marked complete. If the connector cannot expose a configuration category, record the dashboard evidence required rather than guessing.

## 6. Migration strategy decision

1. No migration is applied in Phase 00.
2. No synthetic M000 schema is generated from assumptions. M000 must be a reviewed baseline after reconciliation of Blueprint migration batches M000–M220 with live catalog state.
3. Migration source of truth: `supabase/migrations/`; sequential immutable timestamp/versioned files; one bounded, reviewable purpose per migration.
4. Additive expand → migrate/backfill → contract sequence; no drop/recreate database; no mutation of applied migrations; no manual untracked schema edits.
5. Every persisted-data phase includes constraints, indexes, RLS, grants, Storage/Realtime policy where relevant, rollback/recovery notes, migration ledger and remote version evidence.
6. RLS is enabled on tenant-owned tables. Tenant ID is never trusted from client input; resolve tenant/membership on server and enforce RBAC + ABAC + object-level checks in FastAPI and database.
7. Keep Supabase service-role keys and provider secrets server-side. Private Storage by default; signed URLs are short-lived and issued only after authorization.
8. Supabase-managed schemas/migration histories are excluded from Agentzy migration numbering.

## 7. Acceptance criteria and evidence checklist

| ID | Acceptance criterion | Evidence required | Status |
|---|---|---|---|
| P00-AC-01 | PRD/Blueprint/AGENTS authority and phase sequence are explicit. | Source references and repo governance docs | PARTIAL |
| P00-AC-02 | Repository tree and application boundaries inventoried. | Recursive tree SHA, count, path inventory | PARTIAL — structural tree captured; source-level review pending |
| P00-AC-03 | Dependency, license, environment-name, asset and design-token inventory complete. | Generated inventories, license reconciliation, token map | OPEN |
| P00-AC-04 | Portal-to-domain-to-API ownership agreed. | This matrix plus owner sign-off and route inventory | PARTIAL |
| P00-AC-05 | Supabase schema, migration history, extensions, RLS, grants, functions, triggers, Storage and Realtime reviewed. | Read-only SQL outputs, advisor snapshots, config evidence | PARTIAL — project catalogs reviewed; configuration categories listed above open |
| P00-AC-06 | Security Advisor findings disposition approved. | Finding, impact analysis, remediation approval/commit and re-advisor evidence | OPEN |
| P00-AC-07 | ADR register aligned with Blueprint IDs and defaults. | `docs/adr/README.md` | COMPLETE — proposed choices remain explicitly open |
| P00-AC-08 | Migration strategy documented and reconciled with live DB. | Strategy plus M000–M220 reconciliation matrix | PARTIAL — strategy documented; batch-by-batch reconciliation pending |
| P00-AC-09 | Phase 00 Definition of Done evidence is complete. | Task checklist, commit SHA, API/permission/UI/observability artifacts where applicable | OPEN |
| P00-AC-10 | Phase 01 scope/dependencies are ready. | Approved Phase 01 scope and dependency list | OPEN |

## 8. Phase 00 completion rule

Phase 00 remains **IN PROGRESS** until all mandatory acceptance criteria are closed with inspectable evidence. No source code, Supabase schema, data, grants, policies, functions, project settings or migrations were changed by this read-only baseline record. No staging or real-world/UAT testing was performed.
