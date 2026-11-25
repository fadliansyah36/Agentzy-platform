-- Phase 05 — Sales CRM, Provider Catalogue & Order
-- Additive only. Existing Phase 01-04 tables/migrations are not modified.
-- Recovery: pause sales workers, retain event/outbox rows, restore from PITR if needed.
-- No seed records are inserted: catalogue/provider/customer/lead data must be sourced.

create table if not exists public.sales_customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  customer_name text not null check (length(btrim(customer_name)) between 2 and 180),
  contact_name text not null check (length(btrim(contact_name)) between 2 and 160),
  email text,
  phone text,
  service_address text,
  region_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,id)
);
create index if not exists sales_customers_tenant_email_idx
  on public.sales_customers(tenant_id,lower(email)) where email is not null;

create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  customer_id uuid not null,
  source_prospect_id uuid references public.crm_prospects(id) on delete restrict,
  source text not null default 'manual',
  stage text not null default 'lead_created'
    check (stage in ('lead_created','assigned','contacted','qualified','coverage_checked','offer_presented','order_submitted','disqualified','closed')),
  qualification jsonb not null default '{}'::jsonb,
  assigned_user_id uuid references auth.users(id) on delete restrict,
  assigned_workforce_profile_id uuid,
  idempotency_key text not null,
  request_fingerprint text not null,
  follow_up_at timestamptz,
  last_activity_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,id),
  unique (tenant_id,source_prospect_id),
  unique (tenant_id,idempotency_key),
  foreign key (tenant_id,customer_id) references public.sales_customers(tenant_id,id) on delete restrict,
  foreign key (tenant_id,assigned_workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete restrict
);
create index if not exists sales_leads_tenant_stage_idx on public.sales_leads(tenant_id,stage,created_at desc,id desc);
create index if not exists sales_leads_assignee_idx on public.sales_leads(tenant_id,assigned_user_id,stage,follow_up_at);
create index if not exists sales_leads_workforce_idx on public.sales_leads(tenant_id,assigned_workforce_profile_id);

create table if not exists public.sales_lead_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  lead_id uuid not null,
  actor_user_id uuid references auth.users(id) on delete restrict,
  activity_type text not null,
  from_stage text,
  to_stage text,
  note text,
  source text not null default 'portal',
  evidence jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default now(),
  foreign key (tenant_id,lead_id) references public.sales_leads(tenant_id,id) on delete restrict
);
create index if not exists sales_lead_activities_timeline_idx
  on public.sales_lead_activities(tenant_id,lead_id,created_at desc,id desc);

create table if not exists public.sales_provider_products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  provider_profile_id uuid not null,
  product_code text not null,
  name text not null,
  category text not null,
  description text,
  service_regions jsonb not null default '[]'::jsonb,
  coverage_source text not null,
  requirements jsonb not null default '{}'::jsonb,
  pricing_reference jsonb not null default '{}'::jsonb,
  sla jsonb not null default '{}'::jsonb,
  eligibility jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','active','suspended','archived')),
  version integer not null default 1 check (version > 0),
  effective_from timestamptz,
  effective_until timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,id),
  unique (tenant_id,provider_profile_id,product_code,version),
  foreign key (tenant_id,provider_profile_id) references public.provider_profiles(tenant_id,id) on delete restrict,
  check (effective_until is null or effective_from is null or effective_until > effective_from)
);
create index if not exists sales_products_catalogue_idx
  on public.sales_provider_products(tenant_id,status,category,name);
create index if not exists sales_products_provider_idx
  on public.sales_provider_products(tenant_id,provider_profile_id,status);

create table if not exists public.sales_customer_consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  customer_id uuid not null,
  lead_id uuid,
  consent_type text not null check (consent_type in ('privacy','communication','coverage_check','order_submission','marketing')),
  purpose text not null,
  policy_version text not null,
  granted boolean not null,
  source text not null,
  captured_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (tenant_id,id),
  foreign key (tenant_id,customer_id) references public.sales_customers(tenant_id,id) on delete restrict,
  foreign key (tenant_id,lead_id) references public.sales_leads(tenant_id,id) on delete restrict,
  check ((granted and revoked_at is null) or not granted or revoked_at is not null)
);
create index if not exists sales_consents_lookup_idx
  on public.sales_customer_consents(tenant_id,customer_id,consent_type,captured_at desc);

create table if not exists public.sales_coverage_checks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  lead_id uuid not null,
  provider_profile_id uuid not null,
  product_id uuid,
  request_reference text not null,
  result_status text not null check (result_status in ('available','unavailable','unknown','failed')),
  source text not null,
  provider_reference text,
  checked_at timestamptz not null,
  response_metadata jsonb not null default '{}'::jsonb,
  error_code text,
  trace_id text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (tenant_id,id),
  foreign key (tenant_id,lead_id) references public.sales_leads(tenant_id,id) on delete restrict,
  foreign key (tenant_id,provider_profile_id) references public.provider_profiles(tenant_id,id) on delete restrict,
  foreign key (tenant_id,product_id) references public.sales_provider_products(tenant_id,id) on delete restrict
);
create index if not exists sales_coverage_lead_idx on public.sales_coverage_checks(tenant_id,lead_id,checked_at desc);

