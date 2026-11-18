# Phase 01 — RBAC / ABAC / Permission Matrix

## Central model

- `roles` and `permissions` remain the shared registry.
- `role_permissions` maps role templates to permission keys.
- `membership_roles` assigns roles to memberships with scope type, scope ID, start and expiry.
- Supported scope types: platform, tenant, organization, organization unit, branch and department.
- Platform role assignments are normalized to platform scope; tenant role assignment cannot grant `platform.*` keys.
- Elevated corporate role assignment is restricted to a tenant owner or an MFA-verified platform membership administrator.
- Permission registry: `GET /api/v1/permissions`.
- Role permission replacement: `PUT /api/v1/roles/{role_id}/permissions`, requiring platform role-management permission and AAL2.

## ABAC foundation

The shared authorization module resolves active tenant membership, role scope, permission keys and hierarchy attributes. Object authorization compares resource tenant and hierarchy scope with the resolved context. Missing permissions and out-of-scope resources are denied.

## Remaining

The `access_policies` table is storage foundation only. A complete dynamic condition evaluator (resource classification, ownership attributes, status transitions and contextual conditions), policy administration endpoints, full route coverage and UI permission matrix integration remain incomplete.
