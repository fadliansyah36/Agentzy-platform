# Agentzy — Architecture Decision Register

Baseline: Master PRD v2.0 and Technical Implementation Blueprint v1.0  
Repository: `fadliansyah36/Agentzy-platform`, branch `main`  
Status: Phase 00 register. IDs ADR-001–ADR-012 preserve the exact topics and order in Blueprint §18.

## Authority and change control

- Master PRD v2.0 controls product intent.
- Technical Implementation Blueprint v1.0 defines the proposed technical defaults.
- `AGENTS.md` is mandatory implementation policy.
- A proposed default is not automatically a final vendor/product selection. Record validation, alternatives, consequences, owner and evidence before marking it accepted.
- No ADR authorizes a Supabase migration by itself.

## Blueprint ADR register

| ID | Decision area (Blueprint wording) | Proposed default in Blueprint | Phase 00 disposition |
|---|---|---|---|
| ADR-001 | Monorepo tooling | Choose based on existing repo; avoid unnecessary migration. | **ACCEPTED** — retain existing monorepo; no tooling/repository migration without evidence and approved change. |
| ADR-002 | Modular monolith boundary | FastAPI modular monolith. | **ACCEPTED** — Python FastAPI modular monolith with bounded contexts, domain/application/infrastructure/API separation. |
| ADR-003 | Durable workflow engine | Temporal or equivalent after operational evaluation. | **OPEN** — evaluate operational ownership, durable recovery, cost and integration before Phase 13/14. |
| ADR-004 | Queue/broker | Select one managed/operable option; outbox is mandatory. | **OPEN** — compare options and deployment ownership; transactional outbox remains mandatory. |
| ADR-005 | Analytics serving | PostgreSQL aggregates initially; warehouse only with measured need. | **ACCEPTED AS DEFAULT** — start with PostgreSQL read models/aggregates; revisit with measured scale. |
| ADR-006 | Auth/SSO | Supabase Auth baseline; enterprise SSO as capability. | **ACCEPTED** — Supabase Auth baseline; tenant membership/entitlement/authorization resolved server-side; enterprise SSO remains a capability. |
| ADR-007 | Model provider strategy | Provider adapters behind AI Gateway. | **ACCEPTED** — all model calls through FastAPI AI Gateway and Model Router; provider-specific selection remains configurable. |
| ADR-008 | Embedding model | Versioned registry; dimensions must match pgvector schema. | **OPEN** — select model after privacy, language, residency, cost and retrieval requirements; version and dimension must be persisted. |
| ADR-009 | File scanning | Quarantine + malware scanning integration. | **ACCEPTED AS SECURITY REQUIREMENT** — private quarantine and scanning before release; provider/tool selection remains open. |
| ADR-010 | Payment provider | Choose after Indonesian commercial/settlement requirements review. | **OPEN** — no provider lock-in until settlement, refund, tax, fee and reconciliation review. |
| ADR-011 | Deployment platform | Align with existing infrastructure and operational ownership. | **OPEN** — inventory existing hosting/CI/CD/secrets/networking/observability and operational owner before selection. |
| ADR-012 | Design system | Shared tokens/components package across portals. | **ACCEPTED WITH PRESERVATION CONSTRAINT** — reuse and consolidate shared tokens/components without redesigning existing portal screens or regressing their styles. |

## Binding implementation constraints from PRD and AGENTS.md

These are governance requirements, not additional Blueprint ADR IDs:

1. Preserve existing UI/UX. Build missing components using the existing CSS, font, button, color and design-token system.
2. FastAPI is the business authority; Supabase PostgreSQL is the sole primary business database.
3. No duplicate database/source of truth, fake production data, silent demo fallback or direct frontend business writes.
4. REST API namespace `/api/v1`, typed Pydantic schemas, OpenAPI, standard error envelope, cursor pagination, UTC timestamps, Decimal money, trace IDs and idempotency for sensitive commands.
5. Tenant, membership, portal entitlement, roles and permissions resolve server-side; deny by default; enforce RBAC, ABAC and object-level authorization.
6. AI calls go through the FastAPI AI Gateway. RAG uses pgvector plus PostgreSQL full-text search unless a reviewed ADR changes it.
7. Workflow Definition, Workflow Run, Task, Human Assignment and AI Run remain distinct persisted entities with durable lifecycle, outbox and audit.
8. Migrations are ordered, additive, phase-scoped, and reconciled with live schema before application. Never mutate applied migrations or make untracked manual schema changes.
9. No staging or real-world/UAT testing before Phase 22. Minimum engineering checks still apply and must be reported truthfully.

## Phase 00 exit gates

- [ ] Repository source inventory and portal → domain → API ownership matrix complete.
- [ ] Dependency, license, environment-variable-name, route-handler and design-token inventories complete.
- [ ] Supabase live baseline complete: schema, migration history, extensions, grants/default privileges, RLS, functions, triggers/event triggers, Auth settings, Storage policies, Realtime publication and Data API exposure.
- [ ] `public.rls_auto_enable()` finding disposition approved with impact analysis; no unreviewed invocation or privilege mutation.
- [ ] PRD domain model and Blueprint migration batches M000–M220 reconciled with canonical live database.
- [ ] Migration sequencing, naming, ownership, rollback/recovery and evidence policy documented.
- [ ] Acceptance criteria and evidence matrix signed off; Phase 01 scope and dependencies ready.

## Canonical Supabase baseline — read-only inspection

Project: `Agentzy-db`, ref `cwhjdnkotuhueeudpgeu`, PostgreSQL 17.12, status `ACTIVE_HEALTHY`.

- Application-owned `public` relations: none observed; project migration history: empty.
- Platform-managed `auth`, `storage`, `realtime`, `vault` schemas are present and must not be mistaken for Agentzy application schema.
- Extensions observed: `pg_stat_statements 1.11`, `pgcrypto 1.3`, `supabase_vault 0.3.2`, `uuid-ossp 1.1`, `vector 0.8.2`; PostGIS availability is not an installation.
- No rows returned from `pg_policies` for `public` or `storage`; no Storage buckets/objects and no Realtime subscriptions/publication tables observed in queried catalog.
- Event trigger `ensure_rls` is enabled for CREATE TABLE / CREATE TABLE AS / SELECT INTO and owned by postgres. It executes the public SECURITY DEFINER event-trigger function `public.rls_auto_enable()`.
- Function ACL includes EXECUTE for PUBLIC, anon, authenticated, service_role and postgres. Security Advisor reports two WARN findings for anon/authenticated execution. Function currently enables RLS on new tables in public. Do not call it manually. Determine whether RPC exposure can be safely removed without affecting event-trigger execution, then remediate only through a reviewed change.
- Database roles, Auth provider settings, full Data API exposed-schema configuration and platform-managed grants require provider-aware final verification. Do not change Supabase-managed schema/table grants as part of Agentzy setup.

No database schema, data, policy, function, grant, setting or migration was modified during this Phase 00 read-only inspection.

## Evidence and sign-off

Each closed gate must reference a repository commit SHA and evidence document. Acceptance requires: task ID, criteria, source path, commit SHA, migration/remote evidence when applicable, API/OpenAPI contract, permission/RLS evidence, UI wiring evidence, event/observability evidence, documentation, and actual engineering-check results. Phase 00 must not be marked complete while any required gate above is unchecked.