create table if not exists public.sales_offers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  lead_id uuid not null,
  product_id uuid not null,
  coverage_check_id uuid not null,
  product_version integer not null,
  pricing_snapshot jsonb not null,
  requirements_snapshot jsonb not null,
  status text not null default 'presented' check (status in ('presented','accepted','rejected','expired','withdrawn')),
  valid_until timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (tenant_id,id),
  foreign key (tenant_id,lead_id) references public.sales_leads(tenant_id,id) on delete restrict,
  foreign key (tenant_id,product_id) references public.sales_provider_products(tenant_id,id) on delete restrict,
  foreign key (tenant_id,coverage_check_id) references public.sales_coverage_checks(tenant_id,id) on delete restrict
);
create index if not exists sales_offers_lead_idx on public.sales_offers(tenant_id,lead_id,created_at desc);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  order_number text not null,
  lead_id uuid not null,
  customer_id uuid not null,
  consent_id uuid not null,
  offer_id uuid not null,
  provider_profile_id uuid not null,
  product_id uuid not null,
  assigned_workforce_profile_id uuid,
  status text not null default 'draft'
    check (status in ('draft','submitted','provider_pending','provider_approved','provider_rejected','installation_scheduled','installation_in_progress','activated','cancelled','failed')),
  provider_order_reference text,
  idempotency_key text not null,
  request_fingerprint text not null,
  customer_snapshot jsonb not null,
  product_snapshot jsonb not null,
  submitted_at timestamptz,
  activated_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,id),
  unique (tenant_id,order_number),
  unique (tenant_id,idempotency_key),
  foreign key (tenant_id,lead_id) references public.sales_leads(tenant_id,id) on delete restrict,
  foreign key (tenant_id,customer_id) references public.sales_customers(tenant_id,id) on delete restrict,
  foreign key (tenant_id,consent_id) references public.sales_customer_consents(tenant_id,id) on delete restrict,
  foreign key (tenant_id,offer_id) references public.sales_offers(tenant_id,id) on delete restrict,
  foreign key (tenant_id,provider_profile_id) references public.provider_profiles(tenant_id,id) on delete restrict,
  foreign key (tenant_id,product_id) references public.sales_provider_products(tenant_id,id) on delete restrict,
  foreign key (tenant_id,assigned_workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete restrict
);
create index if not exists sales_orders_tenant_status_idx on public.sales_orders(tenant_id,status,created_at desc);
create index if not exists sales_orders_provider_ref_idx on public.sales_orders(tenant_id,provider_profile_id,provider_order_reference);

create table if not exists public.sales_order_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  order_id uuid not null,
  event_type text not null,
  from_status text,
  to_status text,
  actor_user_id uuid references auth.users(id) on delete restrict,
  source text not null,
  reason text,
  evidence jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  trace_id text,
  created_at timestamptz not null default now(),
  unique (tenant_id,order_id,idempotency_key),
  foreign key (tenant_id,order_id) references public.sales_orders(tenant_id,id) on delete restrict
);
create index if not exists sales_order_events_timeline_idx on public.sales_order_events(tenant_id,order_id,created_at desc);

create table if not exists public.provider_integration_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  provider_profile_id uuid not null,
  adapter_key text not null check (adapter_key in ('http_json','webhook_only','secure_file_exchange')),
  endpoint_url text,
  health_url text,
  auth_env_key text,
  webhook_secret_env_key text,
  timeout_seconds integer not null default 15 check (timeout_seconds between 2 and 60),
  request_mapping jsonb not null default '{}'::jsonb,
  response_mapping jsonb not null default '{}'::jsonb,
  status_mapping jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,provider_profile_id),
  foreign key (tenant_id,provider_profile_id) references public.provider_profiles(tenant_id,id) on delete restrict
);
create index if not exists provider_integration_enabled_idx on public.provider_integration_configs(tenant_id,enabled);

create table if not exists public.provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  provider_profile_id uuid not null,
  external_event_id text not null,
  event_type text not null,
  payload_hash text not null,
  signature_verified boolean not null,
  event_timestamp timestamptz not null,
  processing_status text not null default 'received'
    check (processing_status in ('received','processed','ignored','failed','dead_letter')),
  mapped_order_id uuid,
  payload_metadata jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_code text,
  unique (provider_profile_id,external_event_id),
  foreign key (tenant_id,provider_profile_id) references public.provider_profiles(tenant_id,id) on delete restrict,
  foreign key (tenant_id,mapped_order_id) references public.sales_orders(tenant_id,id) on delete restrict
);
create index if not exists provider_webhook_processing_idx on public.provider_webhook_events(processing_status,received_at);

