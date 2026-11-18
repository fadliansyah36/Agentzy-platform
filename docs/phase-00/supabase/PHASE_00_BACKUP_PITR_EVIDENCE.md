# Phase 00 — Backup, PITR & Retention Evidence

**Project:** Agentzy-db / `cwhjdnkotuhueeudpgeu`  
**Organization:** Agentzy / `hfxqdyoretyybhgrgmsa`  
**Evidence date:** 2026-11-18 UTC  
**Current plan:** **Free / tier_free** (verified via Supabase organization connector)  
**Project status:** ACTIVE_HEALTHY; PostgreSQL 17.12.0.000; ap-northeast-1.

## 1. Capability assessment

| Control | Verified actual state | Plan capability from current Supabase documentation | Evidence | Decision |
|---|---|---|---|---|
| Subscription plan | Free / tier_free | Free tier does not receive the automatic daily backups documented for Pro, Team and Enterprise | Supabase `get_organization`; official docs below | VERIFIED |
| Automatic daily backups | Not included on Free according to current product docs; no dashboard backup inventory exposed | Daily automatic backups: Pro (7 days), Team (14 days), Enterprise (up to 30 days) | https://supabase.com/docs/guides/platform/backups | No managed daily backup capability is evidenced for this project |
| PITR | Not available on current Free plan | PITR is a Pro/Team/Enterprise add-on and requires at least Small compute | https://supabase.com/docs/guides/platform/backups#point-in-time-recovery | PITR is not enabled/available under current plan baseline |
| PITR recovery window | None verified; no PITR entitlement | 7/14/28-day retention options described in current docs for PITR add-on | Supabase backups documentation | No recovery window |
| Manual logical backup | Available as an operational alternative using Supabase CLI `db dump` / pg_dump; execution not evidenced | Supabase recommends Free projects regularly export data and maintain off-site backups | https://supabase.com/docs/guides/platform/backups | Planned capability only; not evidence of an existing backup |
| Backup schedule / last success | NOT VERIFIED | Must be defined and recorded by operator | No Dashboard evidence or export received | PENDING |
| Backup storage / off-site retention | NOT VERIFIED | Separate protected off-site location, access control and retention required | No backup object/receipt supplied | PENDING |
| Restore verification | NOT PERFORMED | Restore verification is out of Phase 00; restore drill belongs to Phase 22 | No restore evidence | NOT PERFORMED |

**Important distinction:** Supabase's current documentation states Free projects should regularly export data using the CLI and maintain off-site backups. This is a recommendation, not evidence that Agentzy has an existing backup. No backup file, export log, schedule, retention configuration or successful restore was supplied or observed.

## 2. Recovery exposure

The current Free plan creates a material recovery gap for the Phase 00 exit gate:
- No managed daily backup retention is evidenced for this project.
- PITR is not available under the current Free plan.
- A manually operated logical backup/off-site copy has not yet been demonstrated.
- Supabase Storage object data is not included in database backups; this project currently has zero Storage buckets and objects in the catalog snapshot, but any future Storage assets need a separate backup strategy.
- No recovery window or verified recovery point can be claimed.

## 3. Decision required

**Owner:** Supabase Project Owner + Supabase Admin + Security Lead.

Select and document one approved path:
1. Upgrade to an eligible plan/compute and evaluate managed daily backup or PITR add-on, including written cost approval and retention target; or
2. Retain Free plan and implement a scheduled, encrypted logical backup with off-site retention, access control, integrity verification, monitoring, and an owner-approved RPO/RTO.

Do not enable a paid plan/add-on or incur charges without explicit cost approval. Do not create another project/database to work around this blocker.

## 4. Evidence still required

- Dashboard screenshot/export proving plan and available backup features.
- Backup schedule and retention policy (or approved alternative).
- Most recent backup/export timestamp and completion status.
- Backup scope, including database objects and exclusions.
- Off-site storage location reference and access-control owner (never commit credentials).
- Retention and deletion policy.
- Recovery authority and approval chain.
- Written Project Owner/Security Lead decision on the selected approach.

## 5. Status

**RR-001 remediation dependency:** BLOCKED — verified backup/recovery control and approval not available.  
**Recovery capability:** PLANNED / NOT VERIFIED.  
**PITR:** NOT AVAILABLE under the verified Free plan; do not claim enabled.  
**Restore:** NOT PERFORMED. No production recovery or restore drill was attempted.

## Sources

- Supabase Database Backups: https://supabase.com/docs/guides/platform/backups
- Manage Point-in-Time Recovery usage: https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery
