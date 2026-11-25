# Phase 05 — Sales CRM, Provider Catalogue & Order

Sales CRM is the commercial workflow from Phase 02 public prospects into tenant-owned customer records, Phase 04 workforce assignment, provider coverage, offer and order. FastAPI is the sole business authority; Supabase PostgreSQL is the primary source of truth.

## Modules

- `app/domain/sales.py`: explicit lead/order state transition allowlists and provider status mapping.
- `app/repositories/sales_repository.py`: tenant-scoped lead/order lookups and durable outbox writes.
- `app/services/sales_service.py`: lifecycle invariants and normalized provider submission payload.
- `app/adapters/provider_adapter.py`: authorized HTTP JSON adapter with provider request/response mapping, idempotency headers, health checks and contract-only partner handoff adapter.
- `app/services/sales_worker.py`: durable outbox claim, provider submission attempts, stable provider idempotency key, bounded exponential retry, blocked-configuration and dead-letter handling.
- `app/api/v1/routes/sales.py`: CRM, consent, coverage, catalogue, order, webhook and reconciliation endpoints.

## End-to-end sequence

1. Create a tenant lead/customer or import a Phase 02 prospect.
2. Assign an eligible Phase 04 workforce profile; progress lead through qualification.
3. Record explicit customer consent for coverage validation.
4. Select an active provider product and call its authorized coverage adapter through the adapter contract. Request/response field mapping and provider coverage path are configurable; no configured provider produces `unknown`, never `available`.
5. Present an offer using the database product version, pricing reference and requirements snapshot.
6. Capture order-submission consent, create an idempotent order and enqueue `provider.order.submit`.
7. Worker submits only through the configured adapter. Provider HTTP acceptance means `provider_pending`, not provider approval.
8. HMAC-verified provider webhooks map approved/rejected/installation/activation status. Reconciliation exposes per-order attempts, immutable event history and unmatched webhook metadata. The worker retries transient errors with a six-attempt bounded backoff and operator requeue for blocked/dead-letter events.

## Security

- Tenant membership and RBAC/ABAC permission are checked in FastAPI.
- Lead, customer, consent, order and order-history object scope is checked before read/write; sales officials are limited to their assigned leads/orders.
- Client-supplied provider result, order status, price and customer ownership are never trusted.
- All 13 Sales tables have RLS enabled, explicit deny policies for browser roles, and no direct `anon`, `authenticated`, or `service_role` table grants.
- API runtime database credentials must remain private. The owner connection bypasses RLS; server authorization is therefore mandatory.
- Secrets are environment references only and environment names must use `AGENTZY_PROVIDER_AUTH__*` or `AGENTZY_PROVIDER_WEBHOOK__*`. Provider endpoints must be HTTPS, host-allowlisted, reject private DNS/IP targets and do not follow redirects.
- Provider submission uses a stable provider-side `Idempotency-Key`; HTTP acceptance maps only to `provider_pending`. Provider approval, rejection, installation and activation are accepted only from signed, replay-protected webhooks.
- Manual cancellation is available before provider acceptance. After provider acceptance, cancellation is blocked until an authorized provider-specific cancellation contract is configured; the platform does not falsely claim external cancellation.

## Migrations

- `20261125115219_phase_05_sales_crm_provider_catalogue_orders`
- `20261125115634_phase_05_sales_explicit_deny_client_rls`
- `20261125115731_phase_05_sales_idempotency_constraints`

See [Sales API Contract](SALES_API_CONTRACT.md).

## Portal integration

- Corporate Portal: `apps/corporate/features/sales/SalesCrmOrdersView.tsx` provides lead creation, assignment, pipeline transitions, customer profile, qualification, follow-up, notes/activity timeline, consent history/revocation, coverage, offers, orders, event history and reconciliation using the typed API client.
- Super Admin: `apps/admin/features/partnership/ProviderCatalogueAdminView.tsx` manages provider profiles, product versions, region/requirements/pricing/SLA/eligibility metadata, adapter mappings, health checks and blocked/dead-letter retry.
- API client: `apps/web/lib/api-client.ts`. No Phase 05 business writes are made directly from the browser to Supabase.

## Live evidence at implementation closure

- Four Phase 05 migrations are present in the repository and recorded in the connected Supabase migration ledger.
- 14/14 Phase 05 business tables (including `order_attributions`) have RLS enabled and explicit deny policies for `anon` and `authenticated`; direct table grants to `anon`, `authenticated` and `service_role` are absent.
- 9 Phase 05 permission keys and their role mappings are present. FastAPI uses tenant membership, RBAC/ABAC and object-scope checks; the private backend database connection bypasses RLS, so API authorization remains mandatory.
- Provider profiles/products, leads, orders, order attributions, outbox and webhook event counts were zero at closure. No production test data or synthetic provider responses were inserted.
- Sales personal order attribution is recorded from the server-validated Phase 04 workforce assignment with share basis 1.0. Attribution remains provisional until provider approval, locks at approval/activation, reverses on provider rejection or pre-acceptance cancellation, and may be corrected only while the order is still draft. Affiliate attribution is reserved for Phase 06.
- Provider credentials, official provider agreements and provider-specific endpoint mappings remain deployment/partner configuration, not an assertion of active external integrations.
