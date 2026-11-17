# AGENTZY — IMPLEMENTATION BACKLOG PER PHASE

Baseline: Master PRD v2.0 + Technical Implementation Blueprint v1.0
Repository: `fadliansyah36/Agentzy-platform`, branch `main`
Supabase project: `Agentzy-db` (`cwhjdnkotuhueeudpgeu`), connected and `ACTIVE_HEALTHY` on 2026-11-17. Live baseline inspection is in progress; connection does not authorize migrations.


> **Frontend structure authority:** Use [`docs/phase-00/FRONTEND_STRUCTURE_ALIGNMENT.md`](phase-00/FRONTEND_STRUCTURE_ALIGNMENT.md) for the verified existing frontend folder mapping. This corrects frontend folder references only; all prescribed backend/API and platform infrastructure paths remain unchanged.

## 1. Audit findings and blockers

**Phase 00 status: IN PROGRESS.** Governance artifacts are being finalized; repository/source, dependency/license, Supabase configuration and security acceptance gates remain open. See `docs/phase-00/BASELINE_EVIDENCE_AND_ACCEPTANCE.md`.

- Repository default branch is `main`; prior tree snapshot `a9482d864aa6683027bbec02321ca469f1251596` (282 entries) was refreshed 2026-11-18: recursive tree has 284 entries, `truncated=false`. See `docs/phase-00/VERIFIED_REPOSITORY_INVENTORY_2026-11-18.md` and `docs/phase-00/PHASE00_CONTINUATION_EVIDENCE_2026-11-18.md`.
- GitHub binding `link_6af361418a4481919cc84f9f7e0d522b` (account `fadliansyah36`) has repository write access; `main` updates are available. Branch protection is not enabled at the time of inspection.
- Existing UI modules are present under `apps/admin`, `apps/corporate`, and `apps/ai-workforce`; root `app/` contains public and workforce routes.
- No `apps/api/`, `supabase/`, `packages/api-client/`, `packages/api-contracts/`, `packages/design-tokens/`, `workers/`, `services/`, or `infrastructure/` found in the latest structural inventory. `app/` already contains root landing and workforce route wrappers; `docs/` and root `AGENTS.md` are present. Do not create duplicate portal folders.
- Existing portal hooks/services initialize `INITIAL_*` demo collections and local state. Replace these with real FastAPI API adapters incrementally.
- `app/api/ai-workforce/generate-content/route.ts` calls Google GenAI directly from Next.js, hardcodes model ID and accepts tenantName from request body; move to FastAPI AI Gateway with server-resolved tenant context.
- Next.js Maps handlers exist under `app/api/maps/` and `app/api/config/maps/`; audit/consolidate behind FastAPI adapters.
- `package.json` and canonical `bun.lock` were inventoried; the CycloneDX SBOM contains 1,037 unique resolved package coordinates. Automated proportionate Dependency & License Risk Review is implemented (`scripts/audit-dependency-licenses.mjs`, `.github/workflows/dependency-license-review.yml`, `docs/phase-00/DEPENDENCY_LICENSE_RISK_REVIEW.md`); workflow run `44138463292` reconciles all 1,037 coordinates (960 installed + 77 registry fallback; zero unresolved lookups). 988 license texts are bundled; 26 LGPL/MPL, 5 manual-expression and 40 missing-license-file findings remain for disposition. See `docs/phase-00/DEPENDENCY_LICENSE_FINDINGS_2026-11-18.md`. This is risk triage, not a formal legal audit. See the Phase 00 review document. Selected source files were scanned for environment references; the full tracked-source scan and deployment reconciliation remain open. Next.js 15 / eslint-config-next 16 mismatch requires compatibility review. See `docs/phase-00/VERIFIED_REPOSITORY_INVENTORY_2026-11-18.md`.
- Supabase binding `link_6afc797a7c44819192023bb809b8cae1` resolves the canonical project `cwhjdnkotuhueeudpgeu` (`ACTIVE_HEALTHY`, PostgreSQL 17.12). Initial live inspection confirms no application tables in `public`, no project migration entries, and no Storage buckets; platform-managed `auth`, `storage`, and `realtime` schemas must be distinguished from application-owned schema.

