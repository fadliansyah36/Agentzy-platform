-- Applied remote migration: 20261119153845_phase_03_corporate_contract_domain_completion
-- Additive Phase 03 schema. No previously-applied migration is modified.

alter table public.corporate_profiles
 add column if not exists organization_id uuid references public.organizations(id) on delete restrict,
 add column if not exists branch_id uuid references public.branches(id) on delete restrict,
 add column if not exists profile_status text not null default 'active',
 add column if not exists status_reason text,
 add column if not exists archived_at timestamptz,
 add column if not exists contact_name text,
 add column if not exists contact_title text,
 add column if not exists website text,
 add column if not exists country_code char(2) not null default 'ID';
alter table public.corporate_profiles drop constraint if exists corporate_profiles_profile_status_check;
alter table public.corporate_profiles add constraint corporate_profiles_profile_status_check
 check (profile_status in ('draft','active','suspended','archived'));

alter table public.contracts
 add column if not exists organization_id uuid references public.organizations(id) on delete restrict,
 add column if not exists branch_id uuid references public.branches(id) on delete restrict,
 add column if not exists parent_contract_id uuid references public.contracts(id) on delete restrict,
 add column if not exists signed_at timestamptz,
 add column if not exists renewal_notice_days integer not null default 60,
 add column if not exists suspended_at timestamptz,
 add column if not exists suspension_reason text,
 add column if not exists terminated_at timestamptz,
 add column if not exists termination_reason text,
 add column if not exists expiry_notified_at timestamptz,
 add column if not exists row_version integer not null default 1;
alter table public.contracts drop constraint if exists contracts_renewal_notice_days_check;
alter table public.contracts add constraint contracts_renewal_notice_days_check
 check (renewal_notice_days between 0 and 365);

alter table public.contract_services
 add column if not exists kpi jsonb not null default '{}'::jsonb,
 add column if not exists human_workforce_limit integer,
 add column if not exists ai_worker_limit integer,
 add column if not exists ai_credits_limit numeric(18,2),
 add column if not exists effective_start date,
 add column if not exists effective_end date;
alter table public.contract_services drop constraint if exists contract_services_human_limit_check;
alter table public.contract_services add constraint contract_services_human_limit_check
 check (human_workforce_limit is null or human_workforce_limit >= 0);
alter table public.contract_services drop constraint if exists contract_services_ai_limit_check;
alter table public.contract_services add constraint contract_services_ai_limit_check
 check (ai_worker_limit is null or ai_worker_limit >= 0);
alter table public.contract_services drop constraint if exists contract_services_ai_credits_check;
alter table public.contract_services add constraint contract_services_ai_credits_check
 check (ai_credits_limit is null or ai_credits_limit >= 0);

create table if not exists public.contract_approval_policies (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 policy_name text not null,
 contract_type text not null check (contract_type in ('master','statement_of_work','amendment')),
 currency char(3) not null default 'IDR',
 min_amount numeric(18,2) not null default 0 check (min_amount >= 0),
 max_amount numeric(18,2),
 is_active boolean not null default true,
 created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (tenant_id,policy_name),
 check (max_amount is null or max_amount >= min_amount)
);
create index if not exists contract_approval_policies_tenant_active_idx
 on public.contract_approval_policies(tenant_id,is_active,contract_type);
create table if not exists public.contract_approval_policy_steps (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 policy_id uuid not null references public.contract_approval_policies(id) on delete restrict,
 step_number integer not null check (step_number > 0),
 required_permission_key text not null references public.permissions(key) on delete restrict,
 required_role_key text,
 minimum_approvals integer not null default 1 check (minimum_approvals > 0),
 created_at timestamptz not null default now(),
 unique (policy_id,step_number)
);
create index if not exists contract_approval_policy_steps_policy_idx
 on public.contract_approval_policy_steps(policy_id,step_number);
alter table public.contract_approvals
 add column if not exists policy_id uuid references public.contract_approval_policies(id) on delete restrict,
 add column if not exists delegated_from_user_id uuid references auth.users(id) on delete restrict,
 add column if not exists decision_idempotency_key text,
 add column if not exists decision_fingerprint text;
create unique index if not exists contract_approvals_decision_idem_idx
 on public.contract_approvals(tenant_id,decision_idempotency_key)
 where decision_idempotency_key is not null;

