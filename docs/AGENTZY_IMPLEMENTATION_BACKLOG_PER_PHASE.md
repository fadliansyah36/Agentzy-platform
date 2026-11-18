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
| `AGZ-P01-FE-001` | 01 — Platform Core, Identity & Tenant | Frontend integration | Wire existing UI to typed API clients; preserve design; implement loading/empty/error/denied/stale/offline states. | IN PROGRESS |
| `AGZ-P01-BE-001` | 01 — Platform Core, Identity & Tenant | Backend | Implement domain entities, application services/use cases, repositories/adapters and state transitions. | IN PROGRESS |
| `AGZ-P01-DB-001` | 01 — Platform Core, Identity & Tenant | Migration | Add phase-scoped Supabase migration after live-schema diff; include constraints, indexes, RLS/grants and recovery notes. | IN PROGRESS |
| `AGZ-P01-API-001` | 01 — Platform Core, Identity & Tenant | API contract | Implement `/api/v1` routes, Pydantic schemas, OpenAPI, pagination, standard errors, trace IDs and idempotency. | IN PROGRESS |
| `AGZ-P01-PERM-001` | 01 — Platform Core, Identity & Tenant | Permission | Define permission keys, RBAC/ABAC, object-level authorization, RLS, Storage and Realtime policies. | IN PROGRESS |
| `AGZ-P01-INT-001` | 01 — Platform Core, Identity & Tenant | Integration/events | Implement outbox/events, authorized provider adapters, retries, replay protection and idempotent consumers. | IN PROGRESS |
| `AGZ-P01-OBS-001` | 01 — Platform Core, Identity & Tenant | Observability | Structured logs, metrics, traces, audit events and operational alerts. | IN PROGRESS |
| `AGZ-P01-DOC-001` | 01 — Platform Core, Identity & Tenant | Documentation | Update domain README, API contract, migration ledger, phase evidence and known limitations. | IN PROGRESS |
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

## 11. Portal source verification delta — 2026-11-18

Detailed evidence: docs/AGENTZY_SOURCE_CODE_DEEP_DIVE_AUDIT_2026-11-17.md and docs/phase-00/BASELINE_EVIDENCE_AND_ACCEPTANCE.md.

- Super Admin hook initializes isAuthenticated=true, a fixed platform_super_admin role/email, and local INITIAL_* collections. Its inspected service returns local constants; no fetch() or Supabase client integration was found in the inspected hook/service.
- Corporate hook initializes isAuthenticated=true and a client-selected first tenant, with local domain collections. The inspected service returns static records and hard-coded executive metrics; no fetch() or Supabase client integration was found in the inspected hook/service.
- AI Workforce hook initializes workers/providers/skills/tools/memory/knowledge/workflows/runs/approvals/handoffs/tasks from INITIAL_* constants. It calls the existing Next.js generate-content route; that route still invokes Google GenAI directly and trusts tenantName from request JSON.
- Existing portal services and UI must be migrated action-by-action to typed FastAPI endpoints after Phase 01 identity/tenant/RBAC foundations. Keep existing components and CSS; do not wire business writes directly to Supabase from the browser.
- The targeted source scan is not a full 125-file source audit and does not close P00-AC-02 or P00-AC-04.

These findings are implementation requirements, not authorization to bypass phase order. Phase 00 remains IN PROGRESS; Phase 01 remains blocked on Phase 00 sign-off.

## 12. Implementation continuation — Phase 01 foundation started (2026-11-18)

**Execution decision:** Following the project owner's explicit direction, baseline discovery is kept proportional to implementation. The absence of application tables, Auth users, Storage buckets and migration history is the greenfield starting condition, not a reason to repeat broad audits. Remaining configuration/security findings are tracked and addressed when the relevant capability is implemented; no destructive cleanup or speculative changes to the pre-existing Supabase event trigger are authorized.

### Delivered foundation artifacts

