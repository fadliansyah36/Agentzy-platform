-- Seed explicit global ABAC allow policies for the new platform partnership permissions.
with inserted as (
  insert into public.access_policies
    (tenant_id,policy_key,policy_name,description,resource,action,effect,conditions,priority,status,version)
  values
    (null,'platform.partnership.read','Platform partnership read','Allow platform users with the matching permission to read partnership prospects.','platform.partnership','read','allow','{}'::jsonb,100,'active',1),
    (null,'platform.partnership.manage','Platform partnership manage','Allow platform users with the matching permission to manage partnership prospects.','platform.partnership','manage','allow','{}'::jsonb,100,'active',1)
  on conflict (tenant_id,policy_key) do update set
    policy_name=excluded.policy_name,description=excluded.description,
    resource=excluded.resource,action=excluded.action,effect=excluded.effect,
    conditions=excluded.conditions,priority=excluded.priority,status='active',
    version=public.access_policies.version+1,updated_at=now()
  returning *
)
insert into public.access_policy_versions(policy_id,tenant_id,version,snapshot,changed_by)
select id,tenant_id,version,to_jsonb(inserted),null from inserted;
