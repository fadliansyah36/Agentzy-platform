-- Phase 03 ABAC enforcement hardening.
-- Additive policy records: preserve existing policy versions and applied migrations.
-- Corporate API helpers enforce RBAC and these ABAC allow conditions together.

DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('phase03.corporate.profiles.read', 'corporate.profiles', 'read', 'corporate.profiles.read'),
      ('phase03.corporate.profiles.manage', 'corporate.profiles', 'manage', 'corporate.profiles.manage'),
      ('phase03.corporate.contracts.policy.manage', 'corporate.contracts', 'manage', 'corporate.contracts.policy.manage'),
      ('phase03.corporate.contracts.approve', 'corporate.contracts', 'approve', 'corporate.contracts.approve'),
      ('phase03.corporate.contracts.documents', 'corporate.contracts', 'manage', 'corporate.contracts.documents'),
      ('phase03.corporate.contracts.lifecycle', 'corporate.contracts', 'manage', 'corporate.contracts.lifecycle'),
      ('phase03.corporate.finance.invoice.read', 'corporate.finance', 'read', 'corporate.finance.invoice.read'),
      ('phase03.corporate.finance.invoice.manage', 'corporate.finance', 'manage', 'corporate.finance.invoice.manage'),
      ('phase03.corporate.entitlements.read', 'corporate.workforce', 'read', 'corporate.entitlements.read'),
      ('phase03.corporate.providers.read', 'corporate.providers', 'read', 'corporate.providers.read'),
      ('phase03.corporate.providers.manage', 'corporate.providers', 'manage', 'corporate.providers.manage')
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
        'Phase 03 corporate endpoint ABAC rule bound to the exact RBAC permission.'
      );
    END IF;
  END LOOP;
END $$;