- apps/api/ created as the Python 3.12+ FastAPI modular monolith, with settings, Supabase JWT verification (JWKS / configured legacy HS256), SQLAlchemy async session, request correlation, CORS configuration and /health.
- Initial authenticated API contracts/routes: GET /api/v1/me, GET /api/v1/tenants, GET /api/v1/tenants/{tenant_id}/organizations.
- Direct Postgres requests set transaction-local JWT claims and switch to the authenticated role so database RLS remains in force; no service-role key is placed in frontend code.
- apps/web/lib/api-client.ts added as the typed frontend transport boundary; no UI redesign and no fake API fallback.
- Supabase migration 20261117175948_phase_01_platform_core_identity_tenant applied to canonical project. It creates profiles, tenants, organizations, memberships, roles, permissions, role_permissions, membership_roles and audit_logs; adds indexes, RLS policies and a minimal permission catalogue. No demo tenant, user, balance, transaction or business sample rows were seeded.
- Remote migration history confirms version 20261117175948; read-only catalog query confirms all nine application tables exist with RLS enabled.

### Current status and limits

Phase 01 is IN PROGRESS, not complete. Only platform identity/tenant foundations are delivered. Existing portal hooks/services still contain local INITIAL_* data and fixed authentication defaults; the typed API client is not yet wired through every screen/action. Remaining Phase 00 inventory and Supabase configuration evidence will be completed just-in-time where they affect security or the next migration, rather than used as an open-ended blocker.

No staging, UAT, real-world, load, security acceptance or production release test was run. Runtime/build/lint checks have not yet been executed in this continuation. The next work is to connect the existing login/session lifecycle to Supabase Auth and FastAPI identity/tenant resolution, then replace each portal's demo service boundary with real domain APIs.


## 13. Greenfield implementation continuation — identity, tenant and access (2026-11-18)

The project owner clarified that the empty Supabase application schema, empty Auth user set and absent Storage buckets are intentional greenfield conditions. Do not repeat broad discovery as a substitute for building the system. Continue only targeted checks needed to protect each migration and permission boundary. Existing ensure_rls event-trigger remediation remains a separately tracked security decision; new application tables explicitly enable RLS in their migrations.

### Supabase migrations applied

| Version | Scope |
|---|---|
| 20261117175948 | Profiles, tenants, organizations, memberships, roles, permissions, role_permissions, membership_roles, audit_logs; explicit RLS policies and read grants. |
| 20261117181011 | System role templates, 45 permission keys, 134 role-permission grants and Auth user profile trigger. |
| 20261117182410 | Profile email projection and Auth profile synchronization on insert/update. |

Read-only remote evidence after migration: 9/9 core tables have RLS enabled; 15 system role templates; 45 permission keys; 134 role-permission grants; Auth profile trigger present; profile email column present. Auth user count remains zero because no first administrator has been invited yet. No sample tenants or users were seeded.

### Implemented backend and frontend integration

- FastAPI modular monolith in apps/api/, Supabase JWT verification, transaction-local JWT claim propagation, authenticated database role for user-scoped reads, request IDs and CORS.
- Identity API returns active memberships, role keys and effective permission keys.
- Tenant API supports membership-scoped listing and permission-checked organization reads.
- Management API supports platform tenant directory, create/update/archive, organization creation, role catalogue, tenant membership listing and Supabase Auth invitations. Platform-wide administrative operations require aal2.
- One-time bootstrap endpoint and UI invite the first platform_super_admin; service-role and bootstrap secrets remain backend-only.
- Super Admin login uses real Supabase email/password and TOTP MFA; dedicated MFA enrollment screen enforces aal2 before portal access.
- Corporate and AI Workforce logins use Supabase sessions; tenant switchers are populated only from active membership and the relevant permission keys.
- Corporate organization view now reads and creates organization units through FastAPI. Corporate member list/invitations use the membership API.
- Super Admin tenant directory and create/update/archive actions use FastAPI.
- Local INITIAL_* demo collections for Admin, Corporate and AI Workforce were removed from the portal initialization paths touched in this tranche. Unprovisioned domain areas show empty/unconfigured states rather than seeded production-like records.
- Existing CSS and design tokens are preserved; no portal redesign was introduced.

### Current phase state

Phase 01 remains IN PROGRESS. The identity/tenant/RBAC foundation is implemented, but end-to-end readiness is not claimed. Remaining work includes API service deployment and secret configuration, first-admin bootstrap execution, live Supabase Auth redirect configuration for the final production domain, remaining portal domain API integration, role-catalogue wiring in all management screens, and engineering static checks.

