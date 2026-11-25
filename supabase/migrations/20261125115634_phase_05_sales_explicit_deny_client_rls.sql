-- Phase 05 RLS hardening: browser roles receive explicit deny policies.
-- FastAPI remains the only business write path; tenant authorization is enforced by ABAC in the API.
do $$
declare t text;
begin
  foreach t in array array[
    'sales_customers','sales_leads','sales_lead_activities','sales_provider_products',
    'sales_customer_consents','sales_coverage_checks','sales_offers','sales_orders',
    'sales_order_events','provider_integration_configs','provider_webhook_events',
    'provider_submission_attempts','sales_outbox'
  ] loop
    if not exists (
      select 1 from pg_policies
      where schemaname='public' and tablename=t and policyname='sales_deny_direct_client_access'
    ) then
      execute format(
        'create policy sales_deny_direct_client_access on public.%I for all to anon, authenticated using (false) with check (false)',
        t
      );
    end if;
  end loop;
end $$;
