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
