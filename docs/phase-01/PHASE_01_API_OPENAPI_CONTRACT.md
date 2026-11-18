# Phase 01 — API & OpenAPI Contract

All endpoints are under `/api/v1`. Authentication uses a Supabase Auth access token; FastAPI resolves identity and live session state.

| Method | Path | Purpose | Authorization |
|---|---|---|---|
| GET | /me | Current profile + active memberships | Authenticated |
| PATCH | /me | Update display name, locale, timezone | Own identity |
| GET | /me/permissions | Effective roles/permissions per active membership | Authenticated |
| GET | /me/invitations | List pending invitations for current identity | Authenticated subject only |
| POST | /auth/session/revoke | Revoke active sessions for current user | Own identity |
| GET | /tenants | List active memberships in active tenants | Authenticated |
| GET | /tenants/{tenant_id} | Tenant detail | Tenant read or platform tenant read + AAL2 |
| GET/POST | /tenants/{tenant_id}/organization-units | List/create organization units | Organization read/manage |
| GET/POST | /tenants/{tenant_id}/branches | List/create branches | Organization read/manage |
| GET/POST | /tenants/{tenant_id}/departments | List/create departments | Organization read/manage |
| PATCH | /tenants/{tenant_id}/organizations/{organization_id} | Update organization | Organization manage |
| POST | /tenants/{tenant_id}/memberships/{membership_id}/accept | Explicit invitation acceptance | Own invited membership + verified email |
| POST | /tenants/{tenant_id}/memberships/{membership_id}/suspend | Suspend membership | Tenant manage or platform membership manage + AAL2 |
| POST | /tenants/{tenant_id}/memberships/{membership_id}/revoke | Revoke membership | Tenant manage or platform membership manage + AAL2 |
| POST | /tenants/{tenant_id}/memberships/{membership_id}/roles | Assign scoped role | Tenant manage or platform membership manage + AAL2 |
| GET | /permissions | Permission registry | Authenticated |
| GET | /roles | Role catalogue | Tenant role read or platform role read + AAL2 |
| PUT | /roles/{role_id}/permissions | Replace role permission keys | Platform role manage + AAL2 |

Existing tenant creation/update, organization list/create, membership invite/list and bootstrap routes remain in the management/tenant routers.

FastAPI generates OpenAPI from route declarations. OpenAPI generation and the new paths must be confirmed by the commit-triggered CI run. Collection pagination, universal idempotency headers, complete response schemas and remaining CRUD contracts are not yet complete.
