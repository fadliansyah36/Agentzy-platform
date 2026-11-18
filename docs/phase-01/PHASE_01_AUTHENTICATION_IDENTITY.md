# Phase 01 — Authentication & Identity

## Existing baseline

Supabase Auth is the identity provider. The existing profile table is an internal projection keyed by Supabase Auth user ID; it is not a second password store.

## Current implementation

- JWT signature is validated through Supabase JWKS, with the configured legacy HS256 secret path where applicable.
- Issuer, audience, expiry, end-user role, UUID subject and UUID session ID are required.
- Current request identity is checked against `auth.sessions` and `auth.users`; deleted or banned users and expired/missing sessions are denied.
- A session present in `public.revoked_sessions` is denied. Database verification failure returns 503 (fail closed).
- `GET /api/v1/me` resolves the profile and active memberships in active tenants.
- `PATCH /api/v1/me` updates display name, locale and timezone through FastAPI.
- `GET /api/v1/me/permissions` returns role and permission resolution per active membership.
- `GET /api/v1/me/invitations` lists pending invitations for the authenticated subject only.
- `POST /api/v1/tenants/{tenant_id}/memberships/{membership_id}/accept` explicitly accepts an invitation after email verification.
- `POST /api/v1/auth/session/revoke` revokes active Auth sessions in the application denylist. The browser hook then clears its local Supabase session.

## Important sequencing

The new verifier depends on M010's `revoked_sessions` table. Apply and verify M010 before deploying the backend change. Until then, this source is not runtime-compatible with the unchanged live schema.

## Remaining

Password recovery UI consistency across all portals, authentication success/failure event correlation and full protected-route review remain open.
