# Phase 00 — Database Recovery Runbook

**Project:** `cwhjdnkotuhueeudpgeu` / Agentzy-db  
**Status:** PROCEDURE DRAFT — not operationally validated  
**Phase boundary:** No production restore or recovery drill in Phase 00. Full restore drill and operational acceptance belong to Phase 22.

## 1. Recovery scenarios

| Scenario | Example | Recovery source | Initial response |
|---|---|---|---|
| Accidental data mutation/deletion | Incorrect update/delete or bad application command | Verified logical export or eligible managed backup/PITR if later enabled | Stop further writes where safe; preserve audit/log evidence; escalate to Project Owner and Security Lead |
| Schema/migration defect | Incorrect DDL or migration impact | Migration history + approved backup/recovery point | Stop migration activity; identify exact migration and impact; do not edit applied migration |
| Credential compromise | Unauthorized database access | Credential rotation/revocation and incident response; backup may not remediate exposure | Revoke/rotate affected credentials, preserve audit evidence, assess data access and notify authorized owners |
| Regional/service outage | Database unavailable | Supabase service recovery and independently stored logical backup | Follow provider status and incident process; do not initiate duplicate project/database |
| Storage object loss | Deleted/overwritten Storage objects | Separate object backup/versioning if configured | Database backup alone is insufficient for Storage object recovery |

## 2. Current source and limitations

- Current organization plan verified as Free / tier_free.
- Supabase docs state Free projects should use regular CLI logical exports and off-site backups; no Agentzy export schedule or completed export has been evidenced.
- Automatic daily backups documented for Pro/Team/Enterprise, not current Free plan.
- PITR is a paid add-on for eligible plans and requires at least Small compute; current Free plan has no verified PITR.
- No recovery point, backup object, checksum, retention schedule or successful restore evidence has been supplied.
- Storage catalog currently reports zero buckets and zero objects; future Storage objects require a separate backup/restore path.
- No restore has been attempted.

## 3. Recovery authority and approvals

Required before any recovery:
1. Incident Commander / Security Lead declares incident and records incident ID.
2. Supabase Project Owner approves recovery action and acceptable data-loss window.
3. Supabase Admin confirms exact project ref, source backup/recovery point, backup integrity and provider constraints.
4. Database/Security Lead reviews blast radius, access exposure, migration state and restore target.
5. Legal/Privacy owner is engaged if personal data or reportable incident is implicated.
6. Record approval timestamp, approver identity/role and scope.

No person or role is authorized by this document alone to execute a production restore.

## 4. Recovery preparation checklist

- [ ] Confirm canonical project ref `cwhjdnkotuhueeudpgeu`; never use a similarly named project.
- [ ] Confirm current project status and region.
- [ ] Identify incident start, detection time, affected tables/objects and last known-good point.
- [ ] Preserve relevant audit logs and migration history.
- [ ] Identify actual backup artifact/recovery point and verify its timestamp, scope, checksum/integrity evidence and retention.
- [ ] Determine whether the source contains secrets/PII and restrict access.
- [ ] Calculate estimated data loss between recovery point and incident.
- [ ] Review downtime and service unavailability.
- [ ] Obtain written approvals listed above.
- [ ] Select an isolated recovery target only if separately approved; do not create a new production database as an ad hoc workaround.
- [ ] Define reconciliation and cutover plan before action.

## 5. Recovery procedure — future operational use only

This is a controlled procedure outline, not authorization to execute now.

1. Declare incident and freeze/limit affected writes only under incident command.
2. Verify backup/PITR source and exact target timestamp.
3. Review provider restore limitations and expected downtime.
4. Obtain approval for the exact recovery point and target.
5. Execute restore only by authorized Supabase Project Owner/Admin using the approved provider process.
6. Keep the restored environment isolated from normal application traffic until reconciliation and security checks are approved.
7. Reconcile migration history, schema, critical records, transaction ledgers, identity/membership relations and audit continuity.
8. If Storage objects exist, restore them separately from the approved object backup and reconcile metadata.
9. Validate grants, RLS, policies, functions, triggers, extensions, Auth configuration and API exposure.
10. Obtain explicit approval before reconnecting application traffic.
11. Record actual start/end time, operator, approvals, source, target, data-loss estimate, results and unresolved exceptions.

## 6. Post-recovery reconciliation

- Schema and migration history agree with approved source.
- Tenant isolation and RLS/grants are reviewed.
- Identity, memberships, roles and permissions are reconciled.
- Financial/commission/credit ledgers reconcile to source events.
- Storage metadata and object inventory reconcile, where applicable.
- Webhook/event/idempotency state is reconciled to prevent duplicate effects.
- Secrets/credentials are rotated if exposure is suspected.
- Audit trail and incident record are complete.
- Owner accepts data-loss statement and operational status.

## 7. Escalation

If no valid backup/recovery point exists, stop and escalate to Project Owner, Supabase Admin, Security Lead and Product Owner. Do not claim recoverability. Consider an approved plan change or a documented off-site logical backup strategy, with explicit cost and data-governance approval.

## 8. Phase 00 status

Runbook authored; no restore, recovery drill, backup job, PITR activation, project upgrade or data mutation performed. Recovery capability remains unverified and Phase 00 remains NOT CLOSED.
