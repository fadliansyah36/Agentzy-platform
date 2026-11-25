-- Tenant-scoped aggregate metrics derived from immutable workforce audit events.
create or replace view public.workforce_operation_metrics
with (security_invoker = true) as
select tenant_id,date_trunc('day',created_at)::date as metric_day,action,count(*)::bigint as event_count
from public.audit_logs
where action like 'workforce.%'
group by tenant_id,date_trunc('day',created_at)::date,action;
revoke all on public.workforce_operation_metrics from anon,authenticated;
