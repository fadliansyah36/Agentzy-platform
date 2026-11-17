-- Phase 01 extension: system role templates, permission catalogue and Auth profile sync.
-- No users, tenant memberships or credentials are seeded.
insert into public.roles (tenant_id,key,name,description,is_system) values
 (null,'platform_super_admin','Platform Super Admin','Full platform governance access',true),
 (null,'platform_security_admin','Platform Security Admin','Security, access control and audit governance',true),
 (null,'platform_finance_admin','Platform Finance Admin','Finance, billing and commission governance',true),
 (null,'platform_operations_admin','Platform Operations Admin','Tenant onboarding and operational governance',true),
 (null,'corporate_owner','Corporate Owner','Tenant owner with full corporate domain access',true),
 (null,'corporate_admin','Corporate Admin','Tenant administrator',true),
 (null,'corporate_director_viewer','Corporate Director Viewer','Read-only executive access',true),
 (null,'corporate_finance_manager','Corporate Finance Manager','Finance and billing operations',true),
 (null,'corporate_sales_manager','Corporate Sales Manager','Sales and affiliate operations',true),
 (null,'corporate_operations_manager','Corporate Operations Manager','Operations and work orders',true),
 (null,'corporate_workforce_manager','Corporate Workforce Manager','Human workforce operations',true),
 (null,'corporate_ai_manager','Corporate AI Manager','AI workforce management',true),
 (null,'corporate_auditor','Corporate Auditor','Read-only tenant audit access',true),
 (null,'ai_workforce_admin','AI Workforce Admin','AI worker, workflow and capability administration',true),
 (null,'ai_workforce_operator','AI Workforce Operator','AI workforce operations',true)
on conflict do nothing;

insert into public.permissions(key,domain,action,description) values
 ('platform.identity.read','platform.identity','read','Read identity and access context'),
 ('platform.identity.manage','platform.identity','manage','Manage platform identities'),
 ('platform.tenants.read','platform.tenants','read','Read tenant records'),
 ('platform.tenants.manage','platform.tenants','manage','Create and manage tenants'),
 ('platform.memberships.read','platform.memberships','read','Read memberships'),
 ('platform.memberships.manage','platform.memberships','manage','Invite and manage memberships'),
 ('platform.roles.read','platform.roles','read','Read role definitions'),
 ('platform.roles.manage','platform.roles','manage','Manage role definitions and assignments'),
 ('platform.security.manage','platform.security','manage','Manage platform security controls'),
 ('platform.audit.read','platform.audit','read','Read platform audit events'),
 ('platform.finance.read','platform.finance','read','Read platform financial data'),
 ('platform.finance.manage','platform.finance','manage','Manage platform finance and billing'),
 ('platform.operations.manage','platform.operations','manage','Manage platform operations'),
 ('corporate.overview.read','corporate.overview','read','Read corporate overview'),
 ('corporate.analytics.read','corporate.analytics','read','Read corporate analytics'),
 ('corporate.workforce.read','corporate.workforce','read','Read human workforce'),
 ('corporate.workforce.manage','corporate.workforce','manage','Manage human workforce'),
 ('corporate.sales.read','corporate.sales','read','Read sales and affiliate data'),
 ('corporate.sales.manage','corporate.sales','manage','Manage sales and affiliate operations'),
 ('corporate.operations.read','corporate.operations','read','Read technical operations'),
 ('corporate.operations.manage','corporate.operations','manage','Manage technical operations'),
 ('corporate.finance.read','corporate.finance','read','Read invoices and finance'),
 ('corporate.finance.manage','corporate.finance','manage','Manage invoices and finance'),
 ('corporate.ai.read','corporate.ai','read','Read AI workforce and credits'),
 ('corporate.ai.manage','corporate.ai','manage','Manage tenant AI workforce'),
 ('corporate.contracts.read','corporate.contracts','read','Read contracts'),
 ('corporate.contracts.manage','corporate.contracts','manage','Manage contracts'),
 ('corporate.organization.read','corporate.organization','read','Read organization and members'),
 ('corporate.organization.manage','corporate.organization','manage','Manage organization and members'),
 ('corporate.audit.read','corporate.audit','read','Read tenant audit events'),
 ('ai.workers.read','ai.workers','read','Read AI workers'),
 ('ai.workers.manage','ai.workers','manage','Manage AI workers'),
 ('ai.skills.read','ai.skills','read','Read AI skills'),
 ('ai.skills.manage','ai.skills','manage','Manage AI skills'),
 ('ai.tools.read','ai.tools','read','Read AI tools'),
 ('ai.tools.manage','ai.tools','manage','Manage AI tool permissions'),
 ('ai.memory.read','ai.memory','read','Read AI memory policies'),
 ('ai.memory.manage','ai.memory','manage','Manage AI memory policies'),
 ('ai.knowledge.read','ai.knowledge','read','Read knowledge sources'),
 ('ai.knowledge.manage','ai.knowledge','manage','Manage knowledge sources'),
 ('ai.workflows.read','ai.workflows','read','Read workflows and runs'),
 ('ai.workflows.manage','ai.workflows','manage','Manage workflows'),
 ('ai.approvals.read','ai.approvals','read','Read approval inbox'),
 ('ai.approvals.manage','ai.approvals','manage','Process approvals'),
 ('ai.audit.read','ai.audit','read','Read AI workforce audit events')
