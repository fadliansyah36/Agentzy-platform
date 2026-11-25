-- Phase 04 Human Workforce Passport & Onboarding. Additive, no business seed data.
create table if not exists public.workforce_profiles (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete restrict, membership_id uuid references public.memberships(id) on delete set null,
 worker_code text not null, display_name text not null, legal_name text, job_family text, job_title text,
 lifecycle_status text not null default 'registered' check(lifecycle_status in ('invited','registered','identity_pending','verified','onboarding','eligible','active','inactive','suspended','offboarded')),
 engagement_status text not null default 'pending' check(engagement_status in ('pending','active','inactive','suspended','ended')),
 timezone text not null default 'Asia/Jakarta', locale text not null default 'id-ID',
 experience_years numeric(5,2) not null default 0 check(experience_years>=0), profile_metadata jsonb not null default '{}'::jsonb,
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_id,user_id), unique(tenant_id,worker_code), unique(tenant_id,id)
);
create index if not exists workforce_profiles_tenant_status_idx on public.workforce_profiles(tenant_id,lifecycle_status,created_at desc);
create index if not exists workforce_profiles_user_idx on public.workforce_profiles(user_id,updated_at desc);
create table if not exists public.workforce_identity_verifications (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 workforce_profile_id uuid not null, status text not null default 'pending' check(status in ('pending','in_review','verified','rejected','expired')),
 verification_type text not null default 'identity' check(verification_type in ('identity','address','right_to_work','background_check','other')),
 document_metadata jsonb not null default '[]'::jsonb, submitted_at timestamptz not null default now(),
 reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz, rejection_reason text, reviewer_notes text,
 expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(tenant_id,workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete cascade,
 check(status<>'rejected' or (rejection_reason is not null and length(trim(rejection_reason))>=3)),
 check(status not in ('verified','rejected') or (reviewed_by is not null and reviewed_at is not null)), unique(tenant_id,id)
);
create index if not exists workforce_identity_verifications_queue_idx on public.workforce_identity_verifications(tenant_id,status,submitted_at);
create table if not exists public.workforce_engagements (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 workforce_profile_id uuid not null, classification text not null check(classification in ('employee','outsourced_worker','independent_contractor','freelance','affiliate','technical_partner','project_based_worker')),
 agreement_reference text not null, effective_from date not null, effective_until date,
 status text not null default 'pending' check(status in ('pending','active','suspended','ended','superseded')),
 legal_review_reference text, facts_acknowledged boolean not null default false, change_reason text,
 created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(tenant_id,workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete cascade,
 check(effective_until is null or effective_until>=effective_from), unique(tenant_id,id)
);
create index if not exists workforce_engagements_profile_idx on public.workforce_engagements(tenant_id,workforce_profile_id,effective_from desc);
create table if not exists public.workforce_skill_registry (
 id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id) on delete cascade,
 skill_key text not null, name text not null, category text not null, description text,
 status text not null default 'active' check(status in ('active','deprecated')), created_at timestamptz not null default now(),
 unique nulls not distinct(tenant_id,skill_key)
);
create table if not exists public.workforce_worker_skills (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 workforce_profile_id uuid not null, skill_id uuid not null references public.workforce_skill_registry(id) on delete restrict,
 proficiency text not null check(proficiency in ('beginner','intermediate','advanced','expert')),
 experience_months integer not null default 0 check(experience_months>=0), verified boolean not null default false,
 verified_by uuid references auth.users(id) on delete set null, verified_at timestamptz, evidence_reference text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(tenant_id,workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete cascade,
 unique(tenant_id,workforce_profile_id,skill_id), check(not verified or (verified_by is not null and verified_at is not null))
);
create index if not exists workforce_worker_skills_lookup_idx on public.workforce_worker_skills(tenant_id,skill_id,proficiency);
create table if not exists public.workforce_certifications (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 workforce_profile_id uuid not null, skill_id uuid references public.workforce_skill_registry(id) on delete set null,
 name text not null, issuer text not null, certificate_reference text, issued_at date, valid_from date, expires_at date,
 evidence_metadata jsonb not null default '{}'::jsonb,
 verification_status text not null default 'pending' check(verification_status in ('pending','verified','rejected','expired')),
 verified_by uuid references auth.users(id) on delete set null, verified_at timestamptz, rejection_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(tenant_id,workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete cascade,
 check(expires_at is null or valid_from is null or expires_at>=valid_from),
 check(verification_status<>'verified' or (verified_by is not null and verified_at is not null)), unique(tenant_id,id)
);
create index if not exists workforce_certifications_expiry_idx on public.workforce_certifications(tenant_id,expires_at,verification_status);
create table if not exists public.workforce_availability (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 workforce_profile_id uuid not null, availability_type text not null check(availability_type in ('working_hours','unavailable','leave','preferred_shift')),
 starts_at timestamptz not null, ends_at timestamptz not null, timezone text not null, recurrence_rule text, reason text,
 status text not null default 'active' check(status in ('active','cancelled')), created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(), check(ends_at>starts_at),
 foreign key(tenant_id,workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete cascade, unique(tenant_id,id)
);
create index if not exists workforce_availability_period_idx on public.workforce_availability(tenant_id,workforce_profile_id,starts_at,ends_at) where status='active';
create table if not exists public.workforce_training_courses (
 id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id) on delete cascade,
 course_key text not null, title text not null, description text, materials jsonb not null default '[]'::jsonb,
 assessment jsonb not null default '{}'::jsonb, eligibility_rules jsonb not null default '{}'::jsonb,
 validity_days integer check(validity_days is null or validity_days between 1 and 3650),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique nulls not distinct(tenant_id,course_key)
);
create table if not exists public.workforce_training_enrollments (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 workforce_profile_id uuid not null, course_id uuid not null references public.workforce_training_courses(id) on delete restrict,
 status text not null default 'enrolled' check(status in ('enrolled','in_progress','completed','failed','expired','cancelled')),
 progress_percent numeric(5,2) not null default 0 check(progress_percent between 0 and 100),
 assessment_score numeric(5,2) check(assessment_score between 0 and 100), assessment_result jsonb not null default '{}'::jsonb,
 enrolled_at timestamptz not null default now(), completed_at timestamptz, certificate_reference text, certificate_expires_at timestamptz,
 updated_at timestamptz not null default now(),
 foreign key(tenant_id,workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete cascade,
 unique(tenant_id,workforce_profile_id,course_id), unique(tenant_id,id)
);
create index if not exists workforce_training_enrollment_idx on public.workforce_training_enrollments(tenant_id,workforce_profile_id,status);
create table if not exists public.workforce_onboarding_tasks (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 workforce_profile_id uuid not null, task_key text not null, title text not null, description text,
 required boolean not null default true, task_type text not null check(task_type in ('document','agreement_acknowledgement','training','verification','approval','other')),
 status text not null default 'pending' check(status in ('pending','in_progress','completed','waived','blocked')),
 assigned_to uuid references auth.users(id) on delete set null, due_at timestamptz,
 completed_by uuid references auth.users(id) on delete set null, completed_at timestamptz, completion_reference text, reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(tenant_id,workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete cascade,
 unique(tenant_id,workforce_profile_id,task_key), unique(tenant_id,id)
);
create index if not exists workforce_onboarding_tasks_idx on public.workforce_onboarding_tasks(tenant_id,workforce_profile_id,status,due_at);
create table if not exists public.workforce_assignments (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 workforce_profile_id uuid not null, assignment_reference text not null, assignment_type text not null,
 starts_at timestamptz not null, ends_at timestamptz, status text not null default 'scheduled' check(status in ('scheduled','active','completed','cancelled')),
 workload_units numeric(8,2) not null default 1 check(workload_units>=0), created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), foreign key(tenant_id,workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete cascade,
 check(ends_at is null or ends_at>starts_at), unique(tenant_id,id)
);
create index if not exists workforce_assignments_period_idx on public.workforce_assignments(tenant_id,workforce_profile_id,starts_at,ends_at,status);
create table if not exists public.workforce_lifecycle_events (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 workforce_profile_id uuid not null, from_status text, to_status text not null,
 actor_user_id uuid not null references auth.users(id) on delete restrict, reason text not null, permission_key text not null,
 request_id text, metadata jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now(),
 foreign key(tenant_id,workforce_profile_id) references public.workforce_profiles(tenant_id,id) on delete cascade
);
create index if not exists workforce_lifecycle_events_history_idx on public.workforce_lifecycle_events(tenant_id,workforce_profile_id,occurred_at desc);
alter table public.workforce_profiles enable row level security;
alter table public.workforce_identity_verifications enable row level security;
alter table public.workforce_engagements enable row level security;
alter table public.workforce_skill_registry enable row level security;
alter table public.workforce_worker_skills enable row level security;
alter table public.workforce_certifications enable row level security;
alter table public.workforce_availability enable row level security;
alter table public.workforce_training_courses enable row level security;
alter table public.workforce_training_enrollments enable row level security;
alter table public.workforce_onboarding_tasks enable row level security;
alter table public.workforce_assignments enable row level security;
alter table public.workforce_lifecycle_events enable row level security;
revoke all on public.workforce_profiles,public.workforce_identity_verifications,public.workforce_engagements,public.workforce_skill_registry,public.workforce_worker_skills,public.workforce_certifications,public.workforce_availability,public.workforce_training_courses,public.workforce_training_enrollments,public.workforce_onboarding_tasks,public.workforce_assignments,public.workforce_lifecycle_events from anon,authenticated;
insert into public.permissions(key,domain,action,description,resource,risk_level) values
 ('workforce.profile.read','workforce.profile','read','Read workforce passport','workforce.profile','standard'),
 ('workforce.profile.manage','workforce.profile','manage','Manage workforce profiles','workforce.profile','privileged'),
 ('workforce.identity.submit','workforce.identity','submit','Submit identity evidence','workforce.identity','sensitive'),
 ('workforce.identity.review','workforce.identity','review','Review identity verification','workforce.identity','critical'),
 ('workforce.engagement.read','workforce.engagement','read','Read engagement classification','workforce.engagement','standard'),
 ('workforce.engagement.manage','workforce.engagement','manage','Manage engagement classification','workforce.engagement','privileged'),
 ('workforce.skills.read','workforce.skills','read','Read skills and certifications','workforce.skills','standard'),
 ('workforce.skills.manage','workforce.skills','manage','Manage skills registry','workforce.skills','privileged'),
 ('workforce.certifications.verify','workforce.certifications','verify','Verify certification evidence','workforce.certifications','sensitive'),
 ('workforce.availability.read','workforce.availability','read','Read availability','workforce.availability','standard'),
 ('workforce.availability.manage','workforce.availability','manage','Manage availability','workforce.availability','sensitive'),
 ('workforce.training.read','workforce.training','read','Read training catalogue and progress','workforce.training','standard'),
 ('workforce.training.manage','workforce.training','manage','Manage training','workforce.training','privileged'),
 ('workforce.onboarding.read','workforce.onboarding','read','Read onboarding workflow','workforce.onboarding','standard'),
 ('workforce.onboarding.manage','workforce.onboarding','manage','Manage onboarding workflow','workforce.onboarding','privileged'),
 ('workforce.lifecycle.transition','workforce.lifecycle','transition','Transition lifecycle','workforce.lifecycle','critical'),
 ('workforce.assignments.read','workforce.assignments','read','Read assignment history','workforce.assignments','standard'),
 ('workforce.assignments.manage','workforce.assignments','manage','Manage assignments','workforce.assignments','privileged')
on conflict(key) do update set domain=excluded.domain,action=excluded.action,description=excluded.description,resource=excluded.resource,risk_level=excluded.risk_level;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p where r.tenant_id is null and (
 (r.key in ('sales_official','sales_supervisor','sales_manager','technician','affiliate_worker','field_quality_inspector','support_agent') and p.key in ('workforce.profile.read','workforce.skills.read','workforce.availability.read','workforce.training.read','workforce.assignments.read','workforce.onboarding.read'))
 or (r.key='sales_manager' and p.key in ('workforce.profile.manage','workforce.engagement.read','workforce.engagement.manage','workforce.skills.manage','workforce.availability.manage','workforce.training.manage','workforce.onboarding.manage','workforce.assignments.manage','workforce.lifecycle.transition'))
 or (r.key='field_quality_inspector' and p.key in ('workforce.identity.review','workforce.certifications.verify'))
 or (r.key in ('technician','affiliate_worker') and p.key in ('workforce.identity.submit','workforce.availability.manage'))
) on conflict do nothing;
insert into public.access_policies(tenant_id,policy_key,resource,action,effect,conditions,priority,status,version,policy_name,description)
select null,'workforce.'||x.r||'.'||x.a,'workforce.'||x.r,x.a,'allow','{}'::jsonb,100,'active',1,'Workforce '||x.r||' '||x.a,'Phase 04 API policy'
from (values ('profile','read'),('profile','manage'),('identity','submit'),('identity','review'),('engagement','read'),('engagement','manage'),('skills','read'),('skills','manage'),('certifications','verify'),('availability','read'),('availability','manage'),('training','read'),('training','manage'),('onboarding','read'),('onboarding','manage'),('lifecycle','transition'),('assignments','read'),('assignments','manage')) x(r,a)
where not exists(select 1 from public.access_policies p where p.tenant_id is null and p.resource='workforce.'||x.r and p.action=x.a and p.status='active');
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('workforce-private-documents','workforce-private-documents',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