No staging, UAT, real-world acceptance, load testing, security acceptance or production release test was run. Do not mark Phase 01 complete until those implementation items and its acceptance evidence are closed. Phase 22 remains the first full staging/UAT/load/security acceptance gate.


## 14. Identity/RBAC integration delta — 2026-11-18

- Added canonical Supabase CLI project config at supabase/config.toml with project ref, PostgreSQL 17 and email-invitation-only Auth defaults. Production redirect domains still require the final frontend hostname.
- Added a Dockerfile for the FastAPI service. Deployment is not yet configured because no Agentzy API runtime/hostname has been selected or supplied.
- Added permission-guarded tenant CRUD, tenant directory, organization creation, membership listing/invitation and role-catalogue endpoints. Platform-wide operations require JWT aal2; sensitive tenant role assignment is restricted to the tenant owner or an aal2 platform membership administrator.
- Corporate tenant member directory now uses the FastAPI membership API; invite actions call Supabase Auth through the backend and assign a validated role template. Organization structure now reads and creates tenant organization units through FastAPI.
- Admin tenant directory and create/update/archive actions use FastAPI; platform directory calls wait until the session reaches aal2.
- AI Workforce and Corporate tenant selectors are derived from backend membership and permission results. Client-side role switching was removed from Super Admin.
- Login surfaces no longer contain sample credentials or client-only authentication bypasses. First-admin bootstrap and TOTP enrollment screens are available at /bootstrap and /mfa-setup.
- Read-only Supabase evidence: 9 core tables, all 9 with RLS enabled; 15 role templates; 45 permissions; 134 role-permission grants; Auth profile trigger and profile email projection present; zero Auth users (expected until bootstrap invitation is executed).
- Static build/type/lint checks have not been run in this continuation. No staging, UAT, real-world, load, security acceptance or production release testing has been run.
- Remaining Phase 01 gates: configure and deploy the FastAPI service with DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY and PLATFORM_BOOTSTRAP_TOKEN; configure frontend API URL and Supabase publishable key; configure production Auth redirect URL and SMTP; execute first-admin bootstrap and enroll TOTP; complete remaining domain API integrations and run minimum deterministic engineering checks. Phase 01 remains IN PROGRESS.


## 15. Live-state reconciliation after identity foundation — 2026-11-18

Evidence is recorded in `docs/phase-00/PHASE00_CONTINUATION_EVIDENCE_2026-11-18.md` (updated commit `90d55ec00256be32ec9e5e51fb5e51310ab9421c`).

- Supabase project `cwhjdnkotuhueeudpgeu` is `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`.
- Remote migration history confirms three applied versions: `20261117175948`, `20261117181011`, `20261117182410`.
- Read-only live catalog: 9 public application tables; 9/9 have RLS enabled; 15 system role templates; 45 permission keys; 134 role-permission grants; zero Auth users; zero Storage buckets.
- Security Advisor still reports two WARN findings for `public.rls_auto_enable()` executable by `anon` and `authenticated`. No function, ACL, trigger, or schema change was made.
- Performance Advisor reports five INFO findings for unindexed foreign keys and seven INFO findings for unused indexes. Review workload and query plans before any index changes; unused-index findings are not deletion instructions.
- API runtime deployment, private backend secrets, frontend production environment, Supabase Auth redirect/SMTP/provider settings, first-admin bootstrap and TOTP enrollment remain unconfigured/unverified.
- Static build/type/lint and Python compile/import checks remain NOT RUN. No staging, UAT, real-world, load, security-acceptance or production-release testing was run.

**Phase guard:** Phase 00 remains IN PROGRESS and unsigned. The already-applied identity foundation migrations are existing implementation state and do not waive Phase 00 exit acceptance. Do not start additional Phase 01 domain scope until Phase 00 readiness is signed off. Do not claim Phase 01 complete.


## 16. Phase 01 pre-implementation readiness review — 2026-11-18

Read-only findings are recorded in `docs/phase-00/PHASE00_CONTINUATION_EVIDENCE_2026-11-18.md`, §10 (commit `19a8aa6ad06434d4c16043f14df3887f9f0b1ba1`). This is an audit of existing Phase 01 foundation code and live schema; it does not authorize starting additional Phase 01 tasks ahead of Phase 00 sign-off.

