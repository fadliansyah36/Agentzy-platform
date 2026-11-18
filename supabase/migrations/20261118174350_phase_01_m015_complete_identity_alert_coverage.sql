-- Phase 01 M014 — extend alert detection to membership, role and policy mutations.
-- Replaces only the two M013 trigger functions; existing alert records are preserved.

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
    elsif new.action in (
        'tenant.archived', 'tenant.created', 'tenant.updated',
        'organization.created', 'organization.updated',
        'branch.created', 'branch.updated', 'department.created', 'department.updated',
        'role.created', 'role.updated', 'role.deleted',
        'authorization.role_permissions.replaced',
        'access_policy.created', 'access_policy.updated',
        'access_policy.active', 'access_policy.inactive',
        'membership.invited', 'membership.assignment.reassigned',
        'membership.role.assigned', 'membership.role.replaced'
    ) then
        v_alert_key := replace(new.action, '.', '_');
        v_severity := 'high';
        v_title := 'Privileged access or tenant configuration changed';
        v_summary := 'A sensitive platform identity, role, policy, or tenant mutation occurred.';
    elsif new.action in ('membership.suspended', 'membership.revoked') then
        v_alert_key := replace(new.action, '.', '_');
        v_severity := 'medium';
        v_title := 'Membership lifecycle changed';
        v_summary := 'A tenant membership was suspended or revoked.';
    elsif new.action in ('membership.activated', 'membership.accepted') then
        v_alert_key := replace(new.action, '.', '_');
        v_severity := 'low';
        v_title := 'Membership activated or accepted';
        v_summary := 'A tenant membership invitation or activation was completed.';
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
    elsif new.event_type = 'password.recovery.requested' then
        v_alert_key := 'auth_password_recovery_requested';
        v_severity := 'low';
        v_title := 'Password recovery requested';
        v_summary := 'Supabase Auth reported a password recovery request.';
    elsif new.event_type = 'password.updated' then
        v_alert_key := 'auth_password_updated';
        v_severity := 'low';
        v_title := 'Password updated';
        v_summary := 'Supabase Auth reported a password update.';
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
