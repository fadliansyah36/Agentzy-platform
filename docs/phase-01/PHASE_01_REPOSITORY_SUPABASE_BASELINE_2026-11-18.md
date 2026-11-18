# Phase 01 — Repository & Supabase Baseline (2026-11-18)

## Repository

- Canonical repository: `fadliansyah36/Agentzy-platform`
- Branch: `main`
- HEAD before this implementation increment: `219e750267b6ceb33312ae58133da8a83127566f`
- GitHub connector permissions include admin/maintain/push.
- `apps/api/` contains the FastAPI modular monolith.
- `apps/web/lib/auth/useAgentzyAuth.ts` provides shared Supabase Auth state for Admin, Corporate and AI Workforce portals.
- `components/workforce/WorkforcePortalClient.tsx` previously lacked the shared identity gate.
- `supabase/migrations/` already contains three historical Phase 01 migrations:
  - `20261117175948_phase_01_platform_core_identity_tenant`
  - `20261117181011_phase_01_system_roles_permissions_auth_profile`
  - `20261117182410_phase_01_profile_email_projection`

## Historical audit discrepancy

`docs/AGENTZY_REPOSITORY_SUPABASE_AUDIT_2026-11-17.md` is a dated historical snapshot. Its earlier structural observations must not be reused as the current state without reconciliation. The current branch has FastAPI and migration source; the live project has nine public application tables and three recorded Phase 01 migrations.

## Supabase

- Project: Agentzy-db
- Ref: `cwhjdnkotuhueeudpgeu`
- Status: ACTIVE_HEALTHY
- PostgreSQL: 17.12.0.000
- Region: ap-northeast-1
- Existing public tables: profiles, tenants, organizations, memberships, roles, permissions, role_permissions, membership_roles, audit_logs.
- RLS enabled on all nine; FORCE RLS not enabled.
- Existing policies are SELECT-oriented.
- Broad privileges were observed for anon/authenticated/service_role on existing tables.
- `public.rls_auto_enable()` remains SECURITY DEFINER and had a fail-open exception handler; Security Advisor findings 0028/0029 were observed.
- `auth.sessions` contains id, user_id, not_after and session metadata; `auth.users` exposes deleted_at and banned_until for account-state verification.
- The connected project reported zero Auth users in the baseline inspection.

## Migration disposition

Three historical migrations remain untouched. New M010 is additive and source-only. It is not applied because no verified backup/recovery artifact is available in the connected environment. The database was not modified in this implementation increment.
