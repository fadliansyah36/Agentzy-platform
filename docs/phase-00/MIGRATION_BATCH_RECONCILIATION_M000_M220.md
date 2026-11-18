# Blueprint Migration Batch Reconciliation — Phase 00

Date: 18 November 2026  
Canonical target: Supabase project `cwhjdnkotuhueeudpgeu` (`Agentzy-db`)  
Evidence: Supabase `get_project(id=...)`, `list_migrations(project_id=...)`, catalog inventory, Blueprint §5.2.

## Live baseline

- Project is `ACTIVE_HEALTHY`, PostgreSQL `17.12.0.000`, region `ap-northeast-1`.
- Supabase project migration API returned an empty Agentzy migration list.
- The `public` schema has no Agentzy application relations in the baseline.
- Supabase-managed schema histories (`auth`, `storage`, `realtime`) are platform-owned and excluded from Agentzy batch accounting.
- No migration has been applied as part of this reconciliation.

## Batch-by-batch reconciliation

The phase and scope labels below preserve Technical Implementation Blueprint v1.0 §5.2. Current target state is empty application schema and empty Agentzy migration history. “Not applied — future phase” is intentional; it is not permission to create all batches now.

| Batch | Phase | Blueprint scope | Current reconciliation |
|---|---:|---|---|
| M000 | 00 | Baseline inspection, migration inventory, extensions policy | Inspection evidence captured; extension policy still needs formal sign-off; no schema migration |
| M010 | 01 | Tenants, organizations, users mapping, memberships, RBAC, audit | Not applied — Phase 01; reconcile Auth identity mapping and domain schema before authoring |
| M020 | 02 | Partnership applications, public service catalogue, consent | Not applied — future phase |
| M030 | 03 | Corporate profiles, contracts, versions, SOW, entitlements, invoices | Not applied — future phase |
| M040 | 04 | Workforce profiles, contracts, skills, availability, training | Not applied — future phase |
| M050 | 05 | Providers, products, leads, customers, orders, attribution, provider events | Not applied — future phase |
| M060 | 06 | Affiliate profiles, invitations, agreements, referral, attribution | Not applied — future phase |
| M070 | 07 | Commission schemes, versions, rules, events, calculations, ledger, payout | Not applied — future phase |
| M080 | 08 | Technicians, work orders, assignments, events, evidence, QC, SLA | Not applied — future phase |
| M090 | 09 | Model registry, AI policies, usage metering, gateway configuration | Not applied — future phase |
| M100 | 10 | AI worker registry, versions, skills/tools bindings, approvals | Not applied — future phase |
| M110 | 11 | Skill packages/versions, tool registry, knowledge documents/chunks | Not applied — future phase |
| M120 | 12 | Memory records, permissions, retention, access logs | Not applied — future phase |
| M130 | 13 | AI runs, steps, events, checkpoints, execution leases | Not applied — future phase |
| M140 | 14 | Workflow definitions, versions, runs, steps, approvals | Not applied — future phase |
| M150 | 15 | Role catalogue, evaluation, performance measurement configuration | Not applied — future phase |
| M160 | 16 | AI credit wallets, transactions, reservations, top-ups, budgets | Not applied — future phase |
| M170 | 17 | Analytics events, aggregates, KPI definitions/targets/measurements, reports | Not applied — future phase |
| M180 | 18 | Integration records, credentials references, webhooks, notifications, outbox | Not applied — future phase |
| M190 | 19 | Governance, feature flags, incident/security operations configuration | Not applied — future phase |
| M200 | 20 | Cross-domain constraints, indexes, consistency fixes, cleanup of obsolete paths | Not applied — future phase |
| M210 | 21 | Retention/deletion jobs, data subject request, finance close metadata | Not applied — future phase |
| M220 | 22 | Final migration reconciliation and release-readiness schema freeze | Not applied — Phase 22 release gate |

## Required control before each batch

1. Re-read AGENTS.md, PRD and the relevant Blueprint domain section.
2. Refresh live project metadata, schema relations/columns/constraints/indexes, migration history, extensions, policies, grants, functions, triggers and Storage/Realtime dependencies.
3. Check duplicates and naming/source-of-truth overlap against the PRD data inventory; never create a duplicate table/column just because a conceptual name appears in the Blueprint.
4. Produce a phase-scoped migration with RLS, grants, constraints, indexes, expand/migrate/contract plan, rollback/recovery notes and corresponding API/OpenAPI contract.
5. Apply only to the canonical Supabase project after the phase's migration is reviewed and authorized; record version, result, operator identity and timestamp.
6. Run the minimum deterministic migration/schema checks required by AGENTS.md; real-world/UAT/staging and release testing remain Phase 22.

## M000 disposition

M000 is an audit and migration-policy baseline batch, not a fabricated schema bootstrap. The repository evidence and this reconciliation document are the M000 audit artifacts. Formal closure still depends on the remaining Phase 00 acceptance gates: complete dependency/license/SBOM and asset/env inventory, Auth/Data API configuration evidence, approved security disposition for `rls_auto_enable()`, final ownership/route mapping, and Phase 00 sign-off.

No DDL, migration, project setting, privilege or function was changed by this reconciliation.


## Superseding live reconciliation — 18 November 2026

This section supersedes the earlier live-baseline statements above where they conflict with the later applied Phase 01 migrations. The earlier empty-schema/empty-history result is retained as historical evidence only.

### Current canonical evidence