### Existing foundation (not a Phase 01 completion claim)

- Three remote migrations exist and match the three committed Phase 01 migration files.
- Nine application tables have RLS enabled; 15 system role templates, 45 permission keys and 134 role-permission grants exist.
- FastAPI routes currently cover `/me`, tenant list/directory/CRUD, organization list/create, membership invite/list, role catalogue and first-admin bootstrap.
- Browser Auth currently covers password sign-in, Google OAuth, sign-out, session restoration and MFA assurance flow.

### Confirmed acceptance gaps

- Auth registration/invite acceptance, email verification callback/resend, password recovery/update and profile update are missing.
- Server-side revoked-session validation via JWT `session_id` / `auth.sessions` is missing.
- Tenant settings, organization update/archive, dedicated branch/department API operations, membership acceptance/update/suspend/revoke, role assignment lifecycle, permission catalogue/access evaluation, audit-log and security-event APIs are missing.
- ABAC and organization/branch/department object scoping are not consistently enforced; database composite constraints do not prevent cross-tenant parent/org/role relationships.
- Privileged database operations use a separate database-engine connection after API-level authorization checks; the database privilege boundary requires a reviewed least-privilege repository role.
- Remote SQL evidence shows `anon` and `authenticated` have all table privileges on all nine Phase 01 tables, and global `public` default table/sequence ACLs grant all privileges to `anon`, `authenticated` and `service_role` for postgres/supabase_admin-created objects. RLS is enabled but does not replace least-privilege grants. Do not modify production ACL/default privileges until the Phase 00 `rls_auto_enable()` event-trigger privilege review is resolved and approved.
- Existing portal integration is selective; it is not verified across every screen/action. Audit/security event coverage and cursor pagination are incomplete.
- API runtime, secrets, production Auth configuration, bootstrap/TOTP and minimum static engineering checks remain outstanding.

**Current Phase 01 disposition: PARTIAL / BLOCKED — not DONE.** The Phase 00 execution guard remains in force: no Phase 01 task may be marked IN PROGRESS until Phase 00 mandatory gates are signed off. No code/schema/configuration was changed during this read-only review; only this evidence record was added. No staging/UAT/real-world/load/security-acceptance/release test was run.


## 17. Phase 00 closure re-audit — 18 November 2026

The authoritative current evidence is `docs/phase-00/PHASE00_CLOSURE_READINESS_REAUDIT_2026-11-18.md`. This re-audit supersedes older empty-schema/empty-migration-history statements where they conflict with the current live state.

### Current repository / Supabase facts

- Pre-audit `main` HEAD: `4d3db7b36df411aefc5ad81aaa04e5892d99493c`; recursive tree 1,350 entries, `truncated=false`.
- Supabase `Agentzy-db` is `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`.
- Three Phase 01 migrations are present in both source and remote history. Nine public Agentzy tables exist and RLS is enabled on all nine. Current live catalogue includes 15 system roles, 45 permission keys and 134 role-permission links. Auth users: 0; Storage buckets: 0.
- Current `public.rls_auto_enable()` remains SECURITY DEFINER, publicly executable and fail-open on exception. Security Advisor retains two WARN findings. No production security change was applied.
- Current public table grants and default privileges are broader than least privilege. Auth provider/security/SMTP/redirect/MFA settings and hosted Data API exposed schemas remain unverified.

### Gate status after re-audit

| Gate | Status | Closure requirement |
|---|---|---|
| P00-AC-01 | PARTIAL | Product/Engineering sign-off |
| P00-AC-02 | PARTIAL | Full screen, control, form, hook, service and action inventory with API mapping |
| P00-AC-03 | PARTIAL | Resolve 26 LGPL/MPL, 5 manual-expression and 40 missing-license-file package findings; record approved provenance for all 31 raster assets |
| P00-AC-04 | PARTIAL | Approve canonical API/domain/permission/database owner for each action |
| P00-AC-05 | PARTIAL / BLOCKED | Obtain authoritative hosted Auth/Data API evidence and approve/apply least-privilege configuration |
| P00-AC-06 | BLOCKED | Resolve fail-open event-trigger behavior and two Security Advisor WARN findings with verified safe remediation |
| P00-AC-07 | COMPLETE | ADR register exists; future ADR decisions remain phase-owned |
| P00-AC-08 | PARTIAL | M000 audit-only; M010 applied via three migrations; M020–M220 not applied and mapped to their future phases; approval remains pending |
| P00-AC-09 | PARTIAL | Final DoD checklist documented; formal approval pending |
| P00-AC-10 | BLOCKED / NOT APPROVED | Explicit Product Owner readiness approval after all other gates close |

