# Phase 01 — Session Security & Audit

## Session controls

- Access JWT validation checks signature, issuer, audience, expiry, end-user role, subject and session ID.
- Every authenticated request verifies that the session exists in `auth.sessions`, is not expired, belongs to the subject and is not associated with a deleted or banned Auth user.
- Every authenticated request checks `public.revoked_sessions`; a revoked session is rejected even if its signed access token has not expired.
- Logout writes revocation entries for active sessions belonging to the user. The browser then clears its local Supabase session; if the API cannot revoke, it falls back to Supabase global sign-out.
- Membership status and role permissions are read from the database for request authorization; no stale authorization cache is introduced.

## Audit events

FastAPI writes audit rows for profile changes, session revocation, invitation acceptance, tenant creation, organization changes, invitation/member changes and role assignment/permission replacement. Audit metadata excludes passwords, access tokens, refresh tokens and secrets.

## Remaining

Authentication success/failure correlation with Supabase Auth provider-native audit records, privileged break-glass approval lifecycle, session inventory UI, alerting/metrics and audit-reader authorization are incomplete. This is not a penetration test or security acceptance.
