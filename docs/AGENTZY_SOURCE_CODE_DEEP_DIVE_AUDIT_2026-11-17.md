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


## 2026-11-18 execution continuation — targeted portal hook/service verification

Repository source was re-opened from main after the Phase 00 re-audit. This remains a targeted source inspection, not a claim that all 125 TypeScript/TSX files have been line-by-line reviewed.

### Super Admin portal

- apps/admin/hooks/useAdminPortal.ts (blob edc43d03ae1c751954b18772e321a0e095d4dc01; 51,179 chars) initializes authenticated state to true, assigns platform_super_admin and superadmin@agentzy.id locally, and loads collections through adminPortalService.getInitialCollections().
- apps/admin/services/admin-service.ts (blob 28f6c1ea3d27039386bb7efa37ac5385510427ff) imports INITIAL_* collections from apps/admin/lib/admin-data.ts and returns them as the initial domain state. Its model-routing preview is deterministic browser-side demonstration logic.
- The targeted hook/service files do not contain fetch() or Supabase client usage. This confirms the portal data path is not yet wired to FastAPI in these files.

### Corporate / ISP portal

- apps/corporate/hooks/useCorporatePortal.ts (blob de1360396758fd96faf3913dfdc60a0795314841; 11,526 chars) initializes isAuthenticated=true, selects CORPORATE_TENANTS[0].id as active tenant, and loads all domain collections from corporatePortalService.
- apps/corporate/services/corporate-service.ts (blob 9678b1865ecd728b1ec9f8d20a9251964e73e73e) imports static INITIAL_* collections and returns hard-coded executive metrics, analytics series and initial records. Its comment describes a future FastAPI forwarding boundary; the methods inspected currently return local values and do not make fetch() requests.
- The targeted hook/service files do not contain Supabase client usage or fetch() integration. Tenant selection is client-side and must be replaced by server-resolved membership/tenant context in Phase 01 and subsequent domain phases.

### AI Workforce portal

- apps/ai-workforce/hooks/useAIWorkforcePortal.ts (blob 86c7ad944d525e5bc87140fcf2a4ee01a3970385; 32,920 chars) initializes workers, providers, skills, tools, memory layers, knowledge sources, workflows, runs, approvals, handoffs, tasks/goals and collaboration messages from INITIAL_* constants.
- The hook initializes authenticated state based on route section (not a verified server session) and selects AIWM_TENANTS[0].id locally.
- The inspected content-generation action POSTs to /api/ai-workforce/generate-content. That Next.js handler currently calls Google GenAI directly, hardcodes model gemini-4-hydrogen and accepts tenantName from the request body. This must move behind FastAPI AI Gateway/Model Router with tenant and membership resolved server-side.
- apps/ai-workforce/services/ai-workforce-service.ts (blob 1b59e98bfae83f8e51782c52968585b79909f934) contains formatting and artifact-download helpers, not a typed HTTP API client.

### Shared data and design baseline

- lib/agentzy-data.ts (blob 00238be714652f9877453e872473691b97822cfc), apps/admin/lib/admin-data.ts (blob 004383901480be4db66e3739fd0c2f1eb82fb9f7), apps/corporate/lib/corporate-data.ts (blob 35cfbcfea887cdd2c50eab7dd45c4ce457fa01bd), and apps/ai-workforce/lib/ai-workforce-data.ts (blob 4ec7ec2f15c747df996c0ee4af53794d876e882c) contain static catalogue and initial business records. These are demonstration/initial UI data, not evidence of persisted production data.
- app/globals.css (blob dfbaa340f5bc19b19f95333876ac9e6bd16b345f) confirms the existing light sky/azure/navy palette, Plus Jakarta Sans, JetBrains Mono, status colors, radii and shadows. Preserve these values and existing components during integration.
- next.config.ts (blob d0dc5db8f2ad53184650d433c9b73ab5c8bf716a) references DISABLE_HMR. .env.example declares GEMINI_API_KEY, GOOGLE_MAPS_API_KEY and NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. The targeted scan is not a complete source-wide environment scan.
- Root middleware.ts was not found by the repository file fetch. This observation alone does not rule out route-level auth guards or other session handling; those require a complete route/navigation review.

### Integration consequences and sequencing

1. Do not expose business CRUD endpoints until Phase 01 identity, tenant resolution, RBAC/ABAC and deny-by-default authorization are implemented.
2. Preserve existing UI components and replace each portal's local service adapter with typed FastAPI API-client calls only after its domain API contract and permissions exist.
3. Remove default-authenticated and hard-coded tenant/role assumptions as part of the Phase 01 integration boundary; never map local role labels directly to trusted permissions.
4. Migrate AI content generation from Next.js provider execution to the FastAPI AI Gateway in the applicable AI Gateway phase; keep any Next.js route only as a non-authoritative compatibility proxy if needed.
5. No application code or Supabase schema was changed by this source inspection. No engineering tests, staging, UAT, real-world testing or deployment were run.