on conflict(key) do nothing;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where r.key='platform_super_admin' and p.key like 'platform.%'
on conflict do nothing;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r join public.permissions p on
 (r.key='platform_security_admin' and p.key in ('platform.identity.read','platform.roles.read','platform.roles.manage','platform.security.manage','platform.audit.read'))
 or (r.key='platform_finance_admin' and p.key in ('platform.finance.read','platform.finance.manage','platform.tenants.read','platform.audit.read'))
 or (r.key='platform_operations_admin' and p.key in ('platform.identity.read','platform.tenants.read','platform.tenants.manage','platform.memberships.read','platform.memberships.manage','platform.operations.manage','platform.audit.read'))
on conflict do nothing;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where r.key in ('corporate_owner','corporate_admin') and p.key like 'corporate.%'
on conflict do nothing;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r join public.permissions p on
 (r.key='corporate_director_viewer' and p.key in ('corporate.overview.read','corporate.analytics.read','corporate.workforce.read','corporate.sales.read','corporate.operations.read','corporate.finance.read','corporate.ai.read','corporate.contracts.read','corporate.organization.read','corporate.audit.read'))
 or (r.key='corporate_finance_manager' and p.key in ('corporate.overview.read','corporate.finance.read','corporate.finance.manage','corporate.contracts.read'))
 or (r.key='corporate_sales_manager' and p.key in ('corporate.overview.read','corporate.analytics.read','corporate.sales.read','corporate.sales.manage','corporate.workforce.read'))
 or (r.key='corporate_operations_manager' and p.key in ('corporate.overview.read','corporate.operations.read','corporate.operations.manage','corporate.workforce.read'))
 or (r.key='corporate_workforce_manager' and p.key in ('corporate.overview.read','corporate.workforce.read','corporate.workforce.manage','corporate.organization.read'))
 or (r.key='corporate_ai_manager' and p.key in ('corporate.overview.read','corporate.ai.read','corporate.ai.manage','ai.workers.read','ai.workers.manage','ai.skills.read','ai.skills.manage','ai.tools.read','ai.tools.manage','ai.memory.read','ai.memory.manage','ai.knowledge.read','ai.knowledge.manage','ai.workflows.read','ai.workflows.manage','ai.approvals.read','ai.approvals.manage'))
 or (r.key='corporate_auditor' and p.key in ('corporate.overview.read','corporate.analytics.read','corporate.finance.read','corporate.audit.read'))
on conflict do nothing;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where r.key='ai_workforce_admin' and p.key like 'ai.%'
on conflict do nothing;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r
join public.permissions p on p.key in ('ai.workers.read','ai.skills.read','ai.tools.read','ai.memory.read','ai.knowledge.read','ai.workflows.read','ai.approvals.read','ai.audit.read')
where r.key='ai_workforce_operator'
on conflict do nothing;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 insert into public.profiles(user_id,display_name)
 values(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name'))
 on conflict(user_id) do update
 set display_name=coalesce(excluded.display_name,public.profiles.display_name),updated_at=now();
 return new;
end;
$$;
revoke all on function public.handle_new_auth_user() from public,anon,authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();