### Access status and tracked implementation gaps

| ID | Previous statement | Current verified status | Action / disposition |
|---|---|---|---|
| BLK-001 | GitHub connector read-only | **RESOLVED** — correct `fadliansyah36` binding has write access to `main`. | Use only the verified binding; commit evidence to `main`. |
| BLK-002 | Supabase ref not connected | **RESOLVED (access)** — canonical project is connected and `ACTIVE_HEALTHY`. | Complete full live baseline (schema, grants, RLS, functions, triggers, Auth, Storage, Realtime, Data API, advisors) before any migration. |
| BLK-003 | FastAPI backend absent | **OPEN — implementation gap**, not an access blocker. | Define architecture in Phase 00; create backend implementation in its approved phase. |
| BLK-004 | No Supabase migration source | **OPEN — repository gap**, not an access blocker. | Establish `supabase/migrations/` after live baseline and migration strategy approval; never invent an initial schema from assumptions. |
| BLK-005 | Local demo data paths | **OPEN — integration debt**. | Replace incrementally with typed FastAPI API clients; do not mask unavailable APIs with demo fallback. |

**Revision note (2026-11-17):** This section supersedes the stale access statements in the original audit snapshot. The detailed Phase 00 evidence and acceptance matrix is `docs/phase-00/BASELINE_EVIDENCE_AND_ACCEPTANCE.md`; Blueprint-aligned ADRs are in `docs/adr/README.md`. It does not claim Phase 00 complete and does not authorize schema changes.

## 2. Backlog task registry