create table if not exists public.provider_submission_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  order_id uuid not null,
  provider_profile_id uuid not null,
  attempt_number integer not null check (attempt_number > 0),
  status text not null check (status in ('succeeded','retry','blocked_configuration','dead_letter')),
  request_hash text not null,
  response_hash text,
  provider_reference text,
  error_code text,
  duration_ms integer,
  created_at timestamptz not null default now(),
  unique (tenant_id,order_id,attempt_number),
  foreign key (tenant_id,order_id) references public.sales_orders(tenant_id,id) on delete restrict,
  foreign key (tenant_id,provider_profile_id) references public.provider_profiles(tenant_id,id) on delete restrict
);
create index if not exists provider_submission_order_idx on public.provider_submission_attempts(tenant_id,order_id,created_at desc);

create table if not exists public.sales_outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  dedupe_key text not null unique,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending','processing','retry','blocked_configuration','done','dead_letter')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  processed_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sales_outbox_ready_idx
  on public.sales_outbox(available_at,created_at) where status in ('pending','retry');

do $$
declare t text;
begin
  foreach t in array array[
    'sales_customers','sales_leads','sales_lead_activities','sales_provider_products',
    'sales_customer_consents','sales_coverage_checks','sales_offers','sales_orders',
    'sales_order_events','provider_integration_configs','provider_webhook_events',
    'provider_submission_attempts','sales_outbox'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated, service_role',t);
  end loop;
end $$;

insert into public.permissions(key,domain,action,description,resource,risk_level) values
 ('sales.leads.read','sales','read','Read tenant sales leads and activity timeline','sales_lead','sensitive'),
 ('sales.leads.manage','sales','manage','Create, assign and qualify tenant sales leads','sales_lead','privileged'),
 ('sales.catalogue.read','sales','read','Read provider and product catalogue','sales_catalogue','sensitive'),
 ('sales.catalogue.manage','sales','manage','Manage provider product catalogue and integration mapping','sales_catalogue','privileged'),
 ('sales.consent.manage','sales','manage','Capture and revoke customer consent','sales_consent','sensitive'),
 ('sales.coverage.check','sales','check','Request provider coverage validation','sales_coverage','sensitive'),
 ('sales.orders.read','sales','read','Read tenant orders and event history','sales_order','sensitive'),
 ('sales.orders.manage','sales','manage','Create and manage tenant orders','sales_order','privileged'),
 ('sales.orders.submit','sales','submit','Submit orders to an authorized provider adapter','sales_order','privileged')
on conflict(key) do update set domain=excluded.domain,action=excluded.action,description=excluded.description,resource=excluded.resource,risk_level=excluded.risk_level;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r cross join public.permissions p
where
 (r.key in ('platform_super_admin','platform_operations_admin') and p.key like 'sales.%')
 or (r.key in ('corporate_owner','corporate_admin','corporate_sales_manager','corporate_operations_manager','sales_manager','sales_supervisor')
     and p.key in ('sales.leads.read','sales.leads.manage','sales.catalogue.read','sales.consent.manage','sales.coverage.check','sales.orders.read','sales.orders.manage','sales.orders.submit'))
 or (r.key='sales_official' and p.key in ('sales.leads.read','sales.leads.manage','sales.catalogue.read','sales.consent.manage','sales.coverage.check','sales.orders.read','sales.orders.manage','sales.orders.submit'))
 or (r.key='corporate_auditor' and p.key in ('sales.leads.read','sales.catalogue.read','sales.orders.read'))
on conflict do nothing;

insert into public.access_policies(tenant_id,policy_key,resource,action,effect,conditions,priority,status,version,policy_name,description)
select null,v.policy_key,v.resource,v.action,'allow','{}'::jsonb,100,'active',1,v.policy_name,v.description
from (values
 ('sales.leads.read','sales.lead','read','Sales lead read','Read authorized tenant leads'),
 ('sales.leads.manage','sales.lead','manage','Sales lead manage','Manage authorized tenant leads'),
 ('sales.catalogue.read','sales.catalogue','read','Provider catalogue read','Read authorized provider catalogue'),
 ('sales.catalogue.manage','sales.catalogue','manage','Provider catalogue manage','Manage authorized product versions'),
 ('sales.consent.manage','sales.consent','manage','Customer consent manage','Capture and revoke consent'),
 ('sales.coverage.check','sales.coverage','check','Coverage check','Request an authorized provider coverage check'),
 ('sales.orders.read','sales.order','read','Sales order read','Read authorized tenant orders'),
 ('sales.orders.manage','sales.order','manage','Sales order manage','Manage authorized tenant orders'),
 ('sales.orders.submit','sales.order','submit','Sales order submit','Submit order to configured provider adapter')
) as v(policy_key,resource,action,policy_name,description)
where not exists (
 select 1 from public.access_policies ap
 where ap.tenant_id is null and ap.policy_key=v.policy_key and ap.status='active'
);