- Repository HEAD before this re-audit documentation: `4d3db7b36df411aefc5ad81aaa04e5892d99493c`.
- Supabase project `Agentzy-db` / `cwhjdnkotuhueeudpgeu` is `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`.
- Remote migration history contains three entries: `20261117175948`, `20261117181011`, `20261117182410`.
- All three source files exist under `supabase/migrations/`; source SHA values at the audited HEAD:
  - `20261117175948_phase_01_platform_core_identity_tenant.sql` — `fa02e6baea9a66fe97995413f168eda8ad92b913`
  - `20261117181011_phase_01_system_roles_permissions_auth_profile.sql` — `d21b3d7fc855fc74d0e8ec55f560bc1399a3dec9`
  - `20261117182410_phase_01_profile_email_projection.sql` — `7cd386788c97bab6d731443a16184172724b9389`
- Live `public` application schema has nine tables: `profiles`, `tenants`, `organizations`, `memberships`, `roles`, `permissions`, `role_permissions`, `membership_roles`, `audit_logs`. RLS is enabled on 9/9; FORCE RLS is false on all nine.
- Live catalog has 15 system role templates, 45 permission keys and 134 role-permission links. No Auth users or Storage buckets are present.
- The third migration's `profiles.email` and `profiles_email_lower_idx` are present in the live catalog.

### Reconciliation decision

| Batch | Status | Source / remote / schema result | Domain owner and next control |
|---|---|---|---|
| M000 | NOT APPLICABLE as DDL | Phase 00 audit/policy artifacts exist; no M000 schema migration or remote migration entry | Database Governance; close with evidence and approval, not a fabricated schema bootstrap |
| M010 | APPLIED | Three Phase 01 source files match three remote migration-history entries; nine live tables and RLS 9/9 | Identity & Tenant; do not rewrite applied migrations; any corrections must be additive |
| M020 | NOT APPLIED | No source migration, remote history entry or partnership application tables | Partnership Acquisition; implement only in Phase 02 |
| M030 | NOT APPLIED | No source migration, remote history entry or corporate commercial tables | Corporate & Commercial; implement only in Phase 03 |
| M040 | NOT APPLIED | No source migration, remote history entry or workforce tables | Human Workforce; implement only in Phase 04 |
| M050 | NOT APPLIED | No source migration, remote history entry or provider/sales tables | Provider, Product & Sales; implement only in Phase 05 |
| M060 | NOT APPLIED | No source migration, remote history entry or affiliate tables | Affiliate; implement only in Phase 06 |
| M070 | NOT APPLIED | No source migration, remote history entry or commission tables | Commission; implement only in Phase 07 |
| M080 | NOT APPLIED | No source migration, remote history entry or technical operations tables | Technical Operations; implement only in Phase 08 |
| M090 | NOT APPLIED | No source migration, remote history entry or model/usage tables | AI Platform & Model Governance; implement only in Phase 09 |
| M100 | NOT APPLIED | No source migration, remote history entry or AI worker registry tables | AI Workforce; implement only in Phase 10 |
| M110 | NOT APPLIED | No source migration, remote history entry or skill/tool registry tables | Skills & Tools; implement only in Phase 11 |
| M120 | NOT APPLIED | No source migration, remote history entry or memory tables | Memory & Knowledge Governance; implement only in Phase 12 |
| M130 | NOT APPLIED | No source migration, remote history entry or durable AI run tables | AI Runtime; implement only in Phase 13 |
| M140 | NOT APPLIED | No source migration, remote history entry or workflow tables | Workflow; implement only in Phase 14 |
| M150 | NOT APPLIED | No source migration, remote history entry or evaluation configuration tables | Role Catalogue & Evaluation; implement only in Phase 15 |
| M160 | NOT APPLIED | No source migration, remote history entry or AI credit ledger tables | AI Credits & Billing; implement only in Phase 16 |
| M170 | NOT APPLIED | No source migration, remote history entry or analytics/KPI tables | Analytics & KPI; implement only in Phase 17 |
| M180 | NOT APPLIED | No source migration, remote history entry or integration/outbox tables | Integrations & Notifications; implement only in Phase 18 |
| M190 | NOT APPLIED | No source migration, remote history entry or governance configuration tables | Governance & Operations; implement only in Phase 19 |
| M200 | NOT APPLIED | No source migration, remote history entry or cross-domain integrity batch | Cross-domain Integrity; implement only in Phase 20 after live data checks |
| M210 | NOT APPLIED | No source migration, remote history entry or retention/deletion batch | Data Lifecycle & Finance Close; implement only in Phase 21 |
| M220 | NOT APPLIED | No source migration, remote history entry or release reconciliation batch | Release Reconciliation; Phase 22 only |

### M010 live security/schema notes

The nine tables have RLS enabled and current policies are SELECT-only for authenticated application access. The grants for `anon`, `authenticated` and `service_role` remain broader than least privilege; global default table/sequence/function privileges are also broad. The live catalog shows no FORCE RLS. These are recorded in `PHASE00_CLOSURE_READINESS_REAUDIT_2026-11-18.md` and are not resolved by the existence of RLS policies.

### API, backward compatibility and recovery

M010 currently has identity/tenant endpoints for `/me`, `/tenants`, tenant organizations, tenant management/directory, membership invitation/list, role catalogue and platform-admin bootstrap. It is still partial against the full Phase 01 API contract. Existing applied SQL files are immutable. Do not roll back by destructive reset. Future corrections must use ordered additive migrations, preserve existing data and role keys, include RLS/grants/constraints/indexes, and provide forward repair/recovery notes. M020–M220 have no applied API/schema contract yet; those contracts belong to their named phases.

No database schema, migration, grant, policy, function or trigger was changed by this reconciliation.
