-- Phase 04 engagement classification history and approval trail.
create table public.workforce_engagement_events (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete cascade,
 engagement_id uuid not null,
 workforce_profile_id uuid not null,
 event_type text not null check(event_type in ('created','activated','suspended','ended','superseded','amended')),
 from_status text,
 to_status text not null,
 actor_user_id uuid not null references auth.users(id) on delete restrict,
 reason text not null,
 metadata jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now(),
 foreign key(tenant_id,engagement_id) references public.workforce_engagements(tenant_id,id) on delete cascade,
 foreign key(tenant_id,workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete cascade
);
create index workforce_engagement_events_history_idx
 on public.workforce_engagement_events(tenant_id,workforce_profile_id,occurred_at desc);
alter table public.workforce_engagement_events enable row level security;
revoke all on public.workforce_engagement_events from anon,authenticated;
