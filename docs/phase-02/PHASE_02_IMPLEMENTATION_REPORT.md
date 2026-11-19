# Phase 02 — Public Landing & Partnership Acquisition Implementation Report

**Repository:** `fadliansyah36/Agentzy-platform`  
**Branch:** `main`  
**Implementation date:** 2026-11-19  
**Disposition:** **PARTIAL — implementation committed; external runtime/security configuration remains open.**

## 1. Implemented

### Public catalogue and FAQ
- Added server-owned catalogue and FAQ tables; public browser access remains through FastAPI only.
- Seeded the 9 Human Workforce and 10 AI Workforce service catalogue entries and 10 FAQ entries from the canonical Agentzy PRD/service scope.
- Added `GET /api/v1/public/catalogue`.
- Updated the existing landing page to load the service catalogue and FAQ from the FastAPI endpoint. Loading, empty and error states are explicit; no silent static fallback is used for these sections.

### Partnership application
- Added validated `POST /api/v1/public/partnership-applications`.
- Requires an idempotency key; stores a canonical request fingerprint and deterministic upload capability derived from server-side secret material. Capability expiry is persisted and upload authorization expires after two hours; a valid idempotent replay renews the two-hour window.
- Validates email, consent, company/contact fields, arrays and URL format.
- Includes honeypot and database-backed IP-hash rate limiting.
- Creates application, privacy/communication consent records, CRM prospect, initial activity, audit event and notification outbox event in one database transaction.
- Duplicate submissions inside the defined 24-hour window are rejected without exposing the prior record.

### Attachment security
- Created private Storage bucket `partnership-quarantine` with 10 MB object limit and PDF/JPG/PNG MIME allowlist.
- Added a capability-protected raw upload endpoint. It checks application capability, filename, MIME, magic bytes, size and per-application attachment count.
- Object names are random and private. Metadata includes SHA-256 and `pending_scan`.
- Added a ClamAV INSTREAM scanner worker. It retrieves objects from private Storage, verifies size and SHA-256 against metadata, and records `clean`, `infected` or `rejected`; scanner outages defer/retry without releasing files.
- Added AAL2 + `platform.partnership.read` + global ABAC protected attachment listing and 60-second signed download issuance. Only `clean` objects can receive a signed URL; issuance is audited.
- CRM Lead Inbox now shows attachment names, scan status and download controls. The scanner worker remains disabled until `CLAMAV_HOST` and server-side Storage credentials are configured.

### CRM and lead lifecycle
- Public applications create CRM prospects transactionally.
- Added platform permissions `platform.partnership.read` and `platform.partnership.manage`, global ABAC policies, and role mapping for `platform_super_admin`.
- Privacy consent and communication consent are now separate user-visible checkboxes and separate database records. The form supports the Cloudflare Turnstile explicit widget when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is configured; FastAPI verifies the token when `TURNSTILE_SECRET_KEY` is configured.
- Added cursor-paginated lead inbox, lifecycle status transitions, self-assignment, notes/activity timeline, audit records and idempotent update commands.
- Added Super Admin Partnership Lead Inbox UI using existing design tokens and authenticated FastAPI calls.

### Notifications
- Added durable notification outbox and asynchronous SMTP dispatcher.
- Worker starts only when SMTP host and sender are configured.
- Delivery uses STARTTLS or implicit TLS, bounded retries and dead-letter status. It never reports delivery as successful before SMTP confirms it.

## 2. Database changes applied

Five additive migrations were committed and applied to Agentzy-db:

| Version | Migration |
|---|---|
| 20261119082627 | `phase_02_public_partnership_acquisition` |
| 20261119082643 | `phase_02_public_application_capabilities` |
| 20261119082716 | `phase_02_partnership_authorization_policies` |
| 20261119083254 | `phase_02_submission_fingerprint` |
| 20261119084924 | `phase_02_upload_capability_expiry_and_scanner_queue` |

New tables:
- `public_catalogue_items`
- `public_faq_entries`
- `public_partnership_applications`
- `public_partnership_consents`
- `crm_prospects`
- `crm_prospect_activities`
- `public_partnership_attachments`
- `notification_outbox`
- `public_api_rate_limits`

