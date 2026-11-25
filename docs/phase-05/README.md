# Phase 05 — Sales CRM, Provider Catalogue & Order

Sales CRM is the commercial workflow from Phase 02 public prospects into tenant-owned customer records, Phase 04 workforce assignment, provider coverage, offer and order. FastAPI is the sole business authority; Supabase PostgreSQL is the primary source of truth.

## Modules

- `app/domain/sales.py`: explicit lead/order state transition allowlists and provider status mapping.
- `app/repositories/sales_repository.py`: tenant-scoped lead/order lookups and durable outbox writes.
- `app/services/sales_service.py`: lifecycle invariants and normalized provider submission payload.
- `app/adapters/provider_adapter.py`: authorized HTTP JSON adapter and contract-only partner handoff adapter.
- `app/services/sales_worker.py`: durable outbox claim, provider submission attempts, exponential retry, blocked-configuration and dead-letter handling.
- `app/api/v1/routes/sales.py`: CRM, consent, coverage, catalogue, order, webhook and reconciliation endpoints.

## End-to-end sequence

1. Create a tenant lead/customer or import a Phase 02 prospect.
2. Assign an eligible Phase 04 workforce profile; progress lead through qualification.
3. Record explicit customer consent for coverage validation.
4. Select an active provider product and call its authorized coverage adapter. No configured provider produces `unknown`, never `available`.
5. Present an offer using the database product version, pricing reference and requirements snapshot.
6. Capture order-submission consent, create an idempotent order and enqueue `provider.order.submit`.
7. Worker submits only through the configured adapter. Provider HTTP acceptance means `provider_pending`, not provider approval.
8. HMAC-verified provider webhooks map approved/rejected/installation/activation status. Reconciliation exposes attempts and unresolved events.

## Security

- Tenant membership and RBAC/ABAC permission are checked in FastAPI.
- Lead and order object scope is checked before read/write; sales officials are limited to their assigned leads/orders.
- Client-supplied provider result, order status, price and customer ownership are never trusted.
- All 13 Sales tables have RLS enabled, explicit deny policies for browser roles, and no direct `anon`, `authenticated`, or `service_role` table grants.
- API runtime database credentials must remain private. The owner connection bypasses RLS; server authorization is therefore mandatory.
- Secrets are environment references only. Provider endpoints must be HTTPS and host-allowlisted.

## Migrations

- `20261125115219_phase_05_sales_crm_provider_catalogue_orders`
- `20261125115634_phase_05_sales_explicit_deny_client_rls`
- `20261125115731_phase_05_sales_idempotency_constraints`

See [Sales API Contract](SALES_API_CONTRACT.md).
