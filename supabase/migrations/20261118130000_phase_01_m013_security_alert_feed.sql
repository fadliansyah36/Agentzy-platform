-- Phase 01 M013 — durable security alert feed and provider-event correlation.
-- Additive only. No existing table, migration, policy, or identity row is rewritten.

create table public.security_alerts (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references public.tenants(id) on delete set null,
    source_type text not null check (source_type in ('audit_log', 'auth_provider_event')),
    source_id uuid not null,
    alert_key text not null,
    severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
    status text not null default 'open'
        check (status in ('open', 'acknowledged', 'resolved')),
    title text not null,
    summary text not null,
    actor_user_id uuid references auth.users(id) on delete set null,
    subject_user_id uuid references auth.users(id) on delete set null,
    request_id text,
    correlation_id text,
    trace_id text,
    details jsonb not null default '{}'::jsonb,
    occurred_at timestamptz not null default now(),
    acknowledged_by uuid references auth.users(id) on delete set null,
    acknowledged_at timestamptz,
    resolved_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint security_alerts_source_unique unique (source_type, source_id, alert_key),
    constraint security_alerts_ack_consistency check (
        (status = 'open' and acknowledged_at is null and acknowledged_by is null)
        or (status in ('acknowledged', 'resolved') and acknowledged_at is not null
            and acknowledged_by is not null)
    ),
    constraint security_alerts_resolved_consistency check (
        (status = 'resolved' and resolved_at is not null)
        or (status <> 'resolved' and resolved_at is null)
    )
);

create index security_alerts_tenant_created_idx
    on public.security_alerts (tenant_id, created_at desc, id desc);
create index security_alerts_status_severity_created_idx
    on public.security_alerts (status, severity, created_at desc, id desc);

alter table public.security_alerts enable row level security;
revoke all on table public.security_alerts from public, anon, authenticated;
grant select, update on table public.security_alerts to service_role;

comment on table public.security_alerts is
    'Server-only security signal feed derived from audit and authenticated provider events; excludes raw secrets and PII payloads.';

create or replace function public.capture_audit_security_alert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_alert_key text;
    v_severity text;
    v_title text;
    v_summary text;
begin
    if new.action like 'authorization.%'
       and coalesce(new.metadata->>'decision', '') = 'DENY' then
        v_alert_key := 'authorization_denied';
        v_severity := 'medium';
        v_title := 'Authorization denied';
        v_summary := 'A resource authorization decision was denied.';
    elsif new.action like 'break_glass.%'
       and new.action not in ('break_glass.expired', 'break_glass.reviewed') then
        v_alert_key := replace(new.action, '.', '_');
        v_severity := case when new.action = 'break_glass.activated' then 'critical' else 'high' end;
        v_title := 'Break-glass lifecycle event';
        v_summary := 'A privileged emergency-access lifecycle transition occurred.';
    elsif new.action = 'tenant.archived' then
        v_alert_key := 'tenant_archived';
        v_severity := 'high';
        v_title := 'Tenant archived';
        v_summary := 'A tenant was archived by an authorized platform action.';
    elsif new.action = 'membership.revoked' then
        v_alert_key := 'membership_revoked';
        v_severity := 'medium';
        v_title := 'Membership revoked';
        v_summary := 'A tenant membership was revoked.';
    elsif new.action = 'authorization.role_permissions.replaced' then
        v_alert_key := 'role_permissions_replaced';
        v_severity := 'high';
        v_title := 'Role permissions changed';
        v_summary := 'A role permission set was replaced.';
    elsif new.action = 'auth.sessions.revoked' then
        v_alert_key := 'sessions_revoked';
        v_severity := 'low';
        v_title := 'Sessions revoked';
        v_summary := 'A user session revocation command was completed.';
    else
        return new;
    end if;

    insert into public.security_alerts (
        tenant_id, source_type, source_id, alert_key, severity, title, summary,
        actor_user_id, request_id, correlation_id, trace_id, details, occurred_at
    ) values (
        new.tenant_id, 'audit_log', new.id, v_alert_key, v_severity, v_title, v_summary,
        new.actor_user_id, new.request_id,
        new.metadata->>'correlation_id', new.metadata->>'trace_id',
        jsonb_strip_nulls(jsonb_build_object(
            'action', new.action,
            'resource_type', new.resource_type,
            'decision', new.metadata->>'decision',
            'reason_code', new.metadata->>'reason_code'
        )),
        new.created_at
    )
    on conflict (source_type, source_id, alert_key) do nothing;
    return new;
end;
$$;

create or replace function public.capture_auth_provider_security_alert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_alert_key text;
    v_severity text;
    v_title text;
    v_summary text;
begin
    if new.event_type = 'user.banned' then
        v_alert_key := 'auth_user_banned';
        v_severity := 'high';
        v_title := 'Auth user banned';
        v_summary := 'Supabase Auth reported a user ban.';
    elsif new.event_type = 'user.deleted' then
        v_alert_key := 'auth_user_deleted';
        v_severity := 'high';
        v_title := 'Auth user deleted';
        v_summary := 'Supabase Auth reported a user deletion.';
    elsif new.event_type = 'session.revoked' then
        v_alert_key := 'auth_session_revoked';
        v_severity := 'medium';
        v_title := 'Auth session revoked';
        v_summary := 'Supabase Auth reported a session revocation.';
    else
        return new;
    end if;

    insert into public.security_alerts (
        tenant_id, source_type, source_id, alert_key, severity, title, summary,
        subject_user_id, request_id, correlation_id, trace_id, details, occurred_at
    ) values (
        new.tenant_id, 'auth_provider_event', new.id, v_alert_key, v_severity, v_title, v_summary,
        new.user_id, new.request_id,
        new.metadata->>'correlation_id', new.metadata->>'trace_id',
        jsonb_strip_nulls(jsonb_build_object(
            'provider', new.provider,
            'event_type', new.event_type,
            'processing_status', new.processing_status
        )),
        coalesce(new.occurred_at, new.received_at)
    )
    on conflict (source_type, source_id, alert_key) do nothing;
    return new;
end;
$$;

revoke all on function public.capture_audit_security_alert() from public, anon, authenticated;
revoke all on function public.capture_auth_provider_security_alert() from public, anon, authenticated;

drop trigger if exists audit_logs_security_alert_capture on public.audit_logs;
create trigger audit_logs_security_alert_capture
after insert on public.audit_logs
for each row execute function public.capture_audit_security_alert();

drop trigger if exists auth_provider_events_security_alert_capture on public.auth_provider_events;
create trigger auth_provider_events_security_alert_capture
after insert on public.auth_provider_events
for each row execute function public.capture_auth_provider_security_alert();
