-- Phase 05: immutable sales attribution snapshots linked to Phase 04 workforce.
create table if not exists public.order_attributions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  sales_order_id uuid not null,
  attributed_worker_id uuid not null,
  attribution_type text not null check (attribution_type in ('sales_personal','affiliate')),
  share_basis numeric(9,6) not null default 1.000000 check (share_basis > 0 and share_basis <= 1),
  attribution_status text not null default 'provisional'
    check (attribution_status in ('provisional','locked','reversed')),
  source text not null default 'lead_assignment',
  reason text,
  evidence jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  constraint order_attributions_tenant_id_id_key unique (tenant_id,id),
  constraint order_attributions_tenant_order_worker_type_key
    unique (tenant_id,sales_order_id,attributed_worker_id,attribution_type),
  constraint order_attributions_tenant_idempotency_key_key unique (tenant_id,idempotency_key),
  constraint order_attributions_order_fk
    foreign key (tenant_id,sales_order_id) references public.sales_orders(tenant_id,id) on delete restrict,
  constraint order_attributions_worker_fk
    foreign key (tenant_id,attributed_worker_id) references public.workforce_profiles(tenant_id,id) on delete restrict
);

create unique index if not exists order_attributions_one_active_type_idx
  on public.order_attributions(tenant_id,sales_order_id,attribution_type)
  where attribution_status in ('provisional','locked');
create index if not exists order_attributions_worker_status_idx
  on public.order_attributions(tenant_id,attributed_worker_id,attribution_status);
create index if not exists order_attributions_order_created_idx
  on public.order_attributions(tenant_id,sales_order_id,created_at desc);

alter table public.order_attributions enable row level security;
drop policy if exists order_attributions_deny_client_access on public.order_attributions;
create policy order_attributions_deny_client_access
  on public.order_attributions for all to anon,authenticated
  using (false) with check (false);
revoke all on table public.order_attributions from anon,authenticated,service_role;

comment on table public.order_attributions is
  'Immutable tenant-scoped sales order attribution snapshots; provisional until provider approval and locked at accepted provider state.';