Live database evidence after migration:
- 28 public application tables total.
- All 9 new tables have RLS enabled.
- No table grants were found for `anon`, `authenticated`, or `service_role` on the 9 server-only tables.
- Private `partnership-quarantine` bucket exists.
- Catalogue: 9 Human Workforce, 10 AI Workforce; FAQ: 10.
- New platform partnership permissions and ABAC policy keys exist.
- No application, prospect or outbox rows were fabricated or inserted during implementation.

The Supabase Security Advisor reports INFO notices for server-only RLS-enabled tables without client policies. These tables are intentionally FastAPI-only and have no client-role grants; this is not represented as a clean security acceptance. FORCE RLS is not enabled.

## 3. API surface added

- `GET /api/v1/public/catalogue`
- `POST /api/v1/public/partnership-applications`
- `POST /api/v1/public/partnership-applications/{application_id}/attachments`
- `GET /api/v1/partnership/prospects`
- `PATCH /api/v1/partnership/prospects/{prospect_id}`
- `GET /api/v1/partnership/prospects/{prospect_id}/activities`
- `GET /api/v1/partnership/prospects/{prospect_id}/attachments`
- `POST /api/v1/partnership/attachments/{attachment_id}/download` (AAL2; clean-scan only; 60-second signed URL)

All business writes are performed by FastAPI. The frontend uses typed API-client methods and does not write directly to Supabase.

## 4. Remaining blockers — why status is PARTIAL

1. SMTP host/sender/credentials have not been supplied or verified in the runtime environment. Outbox worker therefore remains disabled until configuration exists; no real email delivery is claimed.
2. Cloudflare Turnstile site/secret keys are not configured in the frontend/API runtime. Widget and server verification code are implemented, but CAPTCHA is not claimed active.
3. ClamAV scanner integration is implemented but `CLAMAV_HOST` is not configured in the API runtime. Uploaded objects remain `pending_scan`; the signed-download API refuses access until a scan returns `clean`.
4. Production API URL, CORS allowlist and frontend environment binding have not been verified against a deployed FastAPI service. Code is committed; runtime end-to-end completion is not claimed.
5. Super Admin CRM access requires a real platform membership with AAL2 and the new permissions. The live Auth project currently has zero Auth users, so authenticated CRM runtime access has not been demonstrated.

## 5. Engineering evidence

Minimum engineering checks are defined in `.github/workflows/phase-00-engineering-checks.yml`:
- frozen frontend install, ESLint and TypeScript;
- Python compile, Ruff, deterministic authorization tests and FastAPI/OpenAPI import;
- migration filename/version consistency.

The run on commit `1421b314a2af1706f5454c0380a45fb494919610` completed successfully:  
https://github.com/fadliansyah36/Agentzy-platform/actions/runs/44489073610

Subsequent backend-only hardening commits are included in the current branch; the latest run for the final head must be used for final acceptance evidence.

No staging, UAT, load test, penetration test or production deployment was run.

## 6. Next phase

Phase 03 — Corporate & Contract Management is the next roadmap phase, but it must not start until Phase 01 and Phase 02 are independently closed. No Phase 03 implementation is included here.

## 7. Security hardening continuation — 2026-11-19

- Migration `20261119084924_phase_02_upload_capability_expiry_and_scanner_queue` is applied to live Supabase. It adds `upload_token_expires_at` and a partial index for pending scan work.
- Live verification confirms the expiry column and scanner queue index exist. Live row counts remain zero for applications, CRM prospects, attachments and notification outbox; no production/test records were fabricated.
- The latest Security Advisor query returned 16 INFO findings (`rls_enabled_no_policy`) for server-only RLS tables with no client grants; no WARN findings were returned. This is not a clean security acceptance.
- The API CORS allowlist now includes `X-Application-Upload-Token` and `X-File-Name` required by the browser upload path.
- `CLAMAV_HOST`, `CLAMAV_PORT`, `CLAMAV_TIMEOUT_SECONDS`, Turnstile and SMTP settings are documented in `apps/api/.env.example`; the public Turnstile site key is documented in root `.env.example`.
- The current implementation code head before report updates is `1826fe6ca73084daede8b49ea414b0d7dddbfdc2`. GitHub Actions minimum engineering run [44491441360](https://github.com/fadliansyah36/Agentzy-platform/actions/runs/44491441360) was pending when this report was prepared; do not treat it as passed until completed.
- Phase 02 remains **PARTIAL** until SMTP delivery, Turnstile, ClamAV, deployed API/CORS/frontend binding and real AAL2 CRM identity can be verified in their target runtime.