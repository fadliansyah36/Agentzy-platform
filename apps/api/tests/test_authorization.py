from unittest import TestCase
from uuid import uuid4

from fastapi import HTTPException

from app.core.authorization import TenantAccessContext, authorize_object, require_permission


class AuthorizationBoundaryTests(TestCase):
    def setUp(self):
        self.tenant_id = uuid4()
        self.organization_id = uuid4()
        self.branch_id = uuid4()
        self.context = TenantAccessContext(
            user_id=uuid4(),
            tenant_id=self.tenant_id,
            membership_id=uuid4(),
            organization_id=self.organization_id,
            organization_unit_id=None,
            branch_id=self.branch_id,
            department_id=None,
            permissions=frozenset({"corporate.organization.read"}),
            role_keys=frozenset({"corporate_admin"}),
        )

    def test_allows_resource_inside_assigned_scope(self):
        authorize_object(
            self.context,
            resource_tenant_id=self.tenant_id,
            organization_id=self.organization_id,
            branch_id=self.branch_id,
        )

    def test_denies_cross_tenant_resource(self):
        with self.assertRaises(HTTPException) as raised:
            authorize_object(
                self.context,
                resource_tenant_id=uuid4(),
                organization_id=self.organization_id,
                branch_id=self.branch_id,
            )
        self.assertEqual(raised.exception.status_code, 404)

    def test_denies_cross_branch_resource(self):
        with self.assertRaises(HTTPException) as raised:
            authorize_object(
                self.context,
                resource_tenant_id=self.tenant_id,
                organization_id=self.organization_id,
                branch_id=uuid4(),
            )
        self.assertEqual(raised.exception.status_code, 404)

    def test_permission_is_deny_by_default(self):
        with self.assertRaises(HTTPException) as raised:
            require_permission(self.context, "corporate.organization.manage")
        self.assertEqual(raised.exception.status_code, 403)

    def test_granted_permission_is_accepted(self):
        require_permission(self.context, "corporate.organization.read")
