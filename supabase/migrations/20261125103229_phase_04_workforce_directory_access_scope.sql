-- Restrict tenant-wide workforce directory visibility to management roles.
insert into public.permissions(key,domain,action,description,resource,risk_level)
values('workforce.directory.read','workforce.profile','directory_read','Read tenant workforce directory','workforce.profile','sensitive')
on conflict(key) do update set domain=excluded.domain,action=excluded.action,description=excluded.description,resource=excluded.resource,risk_level=excluded.risk_level;
insert into public.role_permissions(role_id,permission_key)
select r.id,'workforce.directory.read' from public.roles r
where r.tenant_id is null and r.key in ('sales_manager','corporate_admin','corporate_owner','corporate_workforce_manager','corporate_operations_manager','platform_super_admin','platform_operations_admin')
on conflict do nothing;
insert into public.access_policies(tenant_id,policy_key,resource,action,effect,conditions,priority,status,version,policy_name,description)
select null,'workforce.profile.directory_read','workforce.profile','directory_read','allow','{}'::jsonb,100,'active',1,
 'Workforce directory read','Tenant-scoped management directory access'
where not exists(select 1 from public.access_policies where tenant_id is null and policy_key='workforce.profile.directory_read' and status='active');
