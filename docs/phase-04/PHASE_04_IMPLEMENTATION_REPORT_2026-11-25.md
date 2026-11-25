# Phase 04 — Human Workforce Passport & Onboarding

**Disposition:** DONE — Implementation Complete  
**Repository:** `fadliansyah36/Agentzy-platform`  
**Branch:** `main`  
**Implementation source commit:** `a710163a19036aeb6d070c988e6ab5df7a3b5097`  
**Supabase project:** `cwhjdnkotuhueeudpgeu`  
**Engineering workflow:** [Agentzy Minimum Engineering Checks #45602180669](https://github.com/fadliansyah36/Agentzy-platform/actions/runs/45602180669) — **SUCCESS**

## 1. Delivered domains

1. **Registration & identity verification** — self-registration against an active tenant membership; invitation-backed profile creation; identity submission; private document upload; MIME/size checks; ClamAV scan gate; reviewer queue; verified/rejected decisions with actor, time, reason and history.
2. **Human Workforce Passport** — profile, tenant and organization, organization unit, membership role keys, job family/title, lifecycle and engagement status, experience, identity history/documents, engagement/contract history, skills, certifications, availability, training, assignments and lifecycle activity.
3. **Engagement classification** — employee, outsourced worker, independent contractor, freelance, affiliate, technical partner and project-based worker; agreement/contract reference, effective dates, legal review reference, facts acknowledgement, activation/suspension/end, supersession history and audit. The portal explicitly requires acknowledgement of actual engagement facts; classification labels do not alter legal obligations.
4. **Skills & certification** — tenant skill registry, worker proficiency and experience, evidence reference, verification queue, issuer, validity/expiry, evidence metadata, reviewer decisions and renewal linkage.
5. **Availability & scheduling** — working hours, leave, unavailable and preferred-shift periods; timezone and recurrence; assignment scheduling; availability/assignment conflict detection; workload visibility; authorized cancellation.
6. **Training** — course catalogue and HTTPS-validated learning materials, enrollment, partial progress, assessment threshold, completion, certificate reference/expiry and activation eligibility rules.
7. **Onboarding lifecycle** — task creation, assignment and due date, document/agreement/training completion references, manager-only approval/verification tasks, lifecycle prerequisites, activation, suspension and offboarding readiness.
8. **Portal integration** — Workforce self-service, Corporate workforce governance and Super Admin workforce governance are connected to FastAPI commands and persisted Supabase records. Phase 04 controls use typed API-client calls; no Phase 04 business writes are made directly from the browser to Supabase.

## 2. Backend architecture and API

The workforce API is registered under `/api/v1/workforce`. The router exposes **41 endpoints** covering:
- Passport, profile directory, profile create/update and self-registration.
- Identity submission, reviewer decisions, document upload/metadata, secure signed download, redaction and retention purge.
- Engagement create/list/activate/status and classification history.
- Skill registry, worker skill submission and verification; certification create/verify/renew and reviewer queue.
- Availability create/list/cancel and assignment create/list.
- Training catalogue, enrollment, progress and assessment.
- Onboarding task create/list/update and lifecycle transitions/history.
- Workforce operation metrics.

Implementation modules:
- `apps/api/app/domain/workforce.py` — lifecycle transition and classification invariants.
- `apps/api/app/repositories/workforce_repository.py` — tenant-scoped profile lookup, audit append and notification outbox.
- `apps/api/app/services/workforce_service.py` — activation prerequisites and offboarding readiness.
- `apps/api/app/api/v1/routes/workforce.py` — Pydantic validation, RBAC/ABAC, object scope, business transitions and API handlers.
- `apps/web/lib/api-client.ts` — typed Phase 04 command payloads and Passport response contract.

## 3. Supabase migrations and live evidence

All **13 Phase 04 migrations** are present in `supabase/migrations/` and recorded in the connected project's migration ledger:

- `20261125102121_phase_04_human_workforce_passport_onboarding`
- `20261125102133_phase_04_private_identity_document_metadata`
- `20261125102436_phase_04_corporate_superadmin_workforce_access`
- `20261125102736_phase_04_workforce_self_service_permissions`
- `20261125103206_phase_04_workforce_storage_service_only_policy`
- `20261125103229_phase_04_workforce_directory_access_scope`
- `20261125103331_phase_04_corporate_workforce_role_matrix`
- `20261125103605_phase_04_engagement_classification_history`
- `20261125103647_phase_04_workforce_contract_linkage`
- `20261125104054_phase_04_certification_renewal_linkage`
- `20261125104904_phase_04_blueprint_workforce_compatibility_views`
- `20261125105345_phase_04_workforce_abac_policy_completion`
- `20261125105528_phase_04_workforce_observability_metrics_view`

Live schema evidence queried from Supabase:
- 14 workforce base tables; **14/14 RLS enabled**. There are currently 0 explicit policies on the workforce base tables; with 0 `anon`/`authenticated` grants, browser-role access is default-denied and workforce access is routed through FastAPI. `FORCE ROW LEVEL SECURITY` is not enabled.
- 46 workforce indexes and 249 constraints (PK/FK/unique/check).
- 3 security-invoker compatibility/metrics views: `workforce_contracts`, `workforce_skills`, `workforce_operation_metrics`.
- 19 workforce permission keys; **19/19 have active matching ABAC allow policies** and role mappings.
- 0 direct `anon` or `authenticated` table grants on workforce tables.
- Private `workforce-private-documents` Storage bucket; service-role-only object policy.
- 0 workforce profiles, documents, engagements, certifications, courses or assignments in the live project. No demo or fabricated records were seeded.

## 4. Security and lifecycle controls

- FastAPI resolves tenant context and permission server-side; tenant-scoped repository queries and object-level profile checks guard workforce resources.
- RBAC permission registry and ABAC resource/action policies cover profile, directory, identity, engagement, skills, certifications, availability, training, onboarding, lifecycle and assignments.
- Identity documents are private; uploads enforce PDF/JPEG/PNG and 10 MB maximum, antivirus scan status, retention deadline and tenant/verification-scoped object paths.
- Signed document URLs expire after 60 seconds. Download is audited. Redaction and retention purge delete the Storage object and replace identifying file metadata while preserving an audit record.
- Lifecycle transitions are constrained by the domain graph and record actor, timestamp, reason, permission key, request ID and audit event. Activation checks verified identity, required onboarding tasks, active engagement and required unexpired training. Offboarding blocks while assignments or engagements remain active.
- Engagement replacement preserves the currently active agreement until the replacement is approved and activated.
- Outbox notification hooks are emitted for registration/identity, engagement, lifecycle, training completion, onboarding task, certification and assignment events. Dispatch still depends on deployment mail configuration.

## 5. Engineering evidence

Workflow [#45602180669](https://github.com/fadliansyah36/Agentzy-platform/actions/runs/45602180669) on commit `a710163a19036aeb6d070c988e6ab5df7a3b5097` completed successfully:
- Frontend lint — PASS.
- TypeScript type-check — PASS.
- Python compile — PASS.
- Ruff — PASS.
- Focused deterministic API tests, including Phase 04 lifecycle/route/validation checks — PASS.
- FastAPI import and OpenAPI contract assertions for Phase 04 routes — PASS.
- Migration source naming/order/uniqueness consistency — PASS.

No staging, UAT, load testing, penetration testing or Phase 22 release-gate work was run, per instruction.

## 6. Known limitations and deployment configuration

- SMTP and Google OAuth secrets remain intentionally unconfigured; adapters, environment schema, callbacks and outbox hooks remain code-ready. Their providers are **not claimed active**.
- Secure identity document upload/download/redaction/retention requires deployment values for `SUPABASE_SERVICE_ROLE_KEY` and `CLAMAV_HOST`. Without them, protected document operations return a controlled 503; no secrets were written to the repository.
- Notification delivery requires SMTP deployment configuration. Events can be queued before dispatch is enabled.
- RLS is enabled on all 14 workforce tables; there are 0 explicit workforce base-table policies, 0 browser-role grants and 0 tables with `FORCE ROW LEVEL SECURITY`. Browser access is default-denied and all workforce operations go through FastAPI. The backend database credential bypasses RLS; server-side RBAC/ABAC and tenant/object checks are therefore the active authorization boundary. A future DB session/role design could add tenant-claim RLS policies and FORCE RLS where compatible. This remains a hardening item to review alongside the broader platform baseline.
- The workforce live tables are empty and the project has no real workforce users in this evidence set; this implementation check does not claim a live-user end-to-end session.
- Phase 00 remains separately marked **IN PROGRESS** in the existing backlog. This Phase 04 implementation does not claim Phase 00 closure or modify Phase 00 scope.

## 7. Next phase

**Phase 05 — Sales CRM, Provider Catalogue & Order** is the next backlog phase. It is identified as next only; no Phase 05 implementation was started in this change.
