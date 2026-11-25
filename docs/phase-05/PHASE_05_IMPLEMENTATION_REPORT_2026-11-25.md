# Agentzy Phase 05 — Implementation Report

**Phase:** 05 — Sales CRM, Provider Catalogue & Order  
**Status:** DONE — Implementation Complete  
**Repository:** `fadliansyah36/Agentzy-platform`  
**Branch:** `main`  
**Supabase:** `cwhjdnkotuhueeudpgeu`  
**Report date:** 2026-11-25

## 1. Delivery summary

Phase 05 has been implemented across the Corporate Portal, Super Admin Portal, FastAPI, Supabase PostgreSQL, provider adapter contracts, background worker, webhooks and reconciliation.

The implemented internal lifecycle is:

`lead_created → assigned → contacted → qualified → coverage_checked → offer_presented → order_submitted → provider_pending → provider_approved/provider_rejected → installation_scheduled → installation_in_progress → activated/closed`

Provider approval, rejection, installation and activation are never inferred from a browser request. They are applied from a valid provider response or a signed provider webhook. A provider that is not configured returns `unknown` for coverage; no synthetic coverage or order response is created.

## 2. Implemented domains

### Sales CRM and lead lifecycle

- Lead create/read/update, customer profile, source, Phase 02 prospect linkage, tenant ownership and sales assignment.
- Workforce assignment reuses Phase 04 Workforce Passport; an order cannot be submitted without an eligible, active workforce assignment.
- Lifecycle transitions, qualification metadata, follow-up scheduling, notes and immutable activity timeline.
- Sales dashboard and tenant-scoped pipeline views.
- Manual stage changes are limited to contacted/qualified/disqualified/closed. Assignment, coverage, offer and order endpoints own their respective lifecycle transitions.

### Provider and product catalogue

- Provider profile lifecycle reuses Phase 03 provider profiles and corporate tenant ownership.
- Versioned product/service catalogue with category, service regions, coverage source, requirements, pricing reference, SLA, eligibility and status.
- Product activation requires an active provider; activating a new version suspends the previous active version for that provider/product code.
- Super Admin UI manages provider profile status, product versions, adapter configuration, request/response/status mapping, health check and blocked/dead-letter retry.
- Corporate Portal reads active providers and products.

### Customer consent and coverage

- Consent capture stores consent type, purpose, policy version, granted/denied state, source, timestamp, evidence and actor audit.
- Consent history and revocation endpoint/UI are implemented; revocation requires a reason and idempotency key.
- The Corporate Portal records an operator attestation that customer consent was obtained. Digital customer signature, OTP or customer self-service consent channel is not claimed as implemented.
- Coverage abstraction uses a normalized adapter contract. HTTP JSON providers can map normalized request fields, response fields and provider-specific `coverage_path`.
- Coverage result records provider/source, status, timestamp, provider reference, response hash and error code. Unconfigured or unmapped providers remain `unknown`.

### Order lifecycle and attribution

- Order creation validates tenant, lead, customer, active consent, offer, product version, provider status and Workforce assignment server-side.
- Client-supplied status, price, provider response and attribution owner are not trusted.
- Submission uses a durable outbox and stable provider-side idempotency key.
- Provider approval/rejection and installation/activation states are recorded as immutable order events.
- Order history exposes provider attempts, response/request hashes, references, error codes and webhook reconciliation state.
- Internal cancellation is supported before provider acceptance. Cancellation after a provider has accepted/started processing is blocked until a provider-specific cancellation endpoint/contract is officially authorized; the platform does not claim an external cancellation it did not perform.
- `order_attributions` stores a `sales_personal` snapshot from the server-validated Phase 04 workforce assignment with share basis `1.000000`. It is provisional until provider approval, locks on provider approval/activation and reverses on provider rejection or pre-acceptance cancellation. Correction is permitted only while the order is still draft. Affiliate attribution is reserved for Phase 06; no commission is calculated in Phase 05.

### Authorized provider adapters, webhooks and reconciliation

- HTTP JSON adapter supports HTTPS only, exact host allowlisting, public DNS/IP validation, no redirects, request/response mapping, environment-secret references, timeout, error classification, provider health and idempotency header.
- Secret values are never stored in PostgreSQL. Environment references must use `AGENTZY_PROVIDER_AUTH__*` and `AGENTZY_PROVIDER_WEBHOOK__*`.
- Partner portal and secure file exchange adapters are contract-only until the provider supplies an official authorized channel, file format and credentials. No scraping or unauthorized provider access is performed.
- Provider webhook ingestion verifies HMAC-SHA256, timestamp freshness, unique external event ID and replay protection.
- Outbox worker supports concurrent-safe claim, stale-lock recovery, six-attempt bounded exponential retry, blocked configuration, dead-letter state and authorized manual requeue.
- Reconciliation provides per-order attempt history, unmatched webhook metadata and immutable event traceability. Raw provider payloads are not exposed through the reconciliation UI.

## 3. Portal and code integration

