# Phase 01 — Membership Lifecycle

- Tenant creation creates an owner membership and assigns the tenant-scoped `corporate_owner` role.
- Member invitation creates or reissues a membership in `invited` state with inviter and seven-day expiry metadata.
- Invitations may carry organization, organization-unit, branch and department scope; composite foreign keys validate the scope against the target tenant.
- `GET /api/v1/me/invitations` lists pending invitations belonging to the authenticated user.
- A verified Auth identity explicitly accepts an invitation through the tenant membership accept endpoint. Activation sets `accepted_at` and `joined_at`.
- Membership suspension sets status to `suspended`; revocation sets status to `revoked` and records `ended_at`.
- Role assignment stores scope type, scope ID and validity interval on `membership_roles`.
- Authorization resolution reads membership and role state on each request; suspended/revoked membership and role changes are not hidden by an application permission cache.

## Remaining

Membership transfer, reactivation policy, last-owner protection, bulk invitation workflows, invitation delivery evidence and full organization-scope management UI remain open.