### Execution guard

Do not mark Phase 00 CLOSED and do not start additional Phase 01 coding. Existing applied M010 migrations are recorded as live state only; they do not waive Phase 00 gates. Build/lint/type-check, Python compile/import, migration consistency and OpenAPI checks were not run in this re-audit and must not be represented as passed. No staging, UAT, real-world, load, security-acceptance or production-release testing was run.


## 18. Phase 00 continuation — remediation, inventory and engineering checks

Evidence pack:
- `docs/phase-00/RLS_SECURITY_REMEDIATION_2026-11-18.md`
- `docs/phase-00/LICENSE_ASSET_PROVENANCE_DISPOSITION_2026-11-18.md`
- `docs/phase-00/SCREEN_ACTION_API_DOMAIN_INVENTORY_2026-11-18.md`
- `docs/phase-00/ENGINEERING_CHECKS_REPORT_2026-11-18.md`
- `docs/phase-00/PHASE00_RESIDUAL_RISK_REGISTER_2026-11-18.md`

### Current outcomes

| Area | Status | Evidence / next action |
|---|---|---|
| RLS helper and event trigger | BLOCKED | PostgreSQL 17 event-trigger privilege behavior reviewed; fail-closed SQL draft and revoke plan documented. No production change applied because Supabase CLI, verified recovery point and managed-build post-change verification are unavailable. |
| Security Advisor 0028 / 0029 | BLOCKED | Both WARN findings were still present at 2026-11-18T02:34:49Z. |
| Supabase Auth/Data API settings | BLOCKED | Hosted provider/SMTP/password/MFA/session/redirect and exposed-schema settings are not available through the current Supabase connector; owner Dashboard evidence required. |
| Grants/default privileges | BLOCKED | Broad grants remain live; target matrix and residual risk recorded. No blanket REVOKE applied. |
| License exceptions/assets | BLOCKED | 1,037 package coordinates reconcile. 26 LGPL/MPL, 5 manual and 40 missing-license-file findings need owner/legal review; all 31 assets still lack complete provenance/rights evidence. |
| Screen/action inventory | PARTIAL | 11 page/layout routes, 3 Next.js API handlers, portal view modules and API ownership mapped. Callback-level button/form/hook tracing remains incomplete. |
| Definition of Done | PENDING APPROVAL | DoD checklist in closure re-audit report; Product Owner/Engineering Lead approval required. |
| Engineering checks | PARTIAL / FAILURES RECORDED | CI run 44224158408: migration source consistency PASS; Python compile PASS; Ruff FAIL (101 findings); Bun frozen install FAIL because package.json adds @supabase/supabase-js absent from bun.lock; OpenAPI, ESLint and TypeScript were skipped. |
| Phase 01 readiness | NOT APPROVED | Phase 01 remains prohibited; no readiness approval requested or assumed. |

### Execution boundary

Only the Phase 00 engineering-check workflow and documentation were added. No Phase 01 feature implementation, frontend UI redesign, Supabase migration, DDL, grant, policy, function, event-trigger, Auth/Storage setting, deployment or business data change was performed. Do not mark Phase 00 CLOSED.


## Phase 01 implementation progress — 2026-11-18

Phase 01 is **IN PROGRESS**. Phase 00 remains **IN PROGRESS** and is being tracked in parallel; it is not an entry gate for this implementation. Phase 00 is not declared closed. No Phase 02 work is authorized.

The 2026-11-17 repository audit is a historical snapshot. The current main branch contains `apps/api/`, shared portal auth hooks, and three Phase 01 migrations; the live Supabase project contains nine existing public tables. The current repository and live database baseline take precedence over older structural observations.

