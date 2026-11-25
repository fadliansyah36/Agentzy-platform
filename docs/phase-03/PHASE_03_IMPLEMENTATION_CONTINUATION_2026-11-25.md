# Agentzy Phase 03 — Corporate & Contract Management

**Status: DONE — IMPLEMENTATION COMPLETE.**  
Repository: `fadliansyah36/Agentzy-platform` · Branch: `main`  
Supabase: `cwhjdnkotuhueeudpgeu`

## Implemented domain scope

### Corporate and provider profiles
- Tenant-scoped corporate profile read/upsert and lifecycle status (active, suspended, archived).
- Organization and branch association is selected from the active tenant hierarchy and validated again by FastAPI.
- Tax profile is persisted server-side and validated; invoice tax is calculated from this persisted profile.
- Provider profile list/create/update/status lifecycle is available in the Corporate Portal and linked to new contracts.

### Contract and SOW
- Contract create, tenant-scoped list/detail and optimistic-concurrency draft update.
- Master Agreement and Statement of Work parent-contract association.
- Multiple service scopes per contract, catalogue service key validation, quantity, monthly fee, SLA, KPI, entitlement JSON and Human/AI Worker limits.
- Scope and commercial changes are versioned as immutable amendment snapshots with effective date and content hash.
- Contract detail exposes current version, approval history, service scope and signature status.

### Approval and lifecycle
- Configurable approval policy, required permission/role, approval steps and minimum approvals.
- Server-side approver authorization, approval/rejection history and time-bound delegation/revocation.
- Idempotent renewal request and decision, activation, suspension and termination; aggregate-bound fingerprints and transaction advisory locks protect lifecycle replay.
- Contract expiry and renewal reminder worker persists events and notification outbox records.
- Activation creates active entitlement grants in the same database transaction.

### Documents
- FastAPI upload to private Supabase Storage, MIME/magic/size checks, SHA-256 metadata, contract-version linkage, signed download authorization and archive lifecycle.

### Finance and entitlement
- Invoice draft and issue endpoints; line items must reference an active contract service.
- Backend derives unit fee from the persisted service schedule and tax from the persisted corporate tax profile; client-supplied prices/tax are rejected.
- Payment references are separate from payment confirmation. External evidence must be submitted and reviewed by an authorized finance member before a reference is reconciled and invoice status changes.
- Effective contract grants enforce Human Workforce membership capacity and AI Worker activation capacity.
- Tenant-scoped operational metrics cover active/draft/expired/expiring contracts, approvals, renewals, documents and outstanding invoices.

## FastAPI route groups

- `/api/v1/corporate/profile` — GET, PUT; `/profile/status` — PATCH.
- `/api/v1/corporate/contracts` — POST, GET; `/contracts/{contract_id}` — GET, PATCH.
- `/api/v1/corporate/contracts/{contract_id}/amendments` — POST; `/contracts/{contract_id}/versions` — GET.
- `/api/v1/corporate/approval-policies` — GET, POST; contract policy review/decision; approval delegation create/list/revoke.
- `/api/v1/corporate/contracts/{contract_id}/documents` — GET, POST; document download/archive.
- `/api/v1/corporate/contracts/{contract_id}/renewals` — POST; renewal list/decision; lifecycle process-due.
- `/api/v1/corporate/contracts/{contract_id}/activate`, `/suspend`, `/terminate`; signature status update.
- `/api/v1/corporate/contracts/{contract_id}/invoices`, invoice list/detail/issue, payment reference create/list/submit/verify.
- `/api/v1/corporate/entitlements/effective`, `/api/v1/corporate/metrics/contracts`.
- `/api/v1/corporate/provider-profiles` — GET, POST, PATCH and status PATCH.
- `/api/v1/corporate/ai-workers` — GET, POST, PATCH, activate and suspend.

## Corporate Portal integration

- `/corporate` — Corporate Portal shell and section navigation.
- `ContractPartnershipView` — profile/provider management, contracts, draft edit, multi-service SOW, amendment/version, approval/delegation/history, documents, signature, renewal, lifecycle, entitlement and operational metrics.
- `InvoiceCenterView` — contract-derived invoice draft, detail and issue.
- `PaymentReconciliationView` — payment reference creation, external evidence submission, finance verification and reconciliation status.
- `AIWorkerEntitlementPanel` — tenant AI Worker service/limit integration.
- All business operations use typed functions in `apps/web/lib/api-client.ts`; frontend does not write business records directly to Supabase.

## Database and security

