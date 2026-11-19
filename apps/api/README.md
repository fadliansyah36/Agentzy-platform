# Agentzy API

Python 3.12+ / FastAPI modular monolith. FastAPI is the business and authorization authority; Supabase PostgreSQL is the sole application database.

## Local development

1. Create a virtual environment and install the project: `pip install -e ".[dev]"`.
2. Copy `.env.example` to `.env`.
3. Configure `DATABASE_URL`, `SUPABASE_URL`, and the Supabase JWT verification settings.
4. Run `uvicorn app.main:app --reload --port 8000` from `apps/api`.

Never commit database passwords, JWT secrets, service-role keys or the bootstrap token.

## API

- `GET /health` — process liveness only.
- `GET /api/v1/me` — verified Supabase identity, active tenant memberships, role keys and effective permission keys.
- `GET /api/v1/tenants` — active tenants for the caller.
- `GET /api/v1/tenants/{tenant_id}/organizations` — organizations after tenant membership, permission and RLS checks.
- `POST /api/v1/tenants/{tenant_id}/organizations` — create a tenant-scoped organization unit.
- `GET /api/v1/tenants/{tenant_id}/memberships` — authorized tenant membership directory.
- `POST /api/v1/tenants/{tenant_id}/memberships/invite` — Supabase Auth invitation and RBAC assignment.
- `GET /api/v1/roles` — system role templates and permission keys.
- `GET /api/v1/tenants/directory` — platform-wide tenant directory (AAL2 + permission required).
- `POST /api/v1/tenants`, `PATCH /api/v1/tenants/{tenant_id}`, `DELETE /api/v1/tenants/{tenant_id}` — tenant create, update and archive (AAL2 + permission required).
- `POST /api/v1/bootstrap/platform-admin` — one-time first administrator invitation, protected by `X-Platform-Bootstrap-Token`.
- `GET /api/v1/public/catalogue` and `POST /api/v1/public/partnership-applications` — public catalogue and partnership intake.
- `GET /api/v1/partnership/prospects` and `PATCH /api/v1/partnership/prospects/{id}` — authorized CRM inbox and qualification lifecycle.
- `GET /api/v1/partnership/prospects/{id}/attachments` and `POST /api/v1/partnership/attachments/{id}/download` — AAL2-gated attachment listing and 60-second signed download, only after malware scan status is `clean`.

## First administrator bootstrap

Set the following secrets on the API service only:

- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key. Server-side only.
- `AUTH_PROVIDER_WEBHOOK_SECRET`: random secret of at least 32 characters; configure the same value in the Supabase Auth webhook delivery header `X-Provider-Webhook-Secret`.
- `PLATFORM_BOOTSTRAP_TOKEN`: long random one-time secret used only while bootstrapping the first administrator.
- `CLAMAV_HOST` / `CLAMAV_PORT`: private network address for the ClamAV daemon. The attachment scanner remains disabled unless this and `SUPABASE_SERVICE_ROLE_KEY` are present; files remain quarantined when scanning is unavailable.
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret; when set, public submissions require successful server-side verification.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_STARTTLS`: notification outbox delivery settings. No email is reported as delivered until the worker succeeds.
- `APP_BASE_URL`: frontend origin used for the Auth invitation callback.

Open `/bootstrap` in the frontend, enter the first administrator's full name and email plus the bootstrap token. The endpoint invites the user through Supabase Auth, creates the internal Agentzy Platform tenant membership, assigns the `platform_super_admin` role and writes an audit event. It refuses to run once an active platform super-admin membership exists.

After accepting the email invitation and setting a password, sign in at `/admin`, open the MFA setup link, enroll a TOTP authenticator, and verify the six-digit code. Super Admin access is withheld unless the verified Supabase session has assurance level `aal2`.

## Security model

Business routes require a Supabase access token. JWT signature, issuer and audience are verified. User-scoped database requests run inside a transaction with transaction-local JWT claims and the `authenticated` Postgres role, preserving Supabase RLS. The backend never trusts browser tenant IDs as authorization proof. Role and permission keys are resolved from membership-role-permission relations. Platform-wide tenant administration additionally requires Supabase MFA assurance level `aal2`.

The service-role key is only used by the protected one-time bootstrap flow and must never be placed in Next.js public environment variables.

## Deployment

Build the API container with `docker build -t agentzy-api apps/api`. Deploy it to a private or managed container runtime and configure its secrets. In `APP_ENV=production`, startup fails closed unless `SUPABASE_SERVICE_ROLE_KEY` and `AUTH_PROVIDER_WEBHOOK_SECRET` are configured; the bootstrap token is optional after first-admin setup. Set `NEXT_PUBLIC_AGENTZY_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on the frontend deployment. Configure Supabase Auth redirect URLs and Google OAuth only if SSO is enabled.

## Checks and release policy

Engineering checks (Python compile/import, lint/type checks, migration consistency and API contract checks) are required during implementation. No staging, UAT, load, real-world acceptance or production release test is part of the current work.
