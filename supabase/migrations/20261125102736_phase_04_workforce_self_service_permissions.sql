-- Workforce self-service permissions for every registered human worker class.
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where r.tenant_id is null
and r.key in ('sales_official','sales_supervisor','sales_manager','technician','affiliate_worker')
and p.key in ('workforce.identity.submit','workforce.availability.manage')
on conflict do nothing;
