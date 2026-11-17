# Agentzy — Architecture Decision Register

Baseline: Master PRD v2.0 + Technical Implementation Blueprint v1.0
Repository: fadliansyah36/Agentzy-platform / main
Status: Phase 00 governance register. Binding rules are distinguished from proposals.

## Decision authority
- Master PRD v2.0 controls product intent.
- Technical Implementation Blueprint v1.0 controls technical design under the PRD.
- AGENTS.md is mandatory repository execution policy.
- Technical deviations require a reviewed ADR before implementation.
- No ADR authorizes a Supabase migration by itself.

## Binding architecture decisions

| ID | Decision | Status | Constraint |
|---|---|---|---|
| ADR-001 | Retain the existing monorepo and portal UI structure; avoid unnecessary framework or repository migration. | CONFIRMED | Preserve existing frontend experience. |
| ADR-002 | Python FastAPI modular monolith with explicit bounded contexts; microservices require a separate approved ADR. | CONFIRMED | Separate routers, policies, application services, domain logic, repositories and adapters. |
| ADR-003 | Supabase PostgreSQL is the sole primary business source of truth. | CONFIRMED | No second business database or sensitive direct frontend business writes. |
| ADR-004 | Supabase Auth is the baseline identity/session service; tenant, membership, entitlement and permission resolve server-side. | CONFIRMED | Deny by default; enforce RBAC, ABAC and object-level access. |
| ADR-005 | REST API namespace is /api/v1 with typed Pydantic schemas and FastAPI-generated OpenAPI. | CONFIRMED | Standard errors, cursor pagination, UTC, Decimal money, trace IDs and idempotency for sensitive commands. |
| ADR-006 | All LLM requests route through FastAPI AI Gateway and Model Router. | CONFIRMED | No direct provider invocation from browser or Next.js handlers after gateway integration. |
| ADR-007 | RAG uses Supabase pgvector plus PostgreSQL full-text search. | CONFIRMED | Embedding model/version/dimensions must match the index schema. |
| ADR-008 | One Memory Coordinator governs eight memory types. | CONFIRMED | Working, Conversation, Long-term, Episodic, Semantic, Procedural, Organizational and Personal; enforce consent, scope, provenance, retention and deletion. |
| ADR-009 | Workflow Definition, Workflow Run, Task, Human Assignment and AI Run are separate entities. | CONFIRMED | Persist checkpoints, attempts, leases, heartbeat, timeout, cancellation, retry, recovery, outbox and audit. |
| ADR-010 | Preserve existing portal UI/UX and design system. | CONFIRMED | Missing components follow existing tokens, CSS, typography, controls and colors; no redesign. |
| ADR-011 | No mock/fake production data or silent demo fallback. | CONFIRMED | Surface explicit loading, empty, error or unavailable states. |
| ADR-012 | Migrations are ordered, phase-scoped and additive. | CONFIRMED | Never mutate applied migrations or make untracked schema changes; inspect live state first. |
| ADR-013 | No real-world testing, UAT or staging before Phase 22. | CONFIRMED | Minimum engineering checks still apply; report only checks actually run. |

## Proposed decisions requiring operational validation

| ID | Topic | Proposed direction | Status / gate |
|---|---|---|---|
| ADR-014 | Durable workflow engine | Evaluate Temporal or equivalent. | OPEN — compare recovery semantics, ownership, cost and integration before Phase 13/14. |
| ADR-015 | Queue/broker | Select one managed and operable option; transactional outbox is mandatory. | OPEN — decide before worker implementation. |
| ADR-016 | Analytics serving | Start with PostgreSQL aggregates/read models; add warehouse only with measured need. | PROPOSED — validate at Phase 17. |
| ADR-017 | Model provider strategy | Provider adapters behind AI Gateway with tenant/model allowlists and pricing snapshots. | PROPOSED — finalize in Phase 09. |
| ADR-018 | Embedding model | Versioned registry with fixed dimensions per index/schema. | OPEN — choose after privacy, language, cost and retrieval evaluation. |
| ADR-019 | File scanning | Private quarantine and malware scanning before availability. | PROPOSED — select provider before upload activation. |
| ADR-020 | Payment provider | Select after Indonesian settlement, refund, tax and commercial review. | OPEN — no payable billing before validation. |
| ADR-021 | Deployment platform | Align API/workers with existing infrastructure and operational ownership. | OPEN — document runtime, secrets, networking and observability. |
| ADR-022 | Shared design system package | Consolidate tokens/components only without forcing redesign or regressions. | PROPOSED — inventory existing tokens first. |

## Phase 00 gates still open
1. Complete repository source inventory and route/API ownership matrix.
2. Complete Supabase baseline: Data API exposure, grants/default privileges, Auth configuration, Storage policies, Realtime publication, event-trigger attachment/ownership/dependencies and security review.
3. Resolve the public.rls_auto_enable() Security Advisor finding through reviewed impact analysis; do not invoke it as setup.
4. Reconcile PRD domain model and Blueprint migration batches M000–M220 against live database before creating migrations.
5. Record dependency/license inventory, environment variable names (never values), design-token map and evidence.
6. Confirm Phase 00 exit criteria and Phase 01 implementation scope.

## Supabase safety note
Canonical project: Agentzy-db / cwhjdnkotuhueeudpgeu. Connector access is available and project status is ACTIVE_HEALTHY. Access availability is not migration approval. No schema, migration, data, policy, function or project setting was changed during this governance alignment.

## Change control
Every ADR must include context, decision, alternatives, consequences, security/tenant impact, migration impact, affected phases, owner, date, status and evidence commit SHA.