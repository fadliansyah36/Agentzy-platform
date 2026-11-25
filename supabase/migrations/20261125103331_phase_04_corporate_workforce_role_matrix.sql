-- Complete Corporate role matrix and read-only governance access.
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where r.tenant_id is null and (
 (r.key in ('corporate_admin','corporate_owner','corporate_workforce_manager','corporate_operations_manager')
  and p.key in ('workforce.profile.manage','workforce.engagement.manage','workforce.skills.manage','workforce.availability.manage','workforce.training.manage','workforce.onboarding.manage','workforce.assignments.manage','workforce.lifecycle.transition'))
 or (r.key in ('corporate_sales_manager','corporate_auditor','corporate_director_viewer')
  and p.key in ('workforce.profile.read','workforce.directory.read','workforce.engagement.read','workforce.skills.read','workforce.availability.read','workforce.training.read','workforce.onboarding.read','workforce.assignments.read'))
) on conflict do nothing;