Applied Phase 03 migrations:
- `20261119152730_phase_03_corporate_contract_management_core`
- `20261119152821_phase_03_contract_idempotency_fingerprint`
- `20261119153845_phase_03_corporate_contract_domain_completion`
- `20261119154914_phase_03_contract_integrity_and_idempotency`
- `20261119155605_phase_03_contract_backed_ai_worker_registry`
- `20261119160737_phase_03_payment_reference_verification_idempotency`
- `20261119160842_phase_03_ai_manager_entitlement_read_permissions`
- `20261119161100_phase_03_contract_signature_status`
- `20261119161325_phase_03_provider_profiles_and_contract_association`
- `20261119161337_phase_03_provider_profile_tenant_reference_name`

The live Supabase migration ledger contains all ten versions. Inspected corporate, contract, approval, document, renewal, invoice, payment, entitlement, provider and AI Worker tables have RLS enabled and no direct anon/authenticated client business write grants. Tenant permission mappings include Corporate Owner/Admin, Finance Manager, AI Manager, Auditor and Director Viewer. Backend services validate tenant ownership, object association and permission before mutation.

## Events and observability

- Contract transitions write `contract_events` and audit records.
- Lifecycle and renewal events enqueue notifications only when an active corporate billing email exists; absent recipient data does not create an undeliverable outbox row.
- Notification dispatcher templates cover activation, suspension, termination, expiry, renewal request, renewal decision and renewal reminder.
- Expiry/renewal worker runs from FastAPI lifespan when enabled; SMTP dispatcher remains disabled until deployment credentials are configured.
- Structured logs, request/correlation/trace IDs and tenant-scoped contract operational metrics are available.

## Engineering verification and limitations

**Final main commit:** `a4b69c7d79bffd101c561770f79d7c85bb556300`  
**GitHub Actions:** [Agentzy Minimum Engineering Checks — run 45590318180](https://github.com/fadliansyah36/Agentzy-platform/actions/runs/45590318180) — **SUCCESS**.

Actual completed checks:
- Frontend lint — SUCCESS.
- Frontend TypeScript type-check — SUCCESS.
- Python compile — SUCCESS.
- Ruff — SUCCESS.
- Focused deterministic API checks — SUCCESS.
- FastAPI import and OpenAPI contract assertions — SUCCESS.
- Migration source consistency — SUCCESS.

Phase 03 implementation is closed. Deployment/runtime configuration still required before real customer use: API deployment URL/CORS, SMTP credentials, Google OAuth client credentials/encryption key, Turnstile keys, ClamAV endpoint and server-only Supabase Storage service-role key. These are intentionally not fabricated or activated here.

No staging, UAT, load test, penetration test, production deployment, real customer contract, real payment or external SMTP/Google OAuth activation was performed. Payment references are reconciliation records only; no payment transaction is asserted or fabricated.


## 2026-11-25 ABAC enforcement hardening addendum

A source-level authorization review found that the original Phase 03 corporate route guards checked tenant-scoped RBAC but did not consistently invoke the central dynamic ABAC evaluator. This was corrected before final closure:

- `corporate_contracts.py` now maps every corporate profile, contract, approval, document, lifecycle, finance, entitlement, provider and AI Worker permission to an explicit ABAC resource/action and calls `authorize_action` after permission resolution.
- `contracts.py` contract create/read/decision/activation routes now invoke the same central RBAC + ABAC evaluator.
- `ai_workers.py` reuses the corporate permission guard; both AI Worker read/manage permissions are mapped to the `corporate.ai` ABAC policies.
- All 15 permission keys referenced by these route groups were checked against the live permission registry and role-permission mappings; every key has one or more role mappings and no route permission is unmapped.
- Additive policy migrations are applied and source-controlled: `20261125101028_phase_03_abac_enforcement_hardening` and `20261125101124_phase_03_ai_worker_abac_policy_hardening`. Previously applied migrations were not modified.
- Live Phase 03 table check: 17/17 expected tables exist; RLS enabled 17/17; FORCE RLS 0/17; direct anon business grants 0; direct authenticated business grants 0. These business tables remain backend-only; API authorization is enforced by FastAPI RBAC + ABAC and object/tenant validation.
- No invoice, payment reference, contract document, contract event or Auth user rows were seeded by this hardening work.

**Final hardening code commit:** `7329be889ae779a80e263b07195e3892cc24e57a`  
**GitHub Actions:** [Agentzy Minimum Engineering Checks — run 45592736547](https://github.com/fadliansyah36/Agentzy-platform/actions/runs/45592736547) — **SUCCESS**.

Actual checks on this commit: frontend lint, TypeScript type-check, Python compile, Ruff, focused deterministic API checks, FastAPI import/OpenAPI contract, and migration source consistency — all SUCCESS.
