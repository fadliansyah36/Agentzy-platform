# AGENTZY — IMPLEMENTATION RULES (AGENTS.md)

Authority: `docs/AGENTZY_MASTER_PRD_v2.0.md` and `docs/AGENTZY_TECHNICAL_IMPLEMENTATION_BLUEPRINT_v1.0.md`.

## Product and UI rules
- Agentzy is one platform with Public Landing plus Corporate/ISP, Human Workforce, AI Workforce Management, and Super Admin portals.
- Preserve existing UI/UX. Do not redesign or rebuild existing portal screens. Work is backend-first: Python, FastAPI, API contracts/endpoints, Supabase schema/migrations/RLS, business logic, integrations, and wiring existing UI to real APIs.
- FastAPI is the business authority. Supabase PostgreSQL is the sole primary business database.
- No duplicate business database, duplicate source of truth, mock/fake production data, silent demo fallback, or direct frontend business writes.
- Frontend may use Supabase Auth client for supported identity/session flows, but all sensitive business operations must go through FastAPI.

## Backend architecture
- Start with a Python FastAPI modular monolith and explicit bounded contexts. Microservices require an approved ADR.
- Use typed Pydantic schemas, REST `/api/v1`, OpenAPI, standard error envelope, cursor pagination, allowlisted filters/sorts, UTC timestamps, Decimal for money, request/correlation/trace IDs, and idempotency keys for sensitive commands.
- Separate routers, dependencies/policies, application services, domain logic, repositories, and external adapters.
- Commission, AI Credits, billing, entitlements, KPI calculations, and authorization are deterministic backend logic; never delegate payable calculations to an LLM.

## Supabase and migrations
- Inspect live schema, migration history, extensions, RLS, grants, functions, triggers, Storage and Realtime before designing changes.
- Every phase that changes persisted data ships its own ordered migration(s), RLS/grants, constraints/indexes and recovery notes. Do not defer migrations until the end.
- Migration source lives in `supabase/migrations/`. Never mutate applied migrations, drop/recreate the database, or make untracked manual schema changes.
- Use additive expand-migrate-contract changes. Never create a table/column before checking whether it already exists.
- Enable RLS on tenant-owned data. Never trust client-supplied tenant_id as proof of authorization.
- Keep service-role keys and provider secrets out of browser bundles. Private Storage by default; short-lived signed URLs only after authorization.
- Never run migrations until the canonical Supabase project ref is confirmed and its live state audited.

## Identity and portal workflow
- Public flow: landing/catalogue → partnership application → qualification → discovery → proposal/scope → legal/commercial review → contract/SOW → tenant onboarding → invitation/SSO → login → membership/tenant/portal entitlement resolution → portal.
- Workforce recruitment and activation is a separate verified lifecycle.
- Resolve tenant, membership, portal entitlement, role, and permissions server-side. Deny by default; enforce RBAC + ABAC + object-level access on every resource.
- UI visibility is not authorization. Privileged and break-glass actions must be time-bound, approved as required, reasoned, and audited.

## AI, memory and workflow
- All LLM requests go through FastAPI AI Gateway and Model Router; no direct provider calls from browser or Next.js handlers after gateway integration.
- Model activation requires provider/model allowlist, tenant policy, data classification, region/residency, retention, capability, safety and budget checks.
- Tool execution requires identity, permission, risk, approval, sandbox/network policy, validation and audit.
- One Memory Coordinator manages Working, Conversation, Long-term, Episodic, Semantic, Procedural, Organizational and Personal memory with tenant/owner scope, consent, purpose, provenance, retention, permission-filtered retrieval and deletion propagation.
- RAG uses Supabase pgvector + PostgreSQL full-text search unless an ADR approves otherwise.
- Workflow Definition, Workflow Run, Task, Human Assignment and AI Run are separate entities. Persist checkpoints, attempts, leases/heartbeats, cancellation, retry, timeout, recovery and audit. Use outbox and idempotent consumers; compensation is an explicit business action.

## Security and integrations
- Trust forwarded IP headers only from configured reverse proxies. Add rate limits, bot protection, secure sessions, MFA for privileged roles, session revocation, audit and security alerts.
- Prevent IDOR/BOLA, SSRF, webhook replay, credential leakage, prompt injection, memory poisoning, unsafe uploads and tool abuse.
- Google Workspace: least-privilege OAuth, tenant/user consent, encrypted credential references, refresh/revoke lifecycle and audit.
- Google Maps: restricted server-side keys, quota controls, consent, location minimization and retention.
- ISP/provider integrations must be authorized APIs, webhooks, partner portals or secure file exchange. No unauthorized scraping.

## Delivery and testing policy
- Follow PRD phases 00–23 in order unless a documented dependency allows parallel work.
- Each phase includes applicable frontend wiring, backend, migration, API, permission/RLS, integrations/events, observability and documentation.
- During development perform only minimum engineering checks: lint/type-check, Python compile/import, migration consistency, schema/API contract validation, static checks and focused deterministic unit checks.
- Full real-world testing, UAT, staging, load/security acceptance and production release gate belong to Phase 22. Phase 23 is controlled production rollout and continuous improvement.
- Do not claim tests or completion that did not occur.

## Definition of Done
A task is Done only with task/acceptance criteria, commit SHA, migration and remote evidence (if applicable), API/OpenAPI contract, permission/RLS evidence, existing UI wired to real API, integration/event and observability evidence, documentation, and actual engineering-check results.
