# Phase 00 — Screen Inventory & API/Domain Ownership

**Date:** 18 November 2026  
**Repository:** `fadliansyah36/Agentzy-platform`  
**Branch snapshot:** `main` at `660e3895c8fefb014f982a45d599e140b4419f82` (before the engineering-check workflow commit)  
**Status:** **PARTIAL — route and module inventory verified; callback-level action inventory incomplete**

## 1. Verified route inventory

Recursive GitHub tree was complete (`truncated=false`). Existing App Router has 11 page/layout routes and three Next.js API handlers:

| Route | Surface | Current handler/owner |
|---|---|---|
| `/` | Public landing | Landing UI; no partnership application FastAPI endpoint found in current v1 router |
| `/admin` | Super Admin overview | Super Admin portal; FastAPI management endpoints for existing tenant/membership operations |
| `/admin/[section]` | Super Admin sections | Domain views listed below; most domains have no complete FastAPI API contract yet |
| `/corporate` | Corporate overview | Corporate portal; FastAPI identity/tenant/organization/member operations |
| `/corporate/[section]` | Corporate sections | Domain views listed below; analytics/finance/workforce/invoice/commission/report contracts incomplete |
| `/ai-workforce` | AI Workforce overview | AI Workforce portal; authentication/shell exists; AI execution and governance routes incomplete |
| `/ai-workforce/[section]` | AI Workforce sections | Domain views listed below; durable runtime/skill/memory/workflow/approval contracts incomplete |
| `/workforce` | Human Workforce | Workforce UI; no dedicated Human Workforce FastAPI route module found |
| `/bootstrap` | First platform administrator bootstrap | `POST /api/v1/bootstrap/platform-admin` |
| `/mfa-setup` | Privileged MFA enrollment | Supabase Auth MFA client flow |
| `app/layout.tsx` | Shared document/PWA metadata | Next.js root layout |
 
Next.js API handlers:
- `POST /api/ai-workforce/generate-content` — provider-facing content generation handler; canonical owner should be FastAPI AI Gateway/Model Router, not Next.js.
- `GET /api/config/maps` — Maps browser configuration handler; owner: Maps integration/configuration.
- `GET /api/maps/reverse-geocode` — reverse-geocode handler; owner: Maps/location integration.

These handlers are recorded as current source paths, not approved long-term API ownership.

## 2. Portal feature inventory (source file / view level)

### Super Admin — `apps/admin/features/`

- AI Platform: `KnowledgeRagAdminView`, `LLMProvidersView`, `MemoryGovernanceView`, `ModelRegistryView`, `ModelRouterAdminView`, `SkillRegistryAdminView`, `ToolRegistryAdminView`, `WorkflowOrchestrationAdminView`.
- Auth: `AdminLoginView`, `AdminMfaSetupForm`, `PlatformBootstrapForm`.
- Finance: `AICreditsAdminView`, `BillingSubscriptionView`, `CommissionSchemesView`, `ContractSowSlaView`, `FinanceReconciliationView`.
- Governance: `AuditIncidentView`, `DataGovernanceView`, `GlobalAnalyticsHealthView`, `IntegrationsWebhooksView`, `SecurityCenterView`.
- Master data: `MasterDataView`, `SubscriptionPlansView`.
- Organization: `OrganizationUsersView`, `RbacMatrixView`.
- Overview: `GlobalOverviewView`.
- Tenants: `CorporateOnboardingView`, `TenantDirectoryView`.
- Workforce: `AIWorkerDetailAdminView`, `AIWorkerRegistryAdminView`, `HumanWorkforceAdminView`.

### Corporate — `apps/corporate/features/`

- AI Credits: `AICreditsCenterView`.
- Analytics: `BusinessAnalyticsView`, `SalesAffiliateAnalyticsView`.
- Auth: `CorporateLoginView`.
- Commission: `CommissionMonitoringView`.
- Contracts: `ContractPartnershipView`.
- Finance: `InvoiceCenterView`, `PaymentReconciliationView`.
- KPI: `KpiPerformanceView`, `LeaderboardView`.
- Notifications: `NotificationsAlertsView`.
- Organization: `OrganizationUsersView`.
- Overview: `ExecutiveOverviewView`.
- Reports: `ReportsExportView`.
- Settings: `SettingsGovernanceView`.
- Technical: `TechnicalOperationsView`.
- Workforce: `AIWorkforceView`, `HumanWorkforceView`.

### AI Workforce — `apps/ai-workforce/features/`

- Analytics: `CreditsPerformanceView`.
- Approvals: `ApprovalsHandoffView`.
- Auth: `AIWorkforceLoginView`.
- Capabilities: `MemoryKnowledgeView`, `ModelRouterView`, `SkillsToolsView`.
- Collaboration: `HumanAIBindingView`, `TasksCollaborationView`.
- Content Studio: `ContentStudioView`.
- Governance: `SafetyAuditSettingsView`.
- Overview: `AIWorkforceOverviewView`.
- Workers: `AIWorkerDetailView`, `AIWorkerRegistryView`, `AIWorkerStudioView`.
- Workflows: `WorkflowBuilderView`, `WorkflowCenterView`, `WorkflowRunsView`.