| Task ID | Phase | Layer | Executable task | Initial status |
|---|---:|---|---|---|
| `AGZ-P00-GOV-001` | 00 — Product Governance & Repo Baseline | Governance | Audit repository, dependencies, env names, UI routes and source ownership; record baseline commit. | IN PROGRESS |
| `AGZ-P00-BE-001` | 00 — Product Governance & Repo Baseline | Backend | Define FastAPI modular-monolith boundaries and service skeleton plan; do not implement before audit decisions. | IN PROGRESS |
| `AGZ-P00-DB-001` | 00 — Product Governance & Repo Baseline | Migration | Inspect Supabase schema/history/extensions/RLS; M000 baseline only after canonical live state is fully inspected and reconciled. | IN PROGRESS |
| `AGZ-P00-API-001` | 00 — Product Governance & Repo Baseline | API contract | Inventory Next.js route handlers and define canonical `/api/v1` ownership. | IN PROGRESS |
| `AGZ-P00-PERM-001` | 00 — Product Governance & Repo Baseline | Permission | Inventory Auth/RLS/grants and create gap matrix; no speculative policy edits. | IN PROGRESS |
| `AGZ-P00-INT-001` | 00 — Product Governance & Repo Baseline | Integration | Map portal → domain service → database and external provider dependencies. | IN PROGRESS |
| `AGZ-P00-DOC-001` | 00 — Product Governance & Repo Baseline | Documentation | Prepare ADR index, AGENTS, backlog tracker and evidence template. | COMPLETE — ADR register and baseline evidence committed; Phase 00 itself remains open |
| `AGZ-P01-FE-001` | 01 — Platform Core, Identity & Tenant | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P01-BE-001` | 01 — Platform Core, Identity & Tenant | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P01-DB-001` | 01 — Platform Core, Identity & Tenant | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P01-API-001` | 01 — Platform Core, Identity & Tenant | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P01-PERM-001` | 01 — Platform Core, Identity & Tenant | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P01-INT-001` | 01 — Platform Core, Identity & Tenant | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P01-OBS-001` | 01 — Platform Core, Identity & Tenant | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P01-DOC-001` | 01 — Platform Core, Identity & Tenant | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P02-FE-001` | 02 — Public Landing & Partnership Acquisition | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P02-BE-001` | 02 — Public Landing & Partnership Acquisition | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P02-DB-001` | 02 — Public Landing & Partnership Acquisition | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P02-API-001` | 02 — Public Landing & Partnership Acquisition | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P02-PERM-001` | 02 — Public Landing & Partnership Acquisition | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P02-INT-001` | 02 — Public Landing & Partnership Acquisition | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P02-OBS-001` | 02 — Public Landing & Partnership Acquisition | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P02-DOC-001` | 02 — Public Landing & Partnership Acquisition | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P03-FE-001` | 03 — Corporate & Contract Management | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P03-BE-001` | 03 — Corporate & Contract Management | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P03-DB-001` | 03 — Corporate & Contract Management | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P03-API-001` | 03 — Corporate & Contract Management | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P03-PERM-001` | 03 — Corporate & Contract Management | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P03-INT-001` | 03 — Corporate & Contract Management | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P03-OBS-001` | 03 — Corporate & Contract Management | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P03-DOC-001` | 03 — Corporate & Contract Management | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P04-FE-001` | 04 — Human Workforce Passport & Onboarding | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P04-BE-001` | 04 — Human Workforce Passport & Onboarding | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P04-DB-001` | 04 — Human Workforce Passport & Onboarding | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P04-API-001` | 04 — Human Workforce Passport & Onboarding | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P04-PERM-001` | 04 — Human Workforce Passport & Onboarding | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P04-INT-001` | 04 — Human Workforce Passport & Onboarding | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P04-OBS-001` | 04 — Human Workforce Passport & Onboarding | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P04-DOC-001` | 04 — Human Workforce Passport & Onboarding | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P05-FE-001` | 05 — Sales CRM, Provider Catalogue & Order | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P05-BE-001` | 05 — Sales CRM, Provider Catalogue & Order | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P05-DB-001` | 05 — Sales CRM, Provider Catalogue & Order | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P05-API-001` | 05 — Sales CRM, Provider Catalogue & Order | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P05-PERM-001` | 05 — Sales CRM, Provider Catalogue & Order | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P05-INT-001` | 05 — Sales CRM, Provider Catalogue & Order | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P05-OBS-001` | 05 — Sales CRM, Provider Catalogue & Order | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P05-DOC-001` | 05 — Sales CRM, Provider Catalogue & Order | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P06-FE-001` | 06 — Affiliate Recruitment & Registration | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P06-BE-001` | 06 — Affiliate Recruitment & Registration | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P06-DB-001` | 06 — Affiliate Recruitment & Registration | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P06-API-001` | 06 — Affiliate Recruitment & Registration | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P06-PERM-001` | 06 — Affiliate Recruitment & Registration | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P06-INT-001` | 06 — Affiliate Recruitment & Registration | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P06-OBS-001` | 06 — Affiliate Recruitment & Registration | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P06-DOC-001` | 06 — Affiliate Recruitment & Registration | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P07-FE-001` | 07 — Commission Engine & Finance Ledger | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P07-BE-001` | 07 — Commission Engine & Finance Ledger | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P07-DB-001` | 07 — Commission Engine & Finance Ledger | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P07-API-001` | 07 — Commission Engine & Finance Ledger | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P07-PERM-001` | 07 — Commission Engine & Finance Ledger | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P07-INT-001` | 07 — Commission Engine & Finance Ledger | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P07-OBS-001` | 07 — Commission Engine & Finance Ledger | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P07-DOC-001` | 07 — Commission Engine & Finance Ledger | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P08-FE-001` | 08 — Technical Workforce & Field Operations | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P08-BE-001` | 08 — Technical Workforce & Field Operations | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P08-DB-001` | 08 — Technical Workforce & Field Operations | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P08-API-001` | 08 — Technical Workforce & Field Operations | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P08-PERM-001` | 08 — Technical Workforce & Field Operations | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P08-INT-001` | 08 — Technical Workforce & Field Operations | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P08-OBS-001` | 08 — Technical Workforce & Field Operations | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P08-DOC-001` | 08 — Technical Workforce & Field Operations | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P09-FE-001` | 09 — AI Platform Foundation & Gateway | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P09-BE-001` | 09 — AI Platform Foundation & Gateway | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P09-DB-001` | 09 — AI Platform Foundation & Gateway | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P09-API-001` | 09 — AI Platform Foundation & Gateway | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P09-PERM-001` | 09 — AI Platform Foundation & Gateway | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P09-INT-001` | 09 — AI Platform Foundation & Gateway | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P09-OBS-001` | 09 — AI Platform Foundation & Gateway | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P09-DOC-001` | 09 — AI Platform Foundation & Gateway | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P10-FE-001` | 10 — AI Worker Registry & Studio | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P10-BE-001` | 10 — AI Worker Registry & Studio | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P10-DB-001` | 10 — AI Worker Registry & Studio | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P10-API-001` | 10 — AI Worker Registry & Studio | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P10-PERM-001` | 10 — AI Worker Registry & Studio | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P10-INT-001` | 10 — AI Worker Registry & Studio | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P10-OBS-001` | 10 — AI Worker Registry & Studio | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P10-DOC-001` | 10 — AI Worker Registry & Studio | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P11-FE-001` | 11 — Skills, Tools & Knowledge/RAG | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P11-BE-001` | 11 — Skills, Tools & Knowledge/RAG | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P11-DB-001` | 11 — Skills, Tools & Knowledge/RAG | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P11-API-001` | 11 — Skills, Tools & Knowledge/RAG | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P11-PERM-001` | 11 — Skills, Tools & Knowledge/RAG | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P11-INT-001` | 11 — Skills, Tools & Knowledge/RAG | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P11-OBS-001` | 11 — Skills, Tools & Knowledge/RAG | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P11-DOC-001` | 11 — Skills, Tools & Knowledge/RAG | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P12-FE-001` | 12 — Memory Coordinator | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P12-BE-001` | 12 — Memory Coordinator | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P12-DB-001` | 12 — Memory Coordinator | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P12-API-001` | 12 — Memory Coordinator | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P12-PERM-001` | 12 — Memory Coordinator | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P12-INT-001` | 12 — Memory Coordinator | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P12-OBS-001` | 12 — Memory Coordinator | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P12-DOC-001` | 12 — Memory Coordinator | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P13-FE-001` | 13 — AI Runtime & Durable Run Lifecycle | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P13-BE-001` | 13 — AI Runtime & Durable Run Lifecycle | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P13-DB-001` | 13 — AI Runtime & Durable Run Lifecycle | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P13-API-001` | 13 — AI Runtime & Durable Run Lifecycle | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P13-PERM-001` | 13 — AI Runtime & Durable Run Lifecycle | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P13-INT-001` | 13 — AI Runtime & Durable Run Lifecycle | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P13-OBS-001` | 13 — AI Runtime & Durable Run Lifecycle | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P13-DOC-001` | 13 — AI Runtime & Durable Run Lifecycle | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P14-FE-001` | 14 — Workflow Orchestration & Human-AI Handoff | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P14-BE-001` | 14 — Workflow Orchestration & Human-AI Handoff | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P14-DB-001` | 14 — Workflow Orchestration & Human-AI Handoff | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P14-API-001` | 14 — Workflow Orchestration & Human-AI Handoff | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P14-PERM-001` | 14 — Workflow Orchestration & Human-AI Handoff | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P14-INT-001` | 14 — Workflow Orchestration & Human-AI Handoff | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P14-OBS-001` | 14 — Workflow Orchestration & Human-AI Handoff | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P14-DOC-001` | 14 — Workflow Orchestration & Human-AI Handoff | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P15-FE-001` | 15 — AI Workforce Role Catalogue & ISP Use Cases | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P15-BE-001` | 15 — AI Workforce Role Catalogue & ISP Use Cases | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P15-DB-001` | 15 — AI Workforce Role Catalogue & ISP Use Cases | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P15-API-001` | 15 — AI Workforce Role Catalogue & ISP Use Cases | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P15-PERM-001` | 15 — AI Workforce Role Catalogue & ISP Use Cases | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P15-INT-001` | 15 — AI Workforce Role Catalogue & ISP Use Cases | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P15-OBS-001` | 15 — AI Workforce Role Catalogue & ISP Use Cases | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P15-DOC-001` | 15 — AI Workforce Role Catalogue & ISP Use Cases | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P16-FE-001` | 16 — AI Credits Wallet, Top-up & Billing | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P16-BE-001` | 16 — AI Credits Wallet, Top-up & Billing | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P16-DB-001` | 16 — AI Credits Wallet, Top-up & Billing | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P16-API-001` | 16 — AI Credits Wallet, Top-up & Billing | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P16-PERM-001` | 16 — AI Credits Wallet, Top-up & Billing | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P16-INT-001` | 16 — AI Credits Wallet, Top-up & Billing | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P16-OBS-001` | 16 — AI Credits Wallet, Top-up & Billing | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P16-DOC-001` | 16 — AI Credits Wallet, Top-up & Billing | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P17-FE-001` | 17 — Corporate Intelligence & Realtime Analytics | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P17-BE-001` | 17 — Corporate Intelligence & Realtime Analytics | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P17-DB-001` | 17 — Corporate Intelligence & Realtime Analytics | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P17-API-001` | 17 — Corporate Intelligence & Realtime Analytics | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P17-PERM-001` | 17 — Corporate Intelligence & Realtime Analytics | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P17-INT-001` | 17 — Corporate Intelligence & Realtime Analytics | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P17-OBS-001` | 17 — Corporate Intelligence & Realtime Analytics | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P17-DOC-001` | 17 — Corporate Intelligence & Realtime Analytics | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P18-FE-001` | 18 — Notifications, Integrations & Enterprise Connections | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P18-BE-001` | 18 — Notifications, Integrations & Enterprise Connections | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P18-DB-001` | 18 — Notifications, Integrations & Enterprise Connections | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P18-API-001` | 18 — Notifications, Integrations & Enterprise Connections | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P18-PERM-001` | 18 — Notifications, Integrations & Enterprise Connections | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P18-INT-001` | 18 — Notifications, Integrations & Enterprise Connections | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P18-OBS-001` | 18 — Notifications, Integrations & Enterprise Connections | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P18-DOC-001` | 18 — Notifications, Integrations & Enterprise Connections | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P19-FE-001` | 19 — Super Admin Control Plane | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P19-BE-001` | 19 — Super Admin Control Plane | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P19-DB-001` | 19 — Super Admin Control Plane | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P19-API-001` | 19 — Super Admin Control Plane | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P19-PERM-001` | 19 — Super Admin Control Plane | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P19-INT-001` | 19 — Super Admin Control Plane | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P19-OBS-001` | 19 — Super Admin Control Plane | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P19-DOC-001` | 19 — Super Admin Control Plane | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P20-FE-001` | 20 — Cross-Portal Integration Completion | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P20-BE-001` | 20 — Cross-Portal Integration Completion | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P20-DB-001` | 20 — Cross-Portal Integration Completion | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P20-API-001` | 20 — Cross-Portal Integration Completion | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P20-PERM-001` | 20 — Cross-Portal Integration Completion | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P20-INT-001` | 20 — Cross-Portal Integration Completion | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P20-OBS-001` | 20 — Cross-Portal Integration Completion | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P20-DOC-001` | 20 — Cross-Portal Integration Completion | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P21-FE-001` | 21 — Data Governance & Operational Readiness | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P21-BE-001` | 21 — Data Governance & Operational Readiness | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P21-DB-001` | 21 — Data Governance & Operational Readiness | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P21-API-001` | 21 — Data Governance & Operational Readiness | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P21-PERM-001` | 21 — Data Governance & Operational Readiness | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P21-INT-001` | 21 — Data Governance & Operational Readiness | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P21-OBS-001` | 21 — Data Governance & Operational Readiness | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P21-DOC-001` | 21 — Data Governance & Operational Readiness | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P22-FE-001` | 22 — Final Verification, UAT, Staging & Release Gate | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P22-BE-001` | 22 — Final Verification, UAT, Staging & Release Gate | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P22-DB-001` | 22 — Final Verification, UAT, Staging & Release Gate | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P22-API-001` | 22 — Final Verification, UAT, Staging & Release Gate | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P22-PERM-001` | 22 — Final Verification, UAT, Staging & Release Gate | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P22-INT-001` | 22 — Final Verification, UAT, Staging & Release Gate | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P22-OBS-001` | 22 — Final Verification, UAT, Staging & Release Gate | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P22-DOC-001` | 22 — Final Verification, UAT, Staging & Release Gate | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |
| `AGZ-P23-FE-001` | 23 — Production Launch & Continuous Improvement | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | BLOCKED / NOT STARTED |
| `AGZ-P23-BE-001` | 23 — Production Launch & Continuous Improvement | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | BLOCKED / NOT STARTED |
| `AGZ-P23-DB-001` | 23 — Production Launch & Continuous Improvement | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | BLOCKED / NOT STARTED |
| `AGZ-P23-API-001` | 23 — Production Launch & Continuous Improvement | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | BLOCKED / NOT STARTED |
| `AGZ-P23-PERM-001` | 23 — Production Launch & Continuous Improvement | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | BLOCKED / NOT STARTED |
| `AGZ-P23-INT-001` | 23 — Production Launch & Continuous Improvement | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | BLOCKED / NOT STARTED |
| `AGZ-P23-OBS-001` | 23 — Production Launch & Continuous Improvement | Observability | Structured logs, metrics, traces, audit events and operational alerts. | BLOCKED / NOT STARTED |
| `AGZ-P23-DOC-001` | 23 — Production Launch & Continuous Improvement | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | BLOCKED / NOT STARTED |

## 3. Phase scopes and exit gates

### Phase 00 — Product Governance & Repo Baseline

**Scope:** Audit repo/dependencies/env/UI/routes; establish ADR, AGENTS, task tracker and live Supabase baseline.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 01 — Platform Core, Identity & Tenant

**Scope:** Supabase Auth, tenant/org/branch/department/membership, RBAC/ABAC, RLS, FastAPI auth dependencies, session lifecycle, audit.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 02 — Public Landing & Partnership Acquisition

**Scope:** Preserve landing/catalogue/FAQ/forms; public APIs, consent, anti-abuse, file quarantine, CRM prospect creation and notifications.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 03 — Corporate & Contract Management

**Scope:** Corporate/provider profiles, contracts/versions/SOW/SLA, service catalogue, approvals, entitlements, document storage and renewal.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 04 — Human Workforce Passport & Onboarding

**Scope:** Registration, identity verification, passport, engagement classification, skills/certifications, availability, training and onboarding.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 05 — Sales CRM, Provider Catalogue & Order

**Scope:** Provider/product catalogue, leads, customer consent, coverage abstraction, orders, authorized provider adapters, webhooks and reconciliation.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 06 — Affiliate Recruitment & Registration

**Scope:** Referral, invitation, application, identity/agreement/training verification, activation, attribution and fraud queue.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 07 — Commission Engine & Finance Ledger

**Scope:** Versioned schemes, accepted productivity events, deduplication, 60/40 attribution, deterministic Decimal calculations, immutable ledger, payout/reconciliation.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 08 — Technical Workforce & Field Operations

**Scope:** Work orders, dispatch, schedule, field evidence, checklist, QC, SLA, rework, offline queue and sync.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 09 — AI Platform Foundation & Gateway

**Scope:** Provider/model registry, AI Gateway, Model Router, prompts, tenant/data policy, metering, rate limits and budget guardrails.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 10 — AI Worker Registry & Studio

**Scope:** Templates, JD/objectives/KPI/SLA, supervisor, versions, skill/tool/memory bindings, autonomy, approvals and lifecycle.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 11 — Skills, Tools & Knowledge/RAG

**Scope:** Skill provenance/license/dependencies, resolver, tool schema/permission/sandbox, ingestion, pgvector, retrieval and citations.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 12 — Memory Coordinator

**Scope:** Eight memory types, consent, classification, scoped permissions, provenance, retention, expiry, deletion propagation and audit.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 13 — AI Runtime & Durable Run Lifecycle

**Scope:** AI Run API, steps/events, checkpoint, lease/heartbeat, timeout/cancel/retry/recovery, tool execution, artifacts and usage settlement.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 14 — Workflow Orchestration & Human-AI Handoff

**Scope:** Definition/version/publish, triggers, branches, parallel steps, AI/human nodes, approvals, handoff, timers, compensation and run monitor.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 15 — AI Workforce Role Catalogue & ISP Use Cases

**Scope:** ISP AI role templates, job contracts, allowed tools, KPI/evaluation, supervisor, budget and autonomy boundaries.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 16 — AI Credits Wallet, Top-up & Billing

**Scope:** Wallets, pricing, reserve/settle/refund ledger, top-up/payment, budgets/limits, statements and reconciliation.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 17 — Corporate Intelligence & Realtime Analytics

**Scope:** KPI definitions, aggregates, executive/sales/workforce/AI/finance/SLA analytics, freshness, ranking and reports.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 18 — Notifications, Integrations & Enterprise Connections

**Scope:** Notifications, email/messaging, provider/payment integrations, Google Workspace, Google Maps, SSO, credentials, sync/retry/replay protection.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 19 — Super Admin Control Plane

**Scope:** Tenant/provider/service/entitlement, workforce, LLM/model/skill/tool governance, credits/commission pricing, finance, security, audit and break-glass.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 20 — Cross-Portal Integration Completion

**Scope:** Shared identity/navigation/tenant context, onboarding/login, tasks/notifications, API/event consistency, remove mock/fallback/direct business writes.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 21 — Data Governance & Operational Readiness

**Scope:** Retention/deletion/DSR, finance close, backup/restore, incident escalation, ops dashboards, access review and vendor register.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 22 — Final Verification, UAT, Staging & Release Gate

**Scope:** Full E2E four portals, cross-tenant/RLS, reconciliation, workflow recovery, offline sync, load/security/accessibility, restore drill, staging and sign-off.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

### Phase 23 — Production Launch & Continuous Improvement

**Scope:** Controlled rollout, monitoring, incident response, SLA/cost review, support ownership and improvement backlog.

**Exit:** seluruh task applicable memiliki commit SHA, migration evidence bila ada, API/OpenAPI, permission/RLS, UI wiring ke backend, event/integration, observability, dokumentasi dan known limitations. Phase 22 menampung full UAT/staging/security/load/release gate; Phase 23 adalah controlled launch.

## 4. Public-to-portal workflow

1. Public landing/catalogue/FAQ reads published public catalogue APIs.
2. Partnership application creates prospect only; public callers cannot read internal prospect/CRM records.
3. Qualification → discovery → proposal/scope → legal/commercial review → contract/SOW.
4. Tenant onboarding provisions tenant, organization, entitlements, authorized admin membership and audit event.
5. Invitation/SSO activates identity; login resolves active membership, portal entitlement, tenant context, roles and permissions server-side.
6. Portal access: Corporate/ISP, Human Workforce, AI Workforce Management, Super Admin. Never trust a client-selected tenant or role.

## 5. FastAPI modular monolith domains

`identity`, `tenants`, `partnership`, `corporate`, `workforce`, `sales`, `affiliate`, `provider_integrations`, `technical_operations`, `commission`, `finance_billing`, `ai_credits`, `ai_gateway`, `model_router`, `ai_workers`, `skills_tools`, `memory`, `knowledge_rag`, `ai_runtime`, `workflow`, `analytics_kpi`, `notifications`, `google_workspace`, `google_maps`, `audit_security`.

## 6. Security and integration requirements

- IP detection: trust forwarding headers only from configured reverse proxies; record minimal IP/device/session risk metadata under retention policy.
- Google Workspace: least-privilege OAuth, tenant/user consent, encrypted credential references, refresh/revoke lifecycle and audit.
- Google Maps: restricted server-side keys, quota, consent, location minimization and retention.
- LLM: provider/model allowlist, tenant policy, data classification, residency, retention, capability, safety and budget checks before routing; all calls through AI Gateway.
- Memory: one coordinator for Working, Conversation, Long-term, Episodic, Semantic, Procedural, Organizational and Personal memory.
- Workflow: separate Workflow Definition/Run, Task, Human Assignment and AI Run; durable checkpoints, attempts, leases, retry, timeout, cancel, recovery and audit.
- Provider integrations must be authorized APIs/webhooks/partner portal/secure file exchange; no unauthorized scraping.

## 7. Migration discipline

Follow Blueprint migration batches M000–M220. For each phase: inspect live schema/history, reconcile, check duplicates/data impact, add RLS/grants/constraints/indexes, update API contracts, apply only to canonical Supabase project `cwhjdnkotuhueeudpgeu` after its live baseline is fully reviewed, and record version/actor/time/result. BLK-002 access is resolved; migration readiness remains a separate gate.

## 8. Test policy

During phases 00–21: minimum engineering checks only (lint/type-check, Python compile/import, migration consistency, OpenAPI/schema validation, static checks, focused deterministic unit checks). Full real-world testing, UAT, staging, load/security acceptance and production release gate remain in Phase 22.

## 9. Status and evidence

Allowed statuses: `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `READY FOR PHASE 22`, `DONE`, `DEFERRED`.

