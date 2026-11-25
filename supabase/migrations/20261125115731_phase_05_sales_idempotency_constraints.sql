-- Phase 05 idempotency constraints for lead activities, coverage requests and offers.
create unique index if not exists sales_lead_activity_idempotency_uq
  on public.sales_lead_activities(tenant_id,lead_id,idempotency_key)
  where idempotency_key is not null;
create unique index if not exists sales_coverage_request_idempotency_uq
  on public.sales_coverage_checks(tenant_id,request_reference);
create unique index if not exists sales_offer_coverage_product_uq
  on public.sales_offers(tenant_id,lead_id,product_id,coverage_check_id);
