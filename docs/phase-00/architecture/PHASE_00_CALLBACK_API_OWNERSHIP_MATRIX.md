# Phase 00 — Callback / API / Domain Ownership Matrix

**Status: PARTIAL — structural route/module inventory exists; exhaustive callback tracing and owner approvals are incomplete.**  
**Repository:** `fadliansyah36/Agentzy-platform` / `main`

## 1. Canonical ownership boundary
Browser portal → typed frontend API client → FastAPI `/api/v1` → domain application service → repository adapter → Supabase PostgreSQL. Supabase Auth client may manage supported identity/session flows. Frontend must not perform sensitive business writes directly to Supabase. Tenant and membership scope are resolved server-side.

## 2. Verified routes and API handlers
| Screen / route | User action family | Current callback / handler evidence | API / OpenAPI | FastAPI domain | Authorization / data boundary | Owner | Status |
|---|---|---|---|---|---|---|---|
| / (Public Landing) | Partnership discovery/application | Landing views present; callback scan pending | No partnership application operation confirmed in current v1 router | Public Acquisition (target) | Public submission, consent, abuse controls | Owner not nominated | GAP |
| /admin, /admin/[section] | Tenant, membership, RBAC, governance, finance, AI | Admin hooks/services present; callback mapping pending | Identity, tenants, management, bootstrap exist; most admin domains lack complete contracts | Platform Control Plane / domain-specific | Platform permission, AAL2, object scope, audit | Frontend Lead + Platform Domain Owners | PARTIAL |
| /corporate, /corporate/[section] | Organization/member, analytics, finance, invoice, commission, contracts, reports | Corporate hooks/services present; action scan pending | Identity/tenant/organization/member subset exists; finance/analytics incomplete | Corporate bounded contexts | Tenant/object/organization scope and domain permission | Corporate Domain Owners | PARTIAL |
| /workforce | Passport, onboarding, affiliate, sales, technician, training, work orders | Workforce screens present; callback scan pending | No dedicated Human Workforce router confirmed | Human Workforce | Tenant/org/branch/worker scope | Owner not nominated | GAP |
| /ai-workforce, /ai-workforce/[section] | Worker registry/studio, skills/tools, memory/RAG, workflow, runs, approvals | AI Workforce hook/service present; action scan pending | Direct Next.js generate-content handler exists; FastAPI AI contracts incomplete | AI Platform / AI Gateway | Tenant policy, worker/resource scope, budget, approval, audit | Owner not nominated | PARTIAL |
| /bootstrap | First platform administrator | Bootstrap form / API action | POST /api/v1/bootstrap/platform-admin | Platform Bootstrap | One-time token; server-only service role; audit | Platform Identity Owner | Existing; runtime config pending |
| /mfa-setup | Privileged MFA enrollment | Supabase Auth MFA client flow | Supabase Auth client | Identity provider | AAL2 / privileged access | Identity Owner | Existing; hosted config unverified |
| /api/ai-workforce/generate-content | Generate content | Next.js route handler | Transitional Next.js endpoint; canonical FastAPI operation incomplete | AI Gateway / Model Router | Server-resolved tenant, model allowlist, budget, audit | AI Platform Owner | Ownership conflict |
| /api/config/maps | Maps browser config | Next.js route handler | Transitional | Maps integration | Public restricted browser key only | Maps Integration Owner | Transitional |
| /api/maps/reverse-geocode | Reverse geocode | Next.js route handler | Transitional | Maps / Location | Server-side key, quota, consent, minimization | Maps Integration Owner | Transitional |

## 3. Callback-level acceptance still required
The current inventory does not enumerate every button, menu item, form submission, modal action, onClick/onSubmit callback, hook callback, service method, localStorage branch, direct Supabase access, fallback branch or emitted event. Therefore it does not satisfy action-level acceptance.

For every component/action, record: `Screen → User Action → Callback → API Endpoint → OpenAPI Operation → FastAPI Domain → Authorization → Data Source → Owner`. Also record permission key, tenant/object scope, audit responsibility, idempotency, error/empty/denied states and system of record.

## 4. Current API gaps
- Public partnership acquisition.
- Corporate analytics, finance, commission, AI Credits, contracts, invoices and reports.
- Human Workforce endpoints.
- AI worker, skills, tools, memory, RAG, workflow, run and approval contracts.
- Most Super Admin provider/model/billing/finance/governance/incident operations.
- Maps ownership approval and direct provider boundary.

## 5. Approval status
No named Domain Owner approval has been supplied. This is a verified structural and domain-level baseline, not an owner-approved contract. RR-012 and RR-013 remain PARTIAL.
