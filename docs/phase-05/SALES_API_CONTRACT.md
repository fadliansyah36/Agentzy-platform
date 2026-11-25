# Phase 05 — Sales API Contract

Base prefix: `/api/v1/sales`. All authenticated operations require a verified tenant membership and the matching RBAC/ABAC permission. Tenant IDs in requests are selectors, not authorization evidence.

## CRM and customer

| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard?tenant_id=` | Lead and order pipeline counters |
| GET | `/leads?tenant_id=&stage=&cursor=&limit=` | Tenant-scoped, cursor-paginated leads |
| POST | `/leads` | Create lead/customer or import Phase 02 prospect; requires `Idempotency-Key` |
| PATCH | `/leads/{lead_id}` | Update qualification, follow-up and notes |
| POST | `/leads/{lead_id}/assign` | Assign eligible Phase 04 workforce profile |
| POST | `/leads/{lead_id}/transition` | Transition lead stage with reason |
| GET | `/leads/{lead_id}/activities` | Read immutable lead activity timeline |
| GET/PATCH | `/customers`, `/customers/{customer_id}` | Read/update customer profile |
| GET | `/workforce-options` | List tenant-eligible workforce profiles |

## Provider catalogue, consent and coverage

| Method | Path | Purpose |
|---|---|---|
| GET | `/providers` | Tenant provider profiles and adapter state |
| POST | `/providers` | Create tenant provider profile as draft |
| PATCH | `/providers/{provider_id}/status` | Activate/suspend/archive provider profile |
| GET | `/providers/{provider_id}/health` | Provider health / external configuration status |
| GET | `/catalogue` | Active product catalogue for Corporate Portal |
| GET | `/products` | Product versions and status for Super Admin |
| POST | `/providers/{provider_id}/products` | Create immutable product version (draft) |
| PATCH | `/products/{product_id}/status` | Activate/suspend/archive product |
| PUT | `/providers/{provider_id}/integration` | Save adapter contract and environment-key references |
| POST | `/leads/{lead_id}/consents` | Capture purpose/policy-version consent |
| POST | `/consents/{consent_id}/revoke` | Revoke consent with reason and audit |
| POST | `/leads/{lead_id}/coverage-checks` | Call authorized provider coverage API; unknown/failed is not treated as available |
| POST | `/leads/{lead_id}/offers` | Snapshot active product version, price reference and requirements |

## Orders, provider events and reconciliation

| Method | Path | Purpose |
|---|---|---|
| POST | `/orders` | Create order from valid offer and active order-submission consent; requires `Idempotency-Key` |
| GET | `/orders` | Tenant/owner-scoped order list |
| GET | `/orders/{order_id}` | Order snapshot |
| GET | `/orders/{order_id}/events` | Immutable order transition history |
| POST | `/orders/{order_id}/transition` | Submit, schedule, begin installation or cancel; provider decisions are webhook-only |
| POST | `/webhooks/providers/{provider_code}?tenant_id=` | HMAC-verified, replay-protected provider event ingestion |
| POST | `/providers/{provider_id}/retry-blocked` | Requeue blocked provider submissions after deployment configuration |
| GET | `/reconciliation` | Submission attempts and unresolved provider events |

## Lifecycle and invariants

`lead_created → assigned → contacted → qualified → coverage_checked → offer_presented → order_submitted`

`draft → submitted → provider_pending → provider_approved/provider_rejected → installation_scheduled → installation_in_progress → activated`

The server resolves customer/provider/product/price snapshots from database records. The client cannot set provider coverage or approval results. Order transitions store actor, timestamp, source, reason, evidence, trace ID and idempotency key. Provider webhooks require a unique external event ID and a timestamp within five minutes.

## Provider configuration

Supported adapter keys are `http_json`, `webhook_only`, and `secure_file_exchange`. HTTP JSON adapters require an HTTPS host in `AGENTZY_PROVIDER_ALLOWED_HOSTS` and deployment-only secret references. Partner portal and secure file exchange remain blocked until the partner supplies an authorized contract and channel. The platform never scrapes partner systems.

## Errors

- `401/403`: unauthenticated or permission/tenant denied.
- `404`: tenant-scoped object not found or outside caller scope.
- `409`: invalid lifecycle transition, missing consent, non-available coverage, or idempotency conflict.
- `428`: missing required idempotency key.
- `503`: provider deployment secret or authorized external configuration unavailable.