Shared portal files also present:
- Shells and clients: `AdminPortalClient`, `AdminAppShell`, `AdminDataDisplay`, `AdminModals`; corporate equivalents; AI Workforce equivalents.
- Hooks: `useAdminPortal`, `useCorporatePortal`, `useAIWorkforcePortal`, shared `use-mobile`.
- Service adapters: `admin-service.ts`, `corporate-service.ts`, `ai-workforce-service.ts`.
- Data/types modules: each portal's `*-data.ts` and `*-types.ts`.

## 3. Current FastAPI domain/API ownership

Canonical business API owner: `apps/api/app/api/v1` (FastAPI modular monolith). Supabase Auth remains the identity/session provider; PostgreSQL remains the sole business source of truth. Frontend service modules are typed adapters only.

| Screen/action family | Current API | Canonical domain owner | Permission/data boundary | Status |
|---|---|---|---|---|
| Login/OAuth/sign-out/session/MFA | Supabase Auth client | Identity provider | Auth session; privileged platform actions require AAL2 | Partial; hosted Auth config unverified |
| Current user/profile context | `GET /api/v1/me` | Identity | authenticated subject; profiles/memberships/role grants | Existing |
| Tenant list/switch | `GET /api/v1/tenants` | Tenant & Membership | active membership for subject | Existing |
| Organization list/create | tenant organizations endpoints | Organization | `corporate.organization.read/manage` | Partial |
| Tenant directory/create/update/archive | management endpoints | Platform Tenant Management | platform permission + AAL2 | Existing for listed operations |
| Membership list/invite | tenant membership endpoints | Membership & Invitation | tenant membership read/manage | Partial; invitation lifecycle not complete |
| Role catalogue | `GET /api/v1/roles` | RBAC/Permission Catalogue | tenant/platform role visibility | Partial; platform role filtering review required |
| First admin bootstrap | `POST /api/v1/bootstrap/platform-admin` | Platform Bootstrap | one-time token + server-only service-role | Existing; deployment config not evidenced |
| AI content generation | Next.js handler `/api/ai-workforce/generate-content` | AI Gateway/Model Router (target) | tenant policy, model allowlist, budget, audit | Ownership conflict / transitional |
| Maps config/reverse geocode | two Next.js handlers | Maps integration | restricted key, quota and location policy | Transitional; backend owner approval required |
| Corporate analytics/finance/commission/credits/contracts/invoices/reports | no complete v1 FastAPI contract | respective corporate bounded contexts | tenant + object scope + domain permission | GAP |
| Human Workforce screens/actions | no dedicated v1 router | Human Workforce | tenant/org/branch/worker scope | GAP |
| AI worker/skills/tools/memory/RAG/workflow/runs/approvals | no complete v1 contract | AI Workforce / AI Platform | tenant/worker/resource scope + approval/audit | GAP |
| Super Admin provider/model/skills/billing/finance/governance/incident actions | no complete contract for most views | respective platform domains | platform role + AAL2 + audit | GAP |

## 4. Demo, local state and direct access findings

- Existing portal service modules contain presentation helpers and empty-state snapshots; a full callback-by-callback scan is still required before declaring every UI action backed by an API.
- `admin-service.ts` includes model-routing simulation and commission preview logic. These must not be treated as authoritative provider routing or payable calculations.
- `corporate-service.ts` includes zero/empty snapshots for unprovisioned endpoints; UI must distinguish unavailable data from genuine zero values.
- `ai-workforce-service.ts` contains client-side artifact formatting/export helpers; these are not proof of persisted AI run lifecycle.
- `app/api/ai-workforce/generate-content/route.ts` is a direct provider-facing Next.js handler and is an ownership gap against the FastAPI AI Gateway target.
- Direct Supabase use outside Auth, duplicate endpoint behavior, every onClick/onSubmit handler and all local fallback branches have not yet been exhaustively traced across every component.

## 5. Acceptance and owner approvals

| Item | Status | Owner |
|---|---|---|
| App Router route inventory | DONE (tree evidence) | Frontend Lead |
| Portal feature/view inventory | DONE (tree evidence) | Frontend Lead |
| Callback-level action/form/button inventory | PARTIAL | Frontend Lead |
| Screen → API → domain → permission → entity mapping | PARTIAL | Backend Lead + Domain Owners |
| Canonical FastAPI ownership rule | DOCUMENTED / PENDING APPROVAL | Architecture Owner |
| Direct DB/demo/duplicate scan | PARTIAL | Frontend Lead + Security Lead |
| Owner approval | PENDING APPROVAL | Product Owner + Domain Owners |

No UI/UX redesign or source code change was made. This inventory is a verified route/module baseline, not a completed callback-level acceptance inventory. P00-AC-02 and P00-AC-04 remain **PARTIAL**.