| Area | Implemented modules |
|---|---|
| FastAPI routes and schemas | `apps/api/app/api/v1/routes/sales.py` |
| Domain rules | `apps/api/app/domain/sales.py` |
| Application service | `apps/api/app/services/sales_service.py` |
| Repository and outbox | `apps/api/app/repositories/sales_repository.py` |
| Provider adapter | `apps/api/app/adapters/provider_adapter.py` |
| Background worker | `apps/api/app/services/sales_worker.py` |
| Typed API client | `apps/web/lib/api-client.ts` |
| Corporate Portal | `apps/corporate/features/sales/SalesCrmOrdersView.tsx`, mounted in `apps/corporate/components/CorporatePortalClient.tsx` |
| Super Admin | `apps/admin/features/partnership/ProviderCatalogueAdminView.tsx`, mounted in `apps/admin/components/AdminPortalClient.tsx` |
| Worker configuration | `apps/api/app/core/config.py`, `apps/api/app/main.py`, `apps/api/.env.example` |
| Focused checks | `apps/api/tests/test_phase05_sales.py` |
| OpenAPI/minimum checks | `.github/workflows/agentzy-minimum-engineering.yml` |

The FastAPI router exposes **36 Sales endpoints** under `/api/v1/sales` (17 GET, 14 POST, 4 PATCH and 1 PUT). These include lead/customer/consent/coverage/offer/order operations, provider/catalogue administration, provider health, order events/attempts/attributions, webhook ingestion, retry and reconciliation.

The Corporate Portal now uses API-backed CRM, customer, pipeline, assignment, consent, coverage, offer, order, history and reconciliation controls. The Super Admin Portal uses API-backed provider/product catalogue and adapter governance. No Phase 05 browser business write goes directly to Supabase.

## 4. Supabase migrations and live evidence

All four Phase 05 migrations are present in `supabase/migrations/` and recorded in the connected Supabase migration ledger:

1. `20261125115219_phase_05_sales_crm_provider_catalogue_orders`
2. `20261125115634_phase_05_sales_explicit_deny_client_rls`
3. `20261125115731_phase_05_sales_idempotency_constraints`
4. `20261125124732_phase_05_order_attributions`

Live Supabase verification at closure:

| Evidence | Result |
|---|---:|
| Phase 05 business tables | 14 |
| RLS enabled | 14/14 |
| Tables with explicit client-deny policy | 14/14 |
| FORCE RLS | 0 |
| Direct anon table grants | 0 |
| Direct authenticated table grants | 0 |
| Direct service_role table grants | 0 |
| Sales permission keys | 9 |
| Role mappings per Sales permission | 2–10 |
| Provider profiles / products | 0 / 0 |
| Leads / customers / orders | 0 / 0 / 0 |
| Order attributions | 0 |
| Outbox / provider webhook events / submission attempts | 0 / 0 / 0 |

The Phase 05 tables are default-denied to browser roles. The backend database connection uses a privileged database role that bypasses RLS; therefore FastAPI tenant authorization, RBAC/ABAC and object-level scope checks remain mandatory. This is documented and is not represented as FORCE-RLS isolation. No mock/test business records were seeded.

### Migration recovery notes

All migrations are additive. Do not edit applied migration files. Prefer roll-forward repairs. The new attribution table was empty at closure; if rollback is ever required before attribution data exists, disable the API write path, take a backup, verify no dependent records, then use a separately reviewed rollback migration. Do not drop attribution history after real orders exist.

## 5. Engineering verification

**Agentzy Minimum Engineering Checks — SUCCESS**

- Workflow run: [45618835927](https://github.com/fadliansyah36/Agentzy-platform/actions/runs/45618835927)
- Tested code commit: `330eb890a7a753c9723238fdaa9dda9410966d13`
- Passed: frontend lint, TypeScript type-check, Python compile, Ruff, focused deterministic API tests, FastAPI import/OpenAPI contract assertions and migration source consistency.

A subsequent `.env.example`-only commit aligned the sales worker environment names with Pydantic settings:
`SALES_WORKER_ENABLED` and `SALES_WORKER_POLL_SECONDS`. This does not change the tested application source.

No UAT, staging, load test, penetration test, external provider transaction or production deployment was performed, as instructed.

## 6. Commits

- Initial Phase 05 implementation: `6e95916dbb95e3022693c33577e5b76aae7c85f0`
- Provider/security/portal hardening: `e96c97972e1e9ba4cc87c13d9fadb48fe74d0672`
- UI state/type correction: `0392414c1ade88277f94735a579af5da2cfa59a8`
- Final tested implementation source: `330eb890a7a753c9723238fdaa9dda9410966d13`
- Worker environment example correction: `15c04c26d11137a0542e1fe2b2d1bc39c9b856d7`

## 7. Known external configuration and limitations

- No provider credentials, official provider API agreements, partner portal credentials or secure file exchange contracts were available/configured. The internal adapter contracts are ready; no provider is claimed active.
- Provider-specific endpoint paths, request/response mappings, webhook secret references, host allowlist and deployment secrets must be supplied when the official provider channel is authorized.
- Partner portal and secure file exchange remain contract-only; no provider file format was invented.
- External cancellation after provider acceptance requires an official provider cancellation contract.
- Consent capture is currently operator attestation; customer OTP/e-signature proof is not implemented.
- SMTP and Google OAuth credentials remain intentionally deferred until deployment.
- Phase 00 remains separately marked IN PROGRESS in the backlog; Phase 05 does not close or repeat Phase 00–04.

## 8. Next phase

**Phase 06 — Affiliate Recruitment & Registration** is next according to the Implementation Backlog. Phase 06 implementation has not been started.