Every task records: owner, priority, dependency, commit SHA, changed paths, migration and remote evidence, endpoint/OpenAPI operation, permission/RLS, UI route/API binding, event/integration, observability, checks actually run, known limitations.

`DONE` requires evidence; never infer completion from UI screens, seed data, HTTP 200 or table existence.

## 10. Execution re-audit update — 2026-11-18

Latest verified evidence is recorded in docs/phase-00/PHASE00_REAUDIT_DELTA_2026-11-18.md. This update supersedes earlier recursive-tree counts in the backlog where they differ.

- GitHub main head at audit: 71bc1920afdec076f4818dc092a9fcdd4e417a46; recursive tree: 1,302 entries (101 directories, 1,201 files), truncated=false.
- Existing portal source remains in root app/ and apps/{admin,corporate,ai-workforce}; do not create duplicate portal folders.
- No apps/api/, supabase/, packages/api-client/, packages/api-contracts/, packages/design-tokens/, services/, workers/, or infrastructure/ exists in the current tree.
- Canonical Supabase project cwhjdnkotuhueeudpgeu remains ACTIVE_HEALTHY; Agentzy migration history is empty and public application relations remain absent.
- Read-only catalog recheck: zero public/storage policies, zero Storage buckets and objects, zero auth.users, supabase_realtime publication exists with no application tables attached, and installed extensions include vector 0.8.2.
- Security Advisor still reports two WARN findings for public.rls_auto_enable(); event trigger ensure_rls remains enabled. No database change was made.
- Performance Advisor returned no lints.

