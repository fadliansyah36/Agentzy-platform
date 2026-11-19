-- Applied migration 20261119160842: allow Corporate AI Manager to read contract-backed entitlements.
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r
join public.permissions p on p.key in ('corporate.entitlements.read','corporate.contracts.read')
where r.key='corporate_ai_manager'
on conflict do nothing;
