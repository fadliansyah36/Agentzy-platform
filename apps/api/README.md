# Agentzy API

Python 3.12+ / FastAPI modular monolith. FastAPI owns business rules and authorization; Supabase PostgreSQL is the only business database.

## Local development
1. Create a virtual environment and install: `pip install -e ".[dev]"`.
2. Copy `.env.example` to `.env`; configure the database password and JWT settings. Never commit secrets.
3. Run `uvicorn app.main:app --reload --port 8000` from `apps/api`.

## Initial API
- `GET /health` — process liveness only.
- `GET /api/v1/me` — verified Supabase identity and memberships.
- `GET /api/v1/tenants` — tenants accessible to the caller.
- `GET /api/v1/tenants/{tenant_id}/organizations` — tenant-scoped organizations.

Business routes require a valid Supabase access token. JWT signature, issuer and audience are verified. The API sets transaction-local Postgres JWT claims and executes as the `authenticated` database role so RLS remains active. A browser-supplied tenant ID is never authorization proof.

## Architecture
`app/api` contains transport routers; `app/core` settings/auth/observability; `app/db` session; `app/domains` bounded contexts. Domain services and repositories are added per phase. Never expose provider secrets or service-role keys to the browser.