create table if not exists public.contract_approval_delegations (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 delegator_user_id uuid not null references auth.users(id) on delete restrict,
 delegatee_user_id uuid not null references auth.users(id) on delete restrict,
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 reason text not null,
 status text not null default 'active' check (status in ('active','revoked','expired')),
 created_by uuid not null references auth.users(id) on delete restrict,
 revoked_by uuid references auth.users(id) on delete restrict,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 check (delegatee_user_id <> delegator_user_id),
 check (ends_at > starts_at)
);
create index if not exists contract_approval_delegations_active_idx
 on public.contract_approval_delegations(tenant_id,delegator_user_id,starts_at,ends_at)
 where status='active';

create table if not exists public.contract_documents (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 contract_id uuid not null references public.contracts(id) on delete restrict,
 contract_version_id uuid,
 document_type text not null check (document_type in ('master_agreement','statement_of_work','sla','amendment','supporting')),
 original_filename text not null,
 object_path text not null unique,
 content_type text not null,
 file_size bigint not null check (file_size > 0 and file_size <= 26214400),
 sha256 text,
 lifecycle_status text not null default 'upload_pending'
   check (lifecycle_status in ('upload_pending','available','rejected','archived')),
 uploaded_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 verified_at timestamptz,
 archived_at timestamptz,
 foreign key (tenant_id,contract_version_id) references public.contract_versions(tenant_id,id) on delete restrict
);
create index if not exists contract_documents_contract_idx
 on public.contract_documents(tenant_id,contract_id,created_at desc);

create table if not exists public.contract_renewals (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 contract_id uuid not null references public.contracts(id) on delete restrict,
 renewal_type text not null check (renewal_type in ('renewal','extension')),
 requested_start date,
 requested_end date not null,
 requested_terms text,
 status text not null default 'requested'
  check (status in ('requested','review_pending','approved','rejected','completed','cancelled')),
 idempotency_key text not null,
 requested_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 decided_by uuid references auth.users(id) on delete restrict,
 decided_at timestamptz,
 unique (tenant_id,idempotency_key),
 check (requested_start is null or requested_end >= requested_start)
);
create index if not exists contract_renewals_contract_idx
 on public.contract_renewals(tenant_id,contract_id,created_at desc);

create table if not exists public.contract_invoices (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 contract_id uuid not null references public.contracts(id) on delete restrict,
 invoice_number text not null,
 title text not null,
 currency char(3) not null default 'IDR',
 subtotal numeric(18,2) not null check (subtotal >= 0),
 tax_amount numeric(18,2) not null default 0 check (tax_amount >= 0),
 total_amount numeric(18,2) not null check (total_amount >= 0),
 status text not null default 'draft' check (status in ('draft','issued','partially_paid','paid','overdue','cancelled')),
 issued_at timestamptz,
 due_at date,
 idempotency_key text not null,
 created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (tenant_id,invoice_number),
 unique (tenant_id,idempotency_key),
 check (total_amount = subtotal + tax_amount)
);
create index if not exists contract_invoices_tenant_due_idx
 on public.contract_invoices(tenant_id,status,due_at);
create table if not exists public.contract_invoice_lines (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 invoice_id uuid not null references public.contract_invoices(id) on delete restrict,
 contract_service_id uuid references public.contract_services(id) on delete restrict,
 description text not null,
 quantity numeric(18,4) not null check (quantity > 0),
 unit_amount numeric(18,2) not null check (unit_amount >= 0),
 line_amount numeric(18,2) not null check (line_amount >= 0),
 created_at timestamptz not null default now()
);
create index if not exists contract_invoice_lines_invoice_idx
 on public.contract_invoice_lines(tenant_id,invoice_id);
create table if not exists public.contract_payment_references (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 invoice_id uuid not null references public.contract_invoices(id) on delete restrict,
 reference_number text not null,
 payment_method text not null,
 amount numeric(18,2) not null check (amount > 0),
 status text not null default 'reference_created'
   check (status in ('reference_created','submitted','confirmed','rejected','reconciled')),
 external_reference text,
 evidence_path text,
 submitted_at timestamptz,
 verified_by uuid references auth.users(id) on delete restrict,
 verified_at timestamptz,
 reconciled_at timestamptz,
 idempotency_key text not null,
 created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 unique (tenant_id,reference_number),
 unique (tenant_id,idempotency_key)
);
create index if not exists contract_payment_references_invoice_idx
 on public.contract_payment_references(tenant_id,invoice_id,status,created_at desc);