| Task ID | Description | Owner | Priority | Dependency | Status | Commit SHA | Changed Paths | Migration Evidence | API/OpenAPI | Permission/RLS | Frontend Wiring | Audit/Observability | Engineering Checks | Known Limitations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AGZ-P01-FE-001 | Shared identity, session, invitation activation and Workforce route gate | Agentzy Engineering | P0 | Supabase Auth + FastAPI | IN PROGRESS | db5318fbca7816f3e57960394ccebca5cf46711b; 4ba07728bc2f81eefb11e9219f52be837d86826d; d5ffb7954ef160c755c9acbffb559348a1bf9671; ecbac30e8e21566a27043a9a07c5e62467732aad | apps/web/lib/auth/useAgentzyAuth.ts; apps/web/lib/api-client.ts; components/workforce/* | M010 source required before runtime | Identity/tenant endpoints wired in shared client; PASS — run 44248766881 (commit 4ba0772); final Workforce guard commit ecbac30 not separately rerun | Permission-aware Workforce role gate; other portal/domain UI wiring remains partial | Server revocation invoked on logout | PASS — run 44248766881 (commit 4ba0772); final Workforce guard commit ecbac30 not separately rerun | Pre-existing Workforce demo/local operational data remains in source but is hidden from the production rendering path pending domain API integration |
| AGZ-P01-BE-001 | Identity, tenant context, hierarchy and membership lifecycle | Agentzy Engineering | P0 | Live schema baseline | IN PROGRESS | db5318fbca7816f3e57960394ccebca5cf46711b; 4ba07728bc2f81eefb11e9219f52be837d86826d; d5ffb7954ef160c755c9acbffb559348a1bf9671; ecbac30e8e21566a27043a9a07c5e62467732aad | apps/api/app/core/*; apps/api/app/api/v1/routes/* | M010 source required before runtime | /me, profile, invitations, membership, hierarchy | Shared context and object scope checks added | Existing admin/corporate/AI hooks retained; Workforce gate added | Sensitive mutations write audit_logs | PASS — run 44248766881 (commit 4ba0772); final Workforce guard commit ecbac30 not separately rerun | ABAC policy conditions and full lifecycle coverage remain partial |
| AGZ-P01-DB-001 | Additive hierarchy, session revocation, role scope and grants/RLS migration | Agentzy Engineering | P0 | Verified backup/recovery and migration review | IN PROGRESS | db5318fbca7816f3e57960394ccebca5cf46711b; 4ba07728bc2f81eefb11e9219f52be837d86826d; d5ffb7954ef160c755c9acbffb559348a1bf9671; ecbac30e8e21566a27043a9a07c5e62467732aad | supabase/migrations/20261118130000_m010_phase_01_identity_tenant_completion.sql | Source authored only; NOT applied to Agentzy-db | OpenAPI depends on M010 being applied before API deployment | Explicit SELECT-only client grants and tenant policies authored; fail-closed RLS trigger authored | Not applicable | Advisor/catalog recheck pending | No verified backup/PITR evidence; migration deliberately not applied |
| AGZ-P01-API-001 | Identity, permission registry, role permissions and tenant hierarchy APIs | Agentzy Engineering | P0 | M010 schema | IN PROGRESS | db5318fbca7816f3e57960394ccebca5cf46711b; 4ba07728bc2f81eefb11e9219f52be837d86826d; d5ffb7954ef160c755c9acbffb559348a1bf9671; ecbac30e8e21566a27043a9a07c5e62467732aad | apps/api/app/api/v1/router.py; routes/identity.py; routes/management.py; routes/tenants.py; routes/tenant_structure.py | M010 required | New /me, /me/permissions, session/invitation, /permissions, role-permission and hierarchy contracts; PASS — run 44248766881 (commit 4ba0772); final Workforce guard commit ecbac30 not separately rerun | Route-level permission and object scope checks partial | Existing UI clients extended | Audit events on profile/session/membership/organization operations | PASS — run 44248766881 (commit 4ba0772); final Workforce guard commit ecbac30 not separately rerun | Full OpenAPI acceptance and remaining CRUD/pagination not complete |
| AGZ-P01-PERM-001 | Central RBAC/ABAC/object authorization and least privilege | Agentzy Engineering | P0 | M010 + live schema | IN PROGRESS | db5318fbca7816f3e57960394ccebca5cf46711b; 4ba07728bc2f81eefb11e9219f52be837d86826d; d5ffb7954ef160c755c9acbffb559348a1bf9671; ecbac30e8e21566a27043a9a07c5e62467732aad | apps/api/app/core/authorization.py; security.py; M010 | M010 source only | Scoped role resolution, deny-by-default helpers, object checks | Read-only client grants; new tenant policies; existing live grants unchanged until migration | Workforce role gate | Authorization test source added | PASS — run 44248766881 (commit 4ba0772); final Workforce guard commit ecbac30 not separately rerun | Dynamic access-policy condition evaluator and full route coverage remain partial |
| AGZ-P01-INT-001 | Session revocation, invitation acceptance and membership transitions | Agentzy Engineering | P0 | M010 + Supabase Auth | IN PROGRESS | db5318fbca7816f3e57960394ccebca5cf46711b; 4ba07728bc2f81eefb11e9219f52be837d86826d; d5ffb7954ef160c755c9acbffb559348a1bf9671; ecbac30e8e21566a27043a9a07c5e62467732aad | routes/identity.py; routes/management.py; routes/tenant_structure.py; auth hook | M010 source only | Revoked session checked against auth.sessions and revoked_sessions | Invite stays invited until verified acceptance; suspend/revoke invalidates membership context | Auth hook accepts verified invitations | Session/membership audit events | PASS — run 44248766881 (commit 4ba0772); final Workforce guard commit ecbac30 not separately rerun | Auth provider login-failure audit integration remains open |
| AGZ-P01-OBS-001 | Audit events and security observability | Agentzy Engineering | P1 | Audit schema | IN PROGRESS | db5318fbca7816f3e57960394ccebca5cf46711b; 4ba07728bc2f81eefb11e9219f52be837d86826d; d5ffb7954ef160c755c9acbffb559348a1bf9671; ecbac30e8e21566a27043a9a07c5e62467732aad | routes/identity.py; routes/management.py; routes/tenant_structure.py | Existing audit_logs used; M010 does not replace it | N/A | N/A | N/A | Profile, session, invitation, tenant/org and membership actions logged | PASS — run 44248766881 (commit 4ba0772); final Workforce guard commit ecbac30 not separately rerun | Authentication failure and provider-native event correlation not yet implemented |
| AGZ-P01-DOC-001 | Phase 01 implementation evidence and known limitations | Agentzy Engineering | P1 | Implementation artifacts | IN PROGRESS | db5318fbca7816f3e57960394ccebca5cf46711b; 4ba07728bc2f81eefb11e9219f52be837d86826d; d5ffb7954ef160c755c9acbffb559348a1bf9671; ecbac30e8e21566a27043a9a07c5e62467732aad | docs/phase-01/*; this backlog | Migration status explicitly source-only | API inventory documented | RLS/grants matrix documents intended post-migration state | Frontend integration state documented | Evidence report in progress | PASS — run 44248766881 (commit 4ba0772); final Workforce guard commit ecbac30 not separately rerun | Phase 01 acceptance remains PARTIAL until migration and end-to-end wiring are verified |



## 19. Phase 01 live reconciliation — 2026-11-18 (authoritative current state)

This section supersedes stale Phase 01 status rows above where they conflict with live repository or database evidence. Phase 00 remains IN PROGRESS and is tracked in parallel; it is not used as a Phase 01 entry gate. Phase 02 remains NOT STARTED.

### Canonical current baseline

- Repository: `fadliansyah36/Agentzy-platform`, branch `main`.
- Code head before this documentation update: `2e2c028d1eb8ec14d3b05fa79fe045af2bd307b8`.
- Supabase: Agentzy-db, ref `cwhjdnkotuhueeudpgeu`.
- Current remote migration history contains six versions: three original identity migrations, M010 `20261118062335`, M011 `20261118062647`, and M012 `20261118065058`.
- The old 2026-11-17 audit and earlier Phase 01 report statements that M010 was source-only are historical and superseded by the current remote ledger and M010 post-migration report.

### Database evidence

| Check | Current result |
|---|---|
| M010 | APPLIED; catalog verification report exists |
| M011 | APPLIED; security lifecycle verification report exists |
| M012 | APPLIED; permission registry verification report exists |
| Public application tables | 18; RLS enabled on 18/18 |
| FORCE RLS | 0/18 |
| Permission definitions | 67 |
| Global baseline ABAC policies | 67 |
| Policy version snapshots | 67 |
| Current policy effects | 67 ALLOW / active; no live DENY policies |
| Server-only security table grants | No anon/authenticated/service_role grants on access policies/versions, auth provider events, break-glass, idempotency or revoked sessions |
| Hierarchy table grants | Authenticated SELECT only on organization units, branches and departments |
| Security Advisor | Six INFO findings for intentionally server-only RLS tables without client policies; no current anon/authenticated SECURITY DEFINER EXECUTE WARN returned |
| Auth user and security lifecycle rows | Zero at time of query; live user-based workflows not exercised |

Reports:
- `docs/phase-01/M010_POST_MIGRATION_VERIFICATION.md`
- `docs/phase-01/M011_SECURITY_LIFECYCLE_VERIFICATION.md`
- `docs/phase-01/M012_SECURITY_PERMISSION_VERIFICATION.md`

### Current task status

| Task ID / workstream | Current status | Outstanding acceptance |
|---|---|---|
| AGZ-P01-DB-001 / M010 | DONE (migration and catalog verification) | Does not close Phase 01; continue drift/recovery and runtime compatibility controls |
| M011/M012 security schema | DONE (migration and catalog verification) | No live user lifecycle records; runtime integration remains |
| AGZ-P01-PERM-001 / ABAC | PARTIAL | Evaluator and 18 deterministic cases exist; full legacy route coverage, tenant DENY policy operations and verified policy semantics across every resource remain |
| Object authorization | PARTIAL | Central helper covers selected routes; all sensitive legacy routes have not been proven migrated |
| Organization hierarchy | PARTIAL | Branch/department create/list/update/archive/restore exists; complete UI/membership assignment and all lifecycle invariants remain to be verified |
| Admin RBAC | PARTIAL | Live permission registry is passed to Admin matrix; complete scope management, preview, revoke and portal parity remain |
| Cross-portal integration | PARTIAL | Super Admin and Corporate use selected identity/hierarchy APIs; AI Workforce consumes tenant context but full registry/hierarchy wiring is incomplete |
| Session/password recovery | PARTIAL | Session validation/revocation exists; password recovery across portal login flows is missing |
| Auth provider event correlation | PARTIAL | Secret-protected, deduplicated event ingestion and session revocation handling exist; hosted webhook registration/secrets and provider runtime are unverified |
| Break-glass | PARTIAL | Request/approval/rejection/activation/revoke/review API and UI actions exist; no real users/requests, scheduled expiry and full operating evidence |
| Audit reader | PARTIAL | Scoped audit list/export APIs and Admin wiring exist; full tenant/resource redaction and all portal permission wiring remain |
| API contracts/pagination/idempotency | PARTIAL | Selected endpoints have Pydantic schemas, cursor pagination and idempotency; universal standard response/error envelope and every sensitive command remain |
| Workforce Phase 01 | PARTIAL | Identity/membership/invitation/hierarchy context wired; operational domain APIs and full operational UI integration remain incomplete |
| Demo/local data governance | PARTIAL | Workforce demo operational render path is hidden; fixtures/local state remain in source and Corporate/Admin local collections still need production-path audit/removal |

### Engineering check evidence

- GitHub Actions run [44292254340](https://github.com/fadliansyah36/Agentzy-platform/actions/runs/44292254340) passed frontend lint/TypeScript, Python compile/import, Ruff/OpenAPI schema, and migration source consistency at commit `fa4ecfcd5b748a6df116299ee2bdecb9b5d21bdf`.
- Code remediation commit `2e2c028d1eb8ec14d3b05fa79fe045af2bd307b8` followed with `[skip ci]`; it has not yet been independently validated by a new CI run.
- Do not mark tests as passed unless the latest workflow log shows the relevant deterministic test step ran.
- No UAT, staging, real-world, load/security acceptance or production release testing was run.

**Phase 01 disposition: PARTIAL / IN PROGRESS — NOT DONE.** No Phase 02 implementation is authorized until the user gives a separate instruction after Phase 01 DoD is satisfied.
