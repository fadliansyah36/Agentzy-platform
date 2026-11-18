# Phase 01 — Endpoint and Authorization Coverage Inventory

**Repository:** `fadliansyah36/Agentzy-platform`  
**Branch:** `main`  
**Audit date:** 2026-11-18  
**Disposition:** Inventory complete at router/handler level; authorization migration is PARTIAL.

This is a source inspection inventory, not a penetration test or proof that every runtime path is secure. It records route ownership and the observed authorization pattern. It does not claim complete IDOR/BOLA closure.

## 1. Route inventory

| Router | Method and path | Resource/action | Observed authorization | Status |
|---|---|---|---|---|
| identity | GET `/me` | Own identity read | Authenticated identity; self-scoped query | COVERED (self scope) |
| identity | PATCH `/me` | Own profile update | Authenticated identity; self-scoped update; idempotency | COVERED (self scope) |
| identity | GET `/me/permissions` | Own effective permissions | Resolved memberships/roles | COVERED (self scope) |
| identity | GET `/me/invitations` | Own invitations | Filtered by authenticated user ID | COVERED (self scope) |
| identity | POST `/auth/session/revoke` | Own session revocation | Authenticated identity; idempotency | COVERED (self scope) |
| tenants | GET `/tenants` | Own tenant list | Authenticated membership-scoped query | COVERED |
| tenants | GET `/tenants/{tenant_id}/organizations` | Organization list | Central `authorize_action` | COVERED |
| tenant_structure | GET `/tenants/{tenant_id}` | Tenant read | Central tenant + ABAC helper | COVERED |
| tenant_structure | PATCH `/tenants/{tenant_id}/organizations/{organization_id}` | Organization update/archive state | Central tenant + ABAC; object scope; hierarchy/cycle checks | COVERED (route-level) |
| tenant_structure | GET/POST `/tenants/{tenant_id}/organization-units` | Organization unit list/create | Central tenant + ABAC; object scope on create | COVERED (route-level) |
| tenant_structure | GET/POST `/tenants/{tenant_id}/branches` | Branch list/create | Central tenant + ABAC; object scope | COVERED (route-level) |
| tenant_structure | PATCH `/tenants/{tenant_id}/branches/{branch_id}` | Branch update | Central tenant + ABAC; object lookup/scope | COVERED (route-level) |
| tenant_structure | POST `/tenants/{tenant_id}/branches/{branch_id}/archive` | Branch archive | Central tenant + ABAC; lifecycle/dependency checks | COVERED (route-level) |
| tenant_structure | POST `/tenants/{tenant_id}/branches/{branch_id}/restore` | Branch restore | Central tenant + ABAC | COVERED (route-level) |
| tenant_structure | GET/POST `/tenants/{tenant_id}/departments` | Department list/create | Central tenant + ABAC; object scope | COVERED (route-level) |
| tenant_structure | PATCH `/tenants/{tenant_id}/departments/{department_id}` | Department update | Central tenant + ABAC; object lookup/scope | COVERED (route-level) |
| tenant_structure | POST `/tenants/{tenant_id}/departments/{department_id}/archive` | Department archive | Central tenant + ABAC; lifecycle/dependency checks | COVERED (route-level) |
| tenant_structure | POST `/tenants/{tenant_id}/departments/{department_id}/restore` | Department restore | Central tenant + ABAC | COVERED (route-level) |
| tenant_structure | POST `/tenants/{tenant_id}/memberships/{membership_id}/accept` | Accept own invitation | Explicit authenticated-user ownership, verified email, expiry and tenant-state checks; idempotency | COVERED (self transition) |
| tenant_structure | POST `/tenants/{tenant_id}/memberships/{membership_id}/suspend` | Suspend membership | Central tenant + ABAC; membership row lookup; idempotency | COVERED (route-level) |
| tenant_structure | POST `/tenants/{tenant_id}/memberships/{membership_id}/revoke` | Revoke membership | Central tenant + ABAC; membership row lookup; idempotency | COVERED (route-level) |
| tenant_structure | POST `/tenants/{tenant_id}/memberships/{membership_id}/roles` | Assign scoped role | Central tenant + ABAC; role scope validation; idempotency | COVERED (route-level) |
| tenant_structure | GET `/tenants/{tenant_id}/workforce-context` | Workforce identity/hierarchy context | Candidate permission checks through central ABAC helper | COVERED (route-level) |
| management | POST `/tenants` | Create tenant + owner membership | Platform role/permission gate; idempotency | PARTIAL (platform ABAC parity not proven) |
| management | POST `/tenants/{tenant_id}/organizations` | Create organization | Central tenant + ABAC helper; idempotency | COVERED (route-level) |
| management | POST `/tenants/{tenant_id}/memberships/invite` | Invite member | Central tenant + ABAC helper; invitation ownership/scope; idempotency | COVERED (route-level) |
| management | GET `/tenants/{tenant_id}/memberships` | Membership directory | Central tenant + ABAC helper | COVERED (route-level) |
| management | GET `/permissions` | Permission registry | Platform role/permission gate | PARTIAL (admin access is role-gated; not all read context uses ABAC) |
| management | GET `/roles` | Role catalogue | Platform role/permission gate or tenant scope | PARTIAL |
| management | PUT `/roles/{role_id}/permissions` | Replace role permissions | Platform role/permission gate + MFA; idempotency | PARTIAL (object/scope ABAC parity not proven) |
| management | GET `/tenants/directory` | Platform tenant directory | Platform role/permission gate | PARTIAL |
| management | PATCH `/tenants/{tenant_id}` | Tenant update | Platform role/permission gate | PARTIAL (object-level ABAC parity not proven) |
| management | DELETE `/tenants/{tenant_id}` | Tenant archive | Platform role/permission gate | PARTIAL (object-level ABAC parity not proven) |
| management | POST/PATCH/DELETE `/roles`, `/roles/{role_id}` | Role lifecycle | Platform role/permission gate | PARTIAL (object/scope ABAC parity not proven) |
| access_policies | GET/POST `/security/access-policies` | ABAC policy list/create | AAL2 + platform security permission via central platform ABAC | COVERED (admin scope) |
| access_policies | PATCH `/security/access-policies/{policy_id}` | Policy update/version | AAL2 + platform security permission; version snapshot and audit | COVERED (admin scope) |
| access_policies | POST `/security/access-policies/{policy_id}/activate` | Policy activation | AAL2 + platform security permission; version snapshot and audit | COVERED (admin scope) |
| access_policies | POST `/security/access-policies/{policy_id}/disable` | Policy disable | AAL2 + platform security permission; version snapshot and audit | COVERED (admin scope) |
| access_policies | GET `/security/access-policies/{policy_id}/versions` | Policy history | AAL2 + platform security permission | COVERED (admin scope) |
| security_lifecycle | POST `/security/auth-provider-events` | Provider event ingestion | Shared secret comparison; unique provider event ID; idempotent insert | COVERED (webhook source) |
| security_lifecycle | POST `/security/break-glass/requests` | Emergency access request | AAL2 + central platform ABAC; permission/tenant allowlist; reason; idempotency | COVERED (API checks; no live user evidence) |
| security_lifecycle | POST `/security/break-glass/requests/{id}/approve` | Approve | AAL2 + central platform ABAC; requester/approver separation | COVERED (API checks; no live user evidence) |
| security_lifecycle | POST `/security/break-glass/requests/{id}/reject` | Reject | AAL2 + central platform ABAC; requester/approver separation | COVERED (API checks; no live user evidence) |
| security_lifecycle | POST `/security/break-glass/requests/{id}/activate` | Activate | AAL2; approved state; requester-only activation; duration bound | COVERED (API checks; no live user evidence) |
| security_lifecycle | POST `/security/break-glass/requests/{id}/revoke` | Revoke | AAL2; requester/approver scope; state validation | COVERED (API checks; no live user evidence) |
| security_lifecycle | POST `/security/break-glass/requests/{id}/review` | Post-incident review | AAL2; requester excluded; review notes | COVERED (API checks; no live user evidence) |
| security_lifecycle | GET `/security/break-glass/requests` | Request list | AAL2 + platform security permission | COVERED (admin scope) |
| security_lifecycle | GET `/security/audit`, `/security/audit/export` | Audit read/export | Permission-specific platform/tenant scope checks | PARTIAL (redaction and all object-level filters not fully evidenced) |
| bootstrap | POST `/bootstrap/platform-admin` | First admin bootstrap | One-time bootstrap token and initial setup checks | COVERED (special bootstrap trust boundary) |

