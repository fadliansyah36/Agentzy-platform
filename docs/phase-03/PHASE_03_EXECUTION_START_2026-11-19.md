# Agentzy Phase 03 — Corporate & Contract Management

**Status: IN PROGRESS — first backend/database vertical slice committed.**  
Repository: `fadliansyah36/Agentzy-platform`, branch `main`  
Supabase: `cwhjdnkotuhueeudpgeu`

## Initial implementation

### Database
Applied additive migrations:
- `20261119152730_phase_03_corporate_contract_management_core`
- `20261119152821_phase_03_contract_idempotency_fingerprint`

New tables:
- `corporate_profiles`
- `contracts`
- `contract_versions`
- `contract_services`
- `contract_approvals`
- `contract_events`

All six tables have RLS enabled and direct client grants revoked. Contract services reuse the existing public catalogue service keys rather than creating a duplicate catalogue. Contract versions retain a content hash and commercial snapshot; fees use PostgreSQL numeric and API Decimal.

Permission keys:
- `corporate.contracts.read`
- `corporate.contracts.manage`
- `corporate.contracts.approve`

Role mappings are added for Corporate Owner, Corporate Admin and Corporate Finance Manager.

### FastAPI
Routes are registered under `/api/v1/corporate/contracts`:
- `POST /api/v1/corporate/contracts` — create draft contract and version 1 with service scopes.
- `GET /api/v1/corporate/contracts?tenant_id=...` — tenant-scoped list.
- `GET /api/v1/corporate/contracts/{contract_id}?tenant_id=...` — detail, services and approvals.
- `POST /api/v1/corporate/contracts/{contract_id}/submit-review?tenant_id=...` — submit draft and assign approval steps.
- `POST /api/v1/corporate/contracts/{contract_id}/decision?tenant_id=...` — assigned approver approves/rejects.
- `POST /api/v1/corporate/contracts/{contract_id}/activate?tenant_id=...` — activate only after approval and effective-date validation.

All routes check active tenant membership and server-side permission. Contract create requires an idempotency key and binds replay to the canonical payload fingerprint. Contract create, review, approval and activation append contract events and audit logs.

## Remaining Phase 03 implementation

- Corporate profile CRUD and organization-level corporate metadata.
- Draft contract editing, version amendment and immutable supersession.
- Approval policy templates, quorum/sequence configuration and approver permission validation at assignment time.
- Private contract document upload, versioned attachments and signed access.
- Renewal, expiry scheduler, suspension, termination and amendment workflows.
- Contract service catalogue mapping, SLA/KPI entitlements and change history.
- Invoice/payment references and integration with the finance lifecycle.
- Wire existing Corporate Portal contract center to the new FastAPI APIs; preserve existing UI.
- Cursor pagination, allowlisted filters, optimistic concurrency and deterministic domain tests.
- OpenAPI, phase documentation and minimum engineering checks.

No fake contract, corporate profile, invoice or payment rows were seeded. No UI redesign, staging, UAT or production deployment was performed.
