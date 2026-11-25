-- Phase 04 access alignment for Corporate Workforce and Super Admin portals.
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where r.tenant_id is null and (
 (r.key in ('corporate_admin','corporate_owner','corporate_workforce_manager','corporate_operations_manager')
   and p.key in ('workforce.profile.read','workforce.engagement.read','workforce.skills.read','workforce.availability.read','workforce.training.read','workforce.onboarding.read','workforce.assignments.read','workforce.identity.review','workforce.certifications.verify'))
 or (r.key in ('corporate_workforce_manager','corporate_operations_manager')
   and p.key in ('workforce.profile.manage','workforce.engagement.manage','workforce.skills.manage','workforce.availability.manage','workforce.training.manage','workforce.onboarding.manage','workforce.assignments.manage','workforce.lifecycle.transition'))
 or (r.key in ('platform_super_admin','platform_operations_admin')
   and p.key in ('workforce.profile.read','workforce.profile.manage','workforce.identity.review','workforce.engagement.read','workforce.engagement.manage','workforce.skills.read','workforce.skills.manage','workforce.certifications.verify','workforce.availability.read','workforce.availability.manage','workforce.training.read','workforce.training.manage','workforce.onboarding.read','workforce.onboarding.manage','workforce.lifecycle.transition','workforce.assignments.read','workforce.assignments.manage'))
) on conflict do nothing;
