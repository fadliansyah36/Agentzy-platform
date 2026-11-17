# Agentzy — Source Code Deep-Dive Audit (Initial Pass)

Date: 17 November 2026
Branch: main
Scope: targeted inspection of current portal hooks/services and API route handlers. This is a focused pass, not a complete line-by-line review.

## Verified findings

### Admin portal
- `apps/admin/hooks/useAdminPortal.ts` initializes `isAuthenticated=true`, assigns `platform_super_admin` and a fixed `superadmin@agentzy.id` identity locally.
- The hook creates extensive React state from `adminPortalService.getInitialCollections()`; CRUD callbacks mutate local arrays and append local audit entries.
- `apps/admin/services/admin-service.ts` sources domain collections from `INITIAL_*` constants. Model routing and commission preview are computed in the browser.
- This is UI demonstration state, not persisted tenant-scoped backend behavior. Replace data access and mutations with typed FastAPI client calls while preserving components, layout and interaction patterns. Authentication and authorization must be server-derived; never trust the local role/email.

### Corporate portal
- `apps/corporate/hooks/useCorporatePortal.ts` imports tenant and role constants from `corporate-data` and local portal service. The hook maintains business records in client state.
- Need a complete action-by-action inventory of its service methods and all local storage dependencies before migrating screens. Tenant identity and access scope must come from the authenticated server session, not a selected UI tenant.

### AI Workforce portal
- `apps/ai-workforce/hooks/useAIWorkforcePortal.ts` initializes workers, skills, tools, memory, workflow, runs, credits, artifacts and audit data from static initial collections. Several handlers create/update entities directly in React state and locally generate IDs/timestamps.
- `apps/ai-workforce/services/ai-workforce-service.ts` is currently presentation/artifact formatting logic, not an HTTP API adapter.
- Replace each domain operation with typed FastAPI endpoints, preserving existing UI. The backend must own worker registry, skill/tool authorization, workflow/run state, credits, approvals, audit and memory policy.

### Direct LLM provider route
- `app/api/ai-workforce/generate-content/route.ts` constructs `GoogleGenAI` in Next.js using `GEMINI_API_KEY`, hardcodes model `gemini-4-hydrogen`, and accepts `tenantName` from request JSON to build the system instruction.
- This bypasses the planned FastAPI AI Gateway/Model Router and permits client-controlled tenant context. Move provider invocation to FastAPI; derive tenant and membership from verified auth context, enforce model allowlist, policy, data classification, budget and audit. Keep Next.js route only as a compatibility proxy if required during cutover, with no provider secret or business policy in the frontend app.

### Dependency / platform observations
- Current package metadata: Next.js 15, React 19, TypeScript 5.9, Tailwind 4; `@google/genai` and Firebase dependencies are present.
- Need inspect lockfile and dependency purpose before removing packages. Avoid dependency churn while establishing backend.
- Maps route handlers under `app/api/maps/` and `app/api/config/maps/` need a separate security review for key exposure, quota, caller authorization and API ownership.

## Priority remediation sequence

1. Phase 00: freeze UI baseline and route/component inventory; map each visible action to a domain command/query and current local data source.
2. Phase 00: inspect all remaining services, localStorage/session assumptions, API routes, middleware, auth callbacks, tenant switching and environment variables.
3. Phase 00: define FastAPI modular-monolith package boundaries, configuration, logging/trace/error conventions and API client contract.
4. Phase 01: implement verified authentication, tenant membership, portal entitlements, RBAC/ABAC and deny-by-default authorization before exposing business CRUD.
5. Subsequent phases: add domain services and per-phase Supabase migrations only after complete live schema, grants, RLS, functions, triggers, Auth, Storage and Realtime audit.
6. Migrate UI feature-by-feature by swapping data adapters; do not redesign screens or introduce fake API responses.

## Supabase security issue to resolve before schema work
Security Advisor reports `public.rls_auto_enable()` as SECURITY DEFINER and executable by `anon` and `authenticated`. Review function source and grants; do not invoke it as an automatic RLS mechanism. Resolve with an explicit reviewed migration after confirming intended use and blast radius.

## Engineering notes
- No backend or migration files were created in this audit pass.
- No database changes were applied.
- No real-world, staging or production tests were run.
- This report does not claim Phase 00 complete.
