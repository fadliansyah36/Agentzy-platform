-- Complete missing ABAC actions for profile and training read/manage operations.
insert into public.access_policies(tenant_id,policy_key,resource,action,effect,conditions,priority,status,version,policy_name,description)
select null,v.policy_key,v.resource,v.action,'allow','{}'::jsonb,100,'active',1,v.policy_name,v.description
from (values
 ('workforce.profile.read','workforce.profile','read','Workforce profile read','Read self or authorized workforce profile'),
 ('workforce.profile.manage','workforce.profile','manage','Workforce profile manage','Manage tenant workforce profiles'),
 ('workforce.training.read','workforce.training','read','Workforce training read','Read and complete eligible training')
) as v(policy_key,resource,action,policy_name,description)
where not exists(select 1 from public.access_policies ap where ap.tenant_id is null and ap.policy_key=v.policy_key and ap.status='active');