create table if not exists public.contract_entitlement_grants (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 contract_id uuid not null references public.contracts(id) on delete restrict,
 contract_version_id uuid not null,
 service_key text not null references public.public_catalogue_items(service_key) on delete restrict,
 service_scope jsonb not null default '{}'::jsonb,
 sla jsonb not null default '{}'::jsonb,
 kpi jsonb not null default '{}'::jsonb,
 human_workforce_limit integer,
 ai_worker_limit integer,
 ai_credits_limit numeric(18,2),
 status text not null default 'pending' check (status in ('pending','active','suspended','expired','revoked')),
 effective_start date,
 effective_end date,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key (tenant_id,contract_version_id) references public.contract_versions(tenant_id,id) on delete restrict,
 unique (contract_version_id,service_key),
 check (human_workforce_limit is null or human_workforce_limit >= 0),
 check (ai_worker_limit is null or ai_worker_limit >= 0),
 check (ai_credits_limit is null or ai_credits_limit >= 0)
);
create index if not exists contract_entitlement_active_idx
 on public.contract_entitlement_grants(tenant_id,status,effective_start,effective_end);
alter table public.contract_events add column if not exists idempotency_key text;
create unique index if not exists contract_events_idempotency_idx
 on public.contract_events(tenant_id,idempotency_key) where idempotency_key is not null;

insert into public.permissions(key,domain,action,description,resource,risk_level)
values
 ('corporate.profiles.read','corporate.profiles','read','Read corporate legal and organization profile.','corporate_profile','sensitive'),
 ('corporate.profiles.manage','corporate.profiles','manage','Manage corporate legal and organization profile.','corporate_profile','privileged'),
 ('corporate.contracts.documents','corporate.contracts','documents','Upload and access contract documents.','contract_document','sensitive'),
 ('corporate.contracts.lifecycle','corporate.contracts','lifecycle','Suspend, terminate and renew contracts.','contract','critical'),
 ('corporate.contracts.policy.manage','corporate.contracts','policy_manage','Manage contract approval policies.','approval_policy','privileged'),
 ('corporate.finance.invoice.read','corporate.finance','invoice_read','Read contract invoices and payment references.','contract_invoice','sensitive'),
 ('corporate.finance.invoice.manage','corporate.finance','invoice_manage','Create and manage invoice and payment references.','contract_invoice','privileged'),
 ('corporate.entitlements.read','corporate.entitlements','read','Read effective tenant service entitlements.','entitlement','sensitive')
on conflict(key) do update set domain=excluded.domain,action=excluded.action,
 description=excluded.description,resource=excluded.resource,risk_level=excluded.risk_level;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where (r.key in ('corporate_owner','corporate_admin') and p.key in (
 'corporate.profiles.read','corporate.profiles.manage','corporate.contracts.documents',
 'corporate.contracts.lifecycle','corporate.contracts.policy.manage',
 'corporate.finance.invoice.read','corporate.finance.invoice.manage','corporate.entitlements.read'))
 or (r.key='corporate_finance_manager' and p.key in (
 'corporate.profiles.read','corporate.contracts.read','corporate.contracts.documents',
 'corporate.finance.invoice.read','corporate.finance.invoice.manage','corporate.entitlements.read'))
 or (r.key='corporate_auditor' and p.key in (
 'corporate.profiles.read','corporate.contracts.read','corporate.finance.invoice.read','corporate.entitlements.read'))
on conflict do nothing;

alter table public.contract_approval_policies enable row level security;
alter table public.contract_approval_policy_steps enable row level security;
alter table public.contract_approval_delegations enable row level security;
alter table public.contract_documents enable row level security;
alter table public.contract_renewals enable row level security;
alter table public.contract_invoices enable row level security;
alter table public.contract_invoice_lines enable row level security;
alter table public.contract_payment_references enable row level security;
alter table public.contract_entitlement_grants enable row level security;
revoke all on public.contract_approval_policies,public.contract_approval_policy_steps,
 public.contract_approval_delegations,public.contract_documents,public.contract_renewals,
 public.contract_invoices,public.contract_invoice_lines,public.contract_payment_references,
 public.contract_entitlement_grants from public,anon,authenticated,service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('contract-documents','contract-documents',false,26214400,
 array['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,
 allowed_mime_types=excluded.allowed_mime_types;