## 2. Central helper status

- `resolve_tenant_context` resolves active membership and scoped roles/permissions.
- `authorize_tenant` validates membership and platform permission fallback.
- `authorize_object` validates tenant, organization, organization unit, branch and department scope.
- `authorize_action` combines tenant context/RBAC with dynamic ABAC policy evaluation and writes a decision audit.
- `authorize_platform_action` combines platform permission checks with global ABAC evaluation.
- ABAC conditions are JSON-only and validated against an operator allowlist; no `eval`, arbitrary SQL expression or dynamic code execution is used.

## 3. Confirmed gaps

1. Management tenant/role endpoints that use direct `_has_platform_permission` checks are not yet consistently routed through `authorize_platform_action`; object-level ABAC coverage is therefore incomplete.
2. A complete machine-generated inventory of every HTTP operation and all nested repository/service calls has not yet been added to CI.
3. The live policy set contains 67 global ALLOW baselines and no tenant DENY policies. Deny precedence is covered by deterministic unit tests, but tenant-specific policy administration and operating procedure are not demonstrated with live tenant records.
4. No Auth users exist in the live project at audit time; membership, password recovery delivery, break-glass and audit-reader flows have not been exercised with actual user identities.
5. Audit redaction, tenant-scoped export boundaries and all legacy list-query filters need deeper route-by-route review.
6. This is engineering source review only. No UAT, staging, penetration/security acceptance, load test or production release testing was run.

## 4. Acceptance status

**PARTIAL / IN PROGRESS.** The inventory identifies multiple central-helper-covered routes but does not support the claim that every sensitive endpoint has completed central object-level authorization.