### Phase 00 task/status correction

Phase 00 remains IN PROGRESS. Connector access blockers are resolved, but this does not imply implementation or migration readiness.

| Gate | Current status | Remaining closure work |
|---|---|---|
| P00-AC-01 | PARTIAL | Final governance/sign-off evidence. |
| P00-AC-02 | PARTIAL | Complete source-level route/action/component ownership and environment scan. |
| P00-AC-03 | PARTIAL | Disposition 26 LGPL/MPL, 5 manual-expression and 40 missing-license-text records; verify asset dimensions/provenance/use and deployment environment names. |
| P00-AC-04 | PARTIAL | Complete portal screen/action → domain → API ownership and owner approval. |
| P00-AC-05 | PARTIAL | Obtain authoritative Auth/Data API/Storage configuration evidence and finish ACL/default-privilege review. |
| P00-AC-06 | OPEN | Resolve two Security Advisor WARNs and fail-open RLS event-trigger behavior through a reviewed, evidence-backed decision. |
| P00-AC-07 | COMPLETE | ADR register is aligned; selected future decisions remain open under their relevant phases. |
| P00-AC-08 | PARTIAL | Complete M000–M220 reconciliation and M000 sign-off. |
| P00-AC-09 | OPEN | Complete Phase 00 Definition of Done evidence. |
| P00-AC-10 | OPEN | Phase 01 readiness and sign-off. |

### Execution guard

No Phase 01 task may be marked IN PROGRESS until Phase 00 mandatory gates are signed off. No Phase 00 migration or synthetic M000 schema may be applied. Do not modify production Supabase ACL/function/trigger state while the event-trigger privilege semantics and approved remediation are unresolved. No staging, UAT, real-world, load, security-acceptance, or production release testing is permitted before Phase 22; minimum engineering checks remain mandatory during implementation.