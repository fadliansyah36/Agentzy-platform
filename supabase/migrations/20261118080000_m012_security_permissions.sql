begin;

insert into public.permissions(key,domain,action,description,resource,risk_level)
values
 ('platform.audit.export','platform.audit','export','Export platform-scoped audit records.','platform.audit','privileged'),
 ('corporate.audit.export','corporate.audit','export','Export tenant-scoped audit records.','corporate.audit','sensitive'),
 ('platform.security.break_glass.request','platform.security','request','Request time-bound emergency access.','platform.security','critical'),
 ('platform.security.break_glass.approve','platform.security','approve','Approve emergency access requested by another administrator.','platform.security','critical'),
 ('platform.security.break_glass.activate','platform.security','activate','Activate approved time-bound emergency access.','platform.security','critical'),
 ('platform.security.break_glass.revoke','platform.security','revoke','Revoke active emergency access.','platform.security','critical'),
 ('platform.security.break_glass.review','platform.security','review','Complete post-incident emergency access review.','platform.security','critical'),
 ('platform.security.events.manage','platform.security','manage_events','Manage trusted auth provider event ingestion.','platform.security','privileged'),
 ('platform.security.events.read','platform.security','read_events','Read auth provider event correlation records.','platform.security','sensitive')
on conflict (key) do nothing;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r
cross join public.permissions p
where r.tenant_id is null
  and r.key in ('platform_super_admin','platform_security_admin')
  and p.key in (
    'platform.audit.export',
    'platform.security.break_glass.request',
    'platform.security.break_glass.approve',
    'platform.security.break_glass.activate',
    'platform.security.break_glass.revoke',
    'platform.security.break_glass.review',
    'platform.security.events.manage',
    'platform.security.events.read'
  )
on conflict do nothing;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r
cross join public.permissions p
where r.tenant_id is null
  and r.key='corporate_admin'
  and p.key='corporate.audit.export'
on conflict do nothing;

insert into public.access_policies(
  tenant_id,policy_key,policy_name,description,resource,action,effect,
  conditions,priority,status,version
)
select null,'rbac_baseline:'||p.key,'RBAC baseline — '||p.key,
       'ABAC baseline requires the resolved subject to hold the matching permission key.',
       p.resource,p.action,'allow',
       jsonb_build_object('path','subject.permissions','op','contains','value',p.key),
       0,'active',1
from public.permissions p
where not exists (
  select 1 from public.access_policies a
  where a.tenant_id is null and a.policy_key='rbac_baseline:'||p.key
);

insert into public.access_policy_versions(policy_id,tenant_id,version,snapshot,changed_by)
select p.id,p.tenant_id,p.version,to_jsonb(p),p.updated_by
from public.access_policies p
where p.policy_key like 'rbac_baseline:%'
  and not exists (
    select 1 from public.access_policy_versions v
    where v.policy_id=p.id and v.version=p.version
  );

commit;