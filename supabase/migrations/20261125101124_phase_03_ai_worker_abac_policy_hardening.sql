-- Phase 03 AI Worker ABAC policy records.
-- Additive policy records: preserve existing policy versions and applied migrations.

DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('phase03.corporate.ai_workers.read', 'corporate.ai', 'read', 'corporate.ai_workers.read'),
      ('phase03.corporate.ai_workers.manage', 'corporate.ai', 'manage', 'corporate.ai_workers.manage')
    ) AS policies(policy_key, resource, action, permission_key)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.access_policies p
      WHERE p.tenant_id IS NULL AND p.policy_key = item.policy_key
    ) THEN
      INSERT INTO public.access_policies(
        tenant_id, policy_key, resource, action, effect, conditions,
        priority, status, version, policy_name, description
      ) VALUES (
        NULL, item.policy_key, item.resource, item.action, 'allow',
        jsonb_build_object('op', 'contains', 'path', 'subject.permissions', 'value', item.permission_key),
        120, 'active', 1, item.policy_key,
        'Phase 03 AI Worker endpoint ABAC rule bound to the exact RBAC permission.'
      );
    END IF;
  END LOOP;
END $$;
