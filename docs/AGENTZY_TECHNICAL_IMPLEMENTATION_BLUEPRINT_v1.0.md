# AGENTZY --- TECHNICAL IMPLEMENTATION BLUEPRINT

## Engineering Architecture, Data Model, API Contracts, Security, Design System & Delivery Acceptance

**Versi:** 1.0\
**Tanggal:** 17 November 2026\
**Baseline produk:** AGENTZY MASTER PRD v2.0\
**Status:** Engineering Blueprint --- untuk implementation planning dan
technical sign-off\
**Bahasa:** Indonesia

------------------------------------------------------------------------

# 0. Hubungan dengan Master PRD

Dokumen ini menurunkan Master PRD Agentzy v2.0 menjadi rancangan
implementasi teknis. Jika terdapat perbedaan, Master PRD v2.0 tetap
menjadi baseline product intent; keputusan teknis yang lebih spesifik
dalam dokumen ini harus dicatat sebagai ADR (Architecture Decision
Record) sebelum mengubah baseline.

## 0.1 Prinsip yang tidak boleh berubah

1.  Agentzy tetap satu platform terpadu dengan empat portal:
    Corporate/ISP, Human Workforce, AI Workforce Management, dan Super
    Admin.
2.  FastAPI adalah business authority.
3.  Supabase PostgreSQL adalah primary source of truth.
4.  Frontend tidak boleh melakukan business write langsung ke Supabase
    untuk domain sensitif.
5.  Human Worker dan AI Worker adalah entitas berbeda yang dapat bekerja
    pada Task/Workflow bersama.
6.  Commission dan AI Credits dihitung oleh deterministic backend
    engine, bukan LLM.
7.  Tenant isolation berlaku di API, database RLS, Storage, Realtime,
    cache, event, dan AI context.
8.  Migration database dilakukan bertahap sesuai domain/phase dan
    langsung dikelola pada Supabase project yang ditetapkan.
9.  Tidak membuat database bisnis kedua atau duplicate source of truth.
10. Tidak menggunakan fake/mock data di production path.
11. Pengujian intensif, UAT, pengujian nyata, staging, dan release gate
    berada di fase akhir; engineering checks minimum tetap dilakukan
    selama implementasi.
12. Tidak menyatakan fitur selesai tanpa evidence implementasi.

## 0.2 Status keputusan

-   **Confirmed by PRD:** keputusan yang sudah dinyatakan di Master PRD
    v2.0.
-   **Proposed technical default:** rekomendasi teknis yang perlu
    disahkan melalui ADR.
-   **Requires business/legal validation:** tidak boleh diaktifkan untuk
    transaksi/payable sebelum ada sumber resmi atau persetujuan.

------------------------------------------------------------------------

# 1. System Context & Architecture

## 1.1 Context diagram

``` mermaid
flowchart TB
    subgraph Portals["AGENTZY EXPERIENCE LAYER"]
      LAND["Public Landing & Partnership"]
      CORP["Corporate / ISP Portal"]
      HUMAN["Human Workforce PWA"]
      AIUI["AI Workforce Management"]
      ADMIN["Agentzy Super Admin"]
    end

    subgraph Edge["EDGE & IDENTITY"]
      CDN["CDN / WAF / Rate Limit"]
      AUTH["Supabase Auth + Session"]
      API["FastAPI API Gateway / Composition Root"]
    end

    subgraph Domains["DOMAIN SERVICES — MODULAR MONOLITH"]
      TENANT["Tenant & Organization"]
      WORK["Human Workforce"]
      AFF["Affiliate & Sales"]
      OPS["Technical Operations"]
      COMM["Commission Engine"]
      FIN["Finance & Billing"]
      AI["AI Gateway / Model Router"]
      REG["AI Worker / Skill Registry"]
      MEM["Memory & RAG"]
      FLOW["Workflow Orchestrator"]
      ANA["Analytics & KPI"]
      GOV["Audit / Security / Governance"]
    end

    subgraph Infra["DATA & EXECUTION"]
      PG[("Supabase PostgreSQL")]
      VEC[("pgvector / PostGIS")]
      ST["Supabase Storage"]
      RT["Supabase Realtime"]
      Q["Queue / Outbox / Workers"]
      OBS["OpenTelemetry / Error Monitoring"]
    end

    subgraph External["AUTHORIZED EXTERNAL PROVIDERS"]
      ISP["ISP / Provider Systems"]
      LLM["LLM Providers"]
      PAY["Payment Gateway"]
      MSG["Email / Authorized Messaging"]
      MAP["Maps / Geospatial"]
    end

    Portals --> CDN --> API
    Portals --> AUTH
    API --> Domains
    Domains --> PG
    MEM --> VEC
    API --> ST
    PG --> Q
    Q --> Domains
    PG --> RT
    AI --> LLM
    AFF --> ISP
    OPS --> ISP
    FIN --> PAY
    API --> MSG
    OPS --> MAP
    Domains --> OBS
```

## 1.2 Logical planes

### Control Plane

Mengatur tenant, organization, identity, memberships, roles,
permissions, contract, service entitlement, provider configuration,
model policy, worker registration, pricing, budget, integration
credentials, feature flags, dan governance.

### Execution Plane

Menjalankan leads, orders, work orders, tasks, human assignments, AI
runs, workflows, tool calls, approvals, commission calculations, AI
usage, payouts, notifications, dan event processing.

Control Plane mengizinkan atau membatasi Execution Plane. Execution
Plane tidak boleh mengubah policy/credential/control-plane configuration
tanpa command dan approval yang sesuai.

## 1.3 Deployment topology --- proposed default

-   `landing.agentzy...`: public landing application.
-   `corporate.agentzy...`: Corporate/ISP Portal.
-   `workforce.agentzy...`: Human Workforce PWA.
-   `ai.agentzy...`: AI Workforce Management.
-   `admin.agentzy...`: Super Admin.
-   `api.agentzy...`: FastAPI API.
-   Worker processes terpisah secara deployment bila workload
    membutuhkan, tetapi tetap dalam monorepo dan domain contracts yang
    sama.

Subdomain bukan batas keamanan. Semua request tetap wajib melalui
authentication, authorization, tenant resolution, dan server-side
policy.

## 1.4 Modular monolith boundary

Mulai dengan satu FastAPI application composition root dan domain
modules terpisah. Worker asynchronous dapat menjadi process terpisah.
Hindari microservices sebelum terdapat alasan terukur seperti kebutuhan
scaling independen, isolasi runtime, ownership tim, atau release
cadence.

------------------------------------------------------------------------

# 2. Domain Bounded Contexts

  -----------------------------------------------------------------------
  Bounded context         Owns                    Tidak boleh mengambil
                                                  alih
  ----------------------- ----------------------- -----------------------
  Identity & Access       user, session,          business ownership
                          membership, role,       
                          permission              

  Tenant & Organization   tenant, org tree,       user authentication
                          branch, department      

  Corporate & Contract    corporate profile,      commission calculation
                          contract, SOW,          
                          entitlement             

  Human Workforce         passport, skill,        financial ledger
                          availability,           
                          assignment              

  Affiliate & Sales       invitation, referral,   provider
                          lead, order attribution source-of-truth status

  Provider Integration    adapter, mapping,       arbitrary business
                          webhook, reconciliation decisions
                          input                   

  Technical Operations    work order, dispatch,   payroll/commission
                          evidence, SLA           finalization

  Commission Engine       scheme, calculation,    LLM-generated
                          ledger, payout          arithmetic
                          eligibility             

  Finance & Billing       invoice, payment,       raw model inference
                          journal, reconciliation 

  AI Gateway & Router     model selection,        tenant business
                          provider calls, usage   authorization
                          capture                 

  AI Worker Registry      AI worker definition,   unrestricted execution
                          version, skills/tools   
                          binding                 

  AI Runtime              run, step, checkpoint,  policy authoring
                          tool execution          

  Memory & Knowledge      memory lifecycle,       bypassing tenant
                          retrieval, RAG          permission

  Workflow Orchestrator   workflow                direct provider
                          definitions/runs,       credential exposure
                          handoff                 

  Analytics & KPI         definitions,            authoritative financial
                          measurements,           ledger
                          aggregates, reports     

  Audit & Security        audit, security event,  mutable business
                          incident                history
  -----------------------------------------------------------------------

Each context must expose application-level commands/queries or typed
interfaces. Cross-context direct table writes are prohibited except
explicitly approved transactional boundary operations.

------------------------------------------------------------------------

# 3. ERD --- Conceptual & Logical Model

## 3.1 Core tenant and access ERD

``` mermaid
erDiagram
    TENANTS ||--o{ ORGANIZATIONS : owns
    TENANTS ||--o{ MEMBERSHIPS : scopes
    USERS ||--o{ MEMBERSHIPS : joins
    ORGANIZATIONS ||--o{ ORGANIZATIONS : parent_of
    ORGANIZATIONS ||--o{ DEPARTMENTS : contains
    ORGANIZATIONS ||--o{ BRANCHES : contains
    MEMBERSHIPS ||--o{ USER_ROLES : assigned
    ROLES ||--o{ USER_ROLES : grants
    ROLES ||--o{ ROLE_PERMISSIONS : includes
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : maps
    TENANTS ||--o{ AUDIT_LOGS : generates
```

## 3.2 Corporate and contract ERD

``` mermaid
erDiagram
    TENANTS ||--|| CORPORATE_PROFILES : represents
    CORPORATE_PROFILES ||--o{ CONTRACTS : signs
    CONTRACTS ||--o{ CONTRACT_VERSIONS : versions
    CONTRACTS ||--o{ CONTRACT_SERVICES : includes
    CONTRACTS ||--o{ CONTRACT_APPROVALS : requires
    SERVICE_CATALOG ||--o{ CONTRACT_SERVICES : selected
    CONTRACTS ||--o{ CORPORATE_INVOICES : bills
    CORPORATE_INVOICES ||--o{ CORPORATE_PAYMENTS : paid_by
```

## 3.3 Human workforce, sales, affiliate and commission ERD

``` mermaid
erDiagram
    TENANTS ||--o{ WORKFORCE_PROFILES : scopes
    WORKFORCE_PROFILES ||--o{ WORKFORCE_CONTRACTS : has
    WORKFORCE_PROFILES ||--o{ WORKFORCE_ASSIGNMENTS : receives
    WORKFORCE_PROFILES ||--o{ WORKFORCE_SKILLS : owns
    WORKFORCE_PROFILES ||--o{ AFFILIATE_PROFILES : may_be
    WORKFORCE_PROFILES ||--o{ SALES_MEMBERS : may_be
    SALES_MEMBERS ||--o{ AFFILIATE_INVITATIONS : creates
    AFFILIATE_PROFILES ||--o{ AFFILIATE_ATTRIBUTIONS : attributed
    SALES_MEMBERS ||--o{ AFFILIATE_ATTRIBUTIONS : sponsor
    LEADS ||--o{ LEAD_ACTIVITIES : has
    LEADS ||--o| CUSTOMERS : converts_to
    CUSTOMERS ||--o{ SALES_ORDERS : places
    SALES_ORDERS ||--o{ ORDER_ATTRIBUTIONS : attributed
    SALES_ORDERS ||--o{ PRODUCTIVITY_EVENTS : produces
    COMMISSION_SCHEMES ||--o{ COMMISSION_SCHEME_VERSIONS : versions
    COMMISSION_SCHEME_VERSIONS ||--o{ COMMISSION_RULES : defines
    COMMISSION_CALCULATIONS ||--o{ COMMISSION_CALCULATION_ITEMS : contains
    COMMISSION_CALCULATIONS ||--o{ COMMISSION_LEDGER : posts
    COMMISSION_LEDGER ||--o{ PAYOUT_ITEMS : settles
```

## 3.4 AI Workforce, memory, skill, tool and workflow ERD

``` mermaid
erDiagram
    TENANTS ||--o{ AI_WORKERS : owns
    AI_WORKERS ||--o{ AI_WORKER_VERSIONS : versions
    AI_WORKER_VERSIONS ||--o{ AI_WORKER_SKILLS : binds
    AI_WORKER_VERSIONS ||--o{ AI_WORKER_TOOLS : binds
    AI_WORKERS ||--o{ AI_RUNS : executes
    AI_RUNS ||--o{ AI_RUN_STEPS : contains
    AI_RUNS ||--o{ AI_RUN_EVENTS : emits
    AI_RUNS ||--o{ AI_USAGE_RECORDS : meters
    SKILL_PACKAGES ||--o{ SKILL_VERSIONS : versions
    MEMORY_RECORDS }o--|| TENANTS : scoped_to
    KNOWLEDGE_DOCUMENTS ||--o{ KNOWLEDGE_CHUNKS : chunks
    WORKFLOWS ||--o{ WORKFLOW_VERSIONS : versions
    WORKFLOW_VERSIONS ||--o{ WORKFLOW_RUNS : executes
    WORKFLOW_RUNS ||--o{ WORKFLOW_STEPS : contains
    WORKFLOW_RUNS ||--o{ WORKFLOW_APPROVALS : waits_for
    TASKS ||--o{ TASK_ASSIGNMENTS : assigned
```

## 3.5 Finance, credits and analytics ERD

``` mermaid
erDiagram
    TENANTS ||--o{ AI_CREDIT_WALLETS : owns
    AI_CREDIT_WALLETS ||--o{ AI_CREDIT_TRANSACTIONS : records
    AI_CREDIT_WALLETS ||--o{ AI_CREDIT_RESERVATIONS : reserves
    AI_CREDIT_TOPUPS ||--o{ PAYMENT_ATTEMPTS : attempts
    AI_USAGE_RECORDS ||--o{ AI_CREDIT_TRANSACTIONS : settles
    FINANCIAL_ACCOUNTS ||--o{ FINANCIAL_TRANSACTIONS : records
    FINANCIAL_TRANSACTIONS ||--o{ JOURNAL_ENTRIES : posts
    KPI_DEFINITIONS ||--o{ KPI_TARGETS : targets
    KPI_DEFINITIONS ||--o{ KPI_MEASUREMENTS : measures
    REPORT_DEFINITIONS ||--o{ REPORT_RUNS : generates
```

## 3.6 ERD implementation rules

1.  Semua tenant-owned records memiliki `tenant_id` secara eksplisit,
    atau memiliki ownership path yang dibuktikan dan ditutup oleh RLS.
2.  Primary key default: UUID. Gunakan UUIDv7 bila stack dan library
    mendukung secara konsisten; jika tidak, UUIDv4 tetap valid.
3.  Timestamp disimpan UTC (`timestamptz`).
4.  Monetary values menggunakan `numeric(p,s)`/Decimal, bukan floating
    point.
5.  Quantity/productivity memakai numeric precision sesuai definisi
    provider.
6.  Semua record penting memiliki `created_at`, `updated_at`,
    `created_by`, `updated_by`; immutable ledger tidak menyediakan
    update/delete business path.
7.  External IDs disimpan bersama provider namespace dan unique
    constraint.
8.  Status memakai enum/check constraint atau lookup table yang
    versioned; hindari free-text status.
9.  Semua command sensitif memiliki idempotency key.
10. Foreign key dan unique constraints adalah bagian dari business
    correctness, bukan sekadar optimasi.

------------------------------------------------------------------------

# 4. Canonical Data Dictionary

Berikut baseline field minimum. Implementasi final harus disesuaikan
dengan existing schema dan hasil domain review; jangan membuat tabel
duplikat.

## 4.1 Common columns

  Field          Type            Rule
  -------------- --------------- --------------------------------------------
  `id`           uuid            primary key
  `tenant_id`    uuid            required for tenant-owned data
  `created_at`   timestamptz     server-generated UTC
  `updated_at`   timestamptz     server-generated UTC
  `created_by`   uuid nullable   authenticated actor
  `updated_by`   uuid nullable   authenticated actor
  `version`      bigint          optimistic concurrency where needed
  `metadata`     jsonb           non-authoritative extensible metadata only

## 4.2 Core tables

### `tenants`

`id`, `slug`, `legal_name`, `display_name`, `status`,
`default_timezone`, `default_currency`, `data_region`, `settings`.

### `organizations`

`id`, `tenant_id`, `parent_id`, `organization_type`, `name`, `code`,
`status`.

### `memberships`

`id`, `tenant_id`, `user_id`, `organization_id`, `membership_status`,
`joined_at`, `ended_at`.

### `roles`

`id`, `tenant_id nullable`, `key`, `name`, `scope_type`,
`is_system_role`.

### `permissions`

`id`, `key`, `resource`, `action`, `description`, `risk_level`.

### `user_roles`

`id`, `tenant_id`, `membership_id`, `role_id`, `scope_type`, `scope_id`,
`valid_from`, `valid_until`.

## 4.3 Human workforce tables

### `workforce_profiles`

`id`, `tenant_id`, `user_id nullable`, `worker_code`, `display_name`,
`worker_type`, `engagement_classification`, `verification_status`,
`lifecycle_status`, `primary_organization_id`.

### `workforce_contracts`

`id`, `tenant_id`, `workforce_profile_id`, `contract_type`,
`contract_reference`, `effective_from`, `effective_until`, `status`,
`document_id`.

### `workforce_assignments`

`id`, `tenant_id`, `workforce_profile_id`, `assignment_type`,
`resource_type`, `resource_id`, `assigned_by`, `accepted_at`,
`started_at`, `completed_at`, `status`.

### `workforce_skills`

`id`, `tenant_id`, `workforce_profile_id`, `skill_id`,
`proficiency_level`, `verified_at`, `valid_until`.

## 4.4 Affiliate and sales tables

### `affiliate_profiles`

`id`, `tenant_id`, `workforce_profile_id`, `affiliate_code`,
`sponsor_sales_member_id`, `agreement_status`, `onboarding_status`,
`eligibility_status`, `activated_at`.

### `affiliate_attributions`

`id`, `tenant_id`, `affiliate_profile_id`, `sales_member_id`,
`attribution_type`, `effective_from`, `effective_until`, `status`,
`locked_at`, `correction_reason`.

### `sales_orders`

`id`, `tenant_id`, `provider_id`, `external_order_id`, `customer_id`,
`product_id`, `order_status`, `activation_status`, `submitted_at`,
`activated_at`, `source_payload_ref`.

### `order_attributions`

`id`, `tenant_id`, `sales_order_id`, `attributed_worker_id`,
`attribution_type`, `share_basis`, `attribution_status`, `locked_at`.

### `productivity_events`

`id`, `tenant_id`, `provider_id`, `sales_order_id`, `event_type`,
`product_key`, `productivity_quantity`, `effective_at`, `accepted_at`,
`deduplication_key`, `source_reference`.

Unique key should prevent duplicate provider event processing, for
example `(provider_id, deduplication_key)`.

## 4.5 Commission tables

### `commission_schemes`

`id`, `tenant_id`, `provider_id`, `scheme_key`, `name`, `status`.

### `commission_scheme_versions`

`id`, `scheme_id`, `version_number`, `effective_from`,
`effective_until`, `approval_status`, `source_document_ref`,
`approved_by`, `approved_at`, `rule_snapshot_hash`.

### `commission_rules`

`id`, `scheme_version_id`, `rule_key`, `component_type`, `formula_type`,
`configuration`, `eligibility_expression`, `priority`.

### `commission_calculations`

`id`, `tenant_id`, `scheme_version_id`, `period_start`, `period_end`,
`subject_worker_id`, `personal_productivity`, `affiliate_productivity`,
`combined_productivity`, `affiliate_share`, `sales_incremental_share`,
`calculation_status`, `source_snapshot_hash`.

### `commission_calculation_items`

`id`, `calculation_id`, `source_event_id`, `component_key`,
`basis_quantity`, `rate`, `multiplier`, `gross_amount`,
`adjustment_amount`, `net_amount`, `rule_reference`.

### `commission_ledger`

`id`, `tenant_id`, `calculation_id`, `beneficiary_worker_id`,
`entry_type`, `amount`, `currency`, `period_key`, `idempotency_key`,
`posted_at`, `reversal_of_id`.

Ledger is append-only. Reversal/correction uses new rows linked through
`reversal_of_id`.

## 4.6 AI Worker and runtime tables

### `ai_workers`

`id`, `tenant_id`, `worker_key`, `name`, `department_id`, `job_role`,
`supervisor_user_id`, `lifecycle_status`, `risk_level`,
`current_version_id`.

### `ai_worker_versions`

`id`, `ai_worker_id`, `version_number`, `job_description`, `objectives`,
`kpi_definition`, `model_policy_id`, `memory_policy_id`,
`budget_policy_id`, `configuration_snapshot`, `approved_by`,
`approved_at`.

### `ai_runs`

`id`, `tenant_id`, `ai_worker_id`, `worker_version_id`,
`workflow_run_id nullable`, `task_id nullable`, `run_status`,
`input_ref`, `output_ref`, `started_at`, `finished_at`, `trace_id`,
`idempotency_key`.

### `ai_run_steps`

`id`, `ai_run_id`, `step_key`, `step_type`, `attempt`, `step_status`,
`input_ref`, `output_ref`, `error_code`, `started_at`, `finished_at`,
`checkpoint_ref`.

### `ai_usage_records`

`id`, `tenant_id`, `ai_run_id`, `ai_run_step_id`, `provider_key`,
`model_key`, `model_version`, `input_tokens`, `output_tokens`,
`cached_tokens`, `provider_cost`, `currency`, `pricing_snapshot_id`,
`measured_at`.

## 4.7 Memory and knowledge tables

### `memory_records`

`id`, `tenant_id`, `owner_type`, `owner_id`, `memory_type`,
`content_ref`, `source_type`, `source_id`, `confidence`, `sensitivity`,
`purpose`, `consent_ref`, `retention_until`, `lifecycle_status`,
`embedding_ref`.

### `memory_permissions`

`id`, `tenant_id`, `memory_record_id`, `principal_type`, `principal_id`,
`permission`, `valid_until`.

### `knowledge_documents`

`id`, `tenant_id`, `source_type`, `source_reference`, `title`,
`mime_type`, `storage_path`, `classification`, `ingestion_status`,
`version`, `deleted_at`.

### `knowledge_chunks`

`id`, `tenant_id`, `document_id`, `chunk_index`, `content`, `embedding`,
`metadata`, `source_page`, `content_hash`.

## 4.8 AI Credits tables

### `ai_credit_wallets`

`id`, `tenant_id`, `wallet_key`, `owner_type`, `owner_id`,
`currency_unit`, `status`, `available_balance_cached`.

Cached balance is a projection only; ledger is authoritative.

### `ai_credit_transactions`

`id`, `tenant_id`, `wallet_id`, `transaction_type`, `amount`,
`balance_effect`, `source_type`, `source_id`, `idempotency_key`,
`posted_at`, `reversal_of_id`.

### `ai_credit_reservations`

`id`, `tenant_id`, `wallet_id`, `ai_run_id`, `reserved_amount`,
`settled_amount`, `reservation_status`, `expires_at`.

### `ai_credit_pricing_rules`

`id`, `tenant_id nullable`, `provider_key`, `model_key`,
`pricing_version`, `effective_from`, `effective_until`,
`conversion_configuration`, `approved_by`.

## 4.9 Workflow and analytics tables

`workflows`: tenant, key, name, lifecycle status.\
`workflow_versions`: workflow, version, definition JSON, schema version,
approval/publish metadata.\
`workflow_runs`: tenant, workflow version, status, trigger reference,
start/end, trace.\
`workflow_steps`: run, step key, type, status, attempt, checkpoint,
input/output refs.\
`workflow_approvals`: run/step, approver, decision, reason, timestamp.\
`kpi_definitions`: key, formula version, unit, grain, dimensions,
source.\
`kpi_targets`: KPI, scope, period, target value, effective dates.\
`kpi_measurements`: KPI, scope, period, actual value, source snapshot,
calculated_at.\
`analytics_events`: event key/version, tenant, subject, dimensions,
occurred_at, source reference.\
`analytics_aggregates`: metric key, dimensions, period grain, values,
computed_at, source watermark.

------------------------------------------------------------------------

# 5. Database Migration Plan

## 5.1 Migration policy

-   Migration source lives in `supabase/migrations/`.
-   Every migration has ordered timestamp/version and descriptive name.
-   No manual production schema changes without migration
    reconciliation.
-   Apply migration to the designated Supabase project with controlled
    credentials.
-   Record migration version, execution result, operator/automation
    identity, and timestamp.
-   Use expand-migrate-contract for breaking schema changes.
-   Backfills must be resumable, checkpointed, rate-limited, and
    observable.
-   Destructive migrations require explicit approval and tested recovery
    plan in final verification phase.
-   Keep business data out of seed files. Seed only required
    reference/configuration data.
-   Never drop or recreate the existing database to simplify
    implementation.

## 5.2 Migration batches

  --------------------------------------------------------------------------------------
  Batch                                        Phase Migration scope
  --------------------- ---------------------------- -----------------------------------
  M000                                            00 baseline inspection, migration
                                                     inventory, extensions policy

  M010                                            01 tenants, organizations, users
                                                     mapping, memberships, RBAC, audit

  M020                                            02 partnership applications, public
                                                     service catalogue, consent

  M030                                            03 corporate profiles, contracts,
                                                     versions, SOW, entitlements,
                                                     invoices

  M040                                            04 workforce profiles, contracts,
                                                     skills, availability, training

  M050                                            05 providers, products, leads,
                                                     customers, orders, attribution,
                                                     provider events

  M060                                            06 affiliate profiles, invitations,
                                                     agreements, referral, attribution

  M070                                            07 commission schemes, versions,
                                                     rules, events, calculations,
                                                     ledger, payout

  M080                                            08 technicians, work orders,
                                                     assignments, events, evidence, QC,
                                                     SLA

  M090                                            09 model registry, AI policies, usage
                                                     metering, gateway configuration

  M100                                            10 AI worker registry, versions,
                                                     skills/tools bindings, approvals

  M110                                            11 skill packages/versions, tool
                                                     registry, knowledge
                                                     documents/chunks

  M120                                            12 memory records, permissions,
                                                     retention, access logs

  M130                                            13 AI runs, steps, events,
                                                     checkpoints, execution leases

  M140                                            14 workflow definitions, versions,
                                                     runs, steps, approvals

  M150                                            15 role catalogue, evaluation,
                                                     performance measurement
                                                     configuration

  M160                                            16 AI credit wallets, transactions,
                                                     reservations, top-ups, budgets

  M170                                            17 analytics events, aggregates, KPI
                                                     definitions/targets/measurements,
                                                     reports

  M180                                            18 integration records, credentials
                                                     references, webhooks,
                                                     notifications, outbox

  M190                                            19 governance, feature flags,
                                                     incident/security operations
                                                     configuration

  M200                                            20 cross-domain constraints, indexes,
                                                     consistency fixes, cleanup of
                                                     obsolete paths

  M210                                            21 retention/deletion jobs, data
                                                     subject request, finance close
                                                     metadata

  M220                                            22 final migration reconciliation and
                                                     release-readiness schema freeze
  --------------------------------------------------------------------------------------

## 5.3 Per-migration checklist

1.  Schema change and purpose documented.
2.  Tenant ownership and RLS policy defined.
3.  Constraints and indexes defined.
4.  Backward compatibility assessed.
5.  Existing data impact assessed.
6.  API contract updated.
7.  Storage/Realtime policy updated if applicable.
8.  Roll-forward and recovery approach documented.
9.  Migration applied and state captured.
10. No duplicate table/column/source of truth introduced.

## 5.4 Supabase security requirements

-   Enable RLS on all tenant-owned tables.
-   Revoke broad default privileges where appropriate.
-   Use narrowly scoped database roles.
-   Never expose service-role key to browser.
-   Avoid SECURITY DEFINER functions unless reviewed for search_path,
    owner, grants, and tenant checks.
-   Supabase Storage buckets private by default for contracts, identity
    documents, evidence, and artifacts.
-   Signed URLs short-lived and issued only after authorization.
-   Realtime subscriptions must be scoped and validated; do not assume
    channel name is a security boundary.

------------------------------------------------------------------------

# 6. RLS, Tenant Resolution & Security Policy

## 6.1 Tenant resolution flow

1.  Validate session/JWT.
2.  Resolve user identity.
3.  Load active membership(s).
4.  Resolve selected tenant from memberships the user actually owns.
5.  Validate membership status and access policy.
6.  Establish immutable request context.
7.  Execute service operation with tenant context.
8.  Apply database RLS as defense in depth.
9.  Emit audit/security event for sensitive actions.

Never trust `tenant_id` submitted by client as authorization proof.

## 6.2 RLS policy pattern

Conceptual policy (adapt to actual Supabase schema and helper
functions):

``` sql
-- Example only: function must validate active membership.
create policy tenant_select_policy
on public.example_tenant_table
for select
to authenticated
using (
  public.user_has_tenant_access(tenant_id, auth.uid())
);
```

For writes, use both `USING` and `WITH CHECK` with operation-specific
permission checks. Do not use one generic policy for every table if
read/write rights differ.

## 6.3 Security controls by data class

  -----------------------------------------------------------------------
  Classification          Examples                Required controls
  ----------------------- ----------------------- -----------------------
  Public                  marketing copy, public  public read, reviewed
                          FAQ                     publication

  Internal                operational metadata    authenticated, tenant
                                                  scope

  Confidential            contracts, customer     strict RBAC/ABAC,
                          details, sales records  audit, private storage

  Restricted              identity docs,          narrow roles,
                          financial ledgers,      encryption, short-lived
                          credentials, sensitive  access, enhanced audit
                          memory                  

  Secret                  provider API keys,      secret manager only;
                          signing secrets         never DB plaintext or
                                                  frontend
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 7. Permission Matrix

## 7.1 Role catalogue

-   `platform_super_admin`
-   `platform_security_admin`
-   `platform_finance_admin`
-   `platform_operations_admin`
-   `corporate_owner`
-   `corporate_admin`
-   `corporate_director_viewer`
-   `corporate_finance_manager`
-   `corporate_sales_manager`
-   `corporate_operations_manager`
-   `corporate_workforce_manager`
-   `corporate_ai_manager`
-   `corporate_auditor`
-   `sales_manager`
-   `sales_supervisor`
-   `sales_official`
-   `affiliate_worker`
-   `technician`
-   `field_quality_inspector`
-   `ai_worker_supervisor`
-   `ai_platform_operator`
-   `support_agent`

## 7.2 Legend

-   **F** = full within assigned tenant/scope.
-   **R** = read.
-   **C/U** = create/update.
-   **A** = approve.
-   **O** = own records only.
-   **S** = scoped records only.
-   **---** = no access.
-   High-risk actions require step-up auth/approval even where role has
    permission.

## 7.3 Permission matrix (summary)

  --------------------------------------------------------------------------------------------------------------------------------------
  Resource/action         Corp    Corp   Finance   Sales   Ops   Workforce  AI Mgr   Auditor      Sales   Affiliate   Technician   Super
                         Owner   Admin       Mgr     Mgr   Mgr         Mgr                     Official                            Admin
  -------------------- ------- ------- --------- ------- ----- ----------- ------- --------- ---------- ----------- ------------ -------
  Corporate overview         R       R         R       R     R           R       R         R        ---         ---          ---       F

  Organization/users         F     C/U       ---       S     S           S       S         R        ---         ---          ---       F

  Contract view              R       R         R       R     R           R       R         R        ---         ---          ---       F

  Contract approval        A\*     A\*       ---     ---   ---         ---     ---       ---        ---         ---          ---     A\*

  Financial summary          R       S         F       S     S         ---       S         R        O\*         ---          ---       F

  Invoice/payment            R   C/U\*         F     ---   ---         ---     ---         R        ---         ---          ---       F

  AI Credits view            R       R         R     ---   ---         ---       F         R        ---         ---          ---       F

  AI Credits top-up        A\*   C/U\*   C/U/A\*     ---   ---         ---   C/U\*         R        ---         ---          ---       F

  Human workforce view       R       R       ---       S     S           F     ---         R        O/S           O            O       F

  Workforce onboarding     ---     C/U       ---       S     S           F     ---         R        C/S         O/C          ---       F

  Affiliate                ---   C/U\*       ---       F   ---           S     ---         R          C           O          ---       F
  recruitment                                                                                                                    

  Affiliate approval       ---     A\*       ---     A\*   ---         A\*     ---         R        ---         ---          ---       F

  Leads/orders               R       R       ---       F     S         ---     ---         R      C/U/S         O/S          ---       F

  Commission statement       R       R         F       S   ---         ---     ---         R        O/S           O          ---       F

  Commission scheme        ---     ---       ---     ---   ---         ---     ---         R        ---         ---          ---       F
  edit                                                                                                                           

  Payout approve           ---     ---       A\*     ---   ---         ---     ---         R        ---         ---          ---     A\*

  Work orders                R       R       ---     ---     F           S     ---         R        ---         ---          S/O       F

  Work evidence              R       R       ---     ---     R           R     ---         R        ---         ---          C/O       F

  AI Worker config         ---       R       ---     ---   ---         ---       F         R        ---         ---          ---       F

  AI Worker run view         R       R       ---       S     S         ---       F         R        ---         ---          ---       F

  AI policy/model          ---     ---       ---     ---   ---         ---   C/U\*         R        ---         ---          ---       F
  config                                                                                                                         

  Memory access            ---     ---       ---     ---   ---         ---     S\*       R\*        ---         ---          ---     F\*

  Reports/export             R     C/U         F       S     S           S       S         R          O           O            O       F

  Audit logs               R\*     R\*       R\*     R\*   R\*         R\*     R\*         R        ---         ---          ---       F

  Platform                 ---     ---       ---     ---   ---         ---     ---       ---        ---         ---          ---       F
  configuration                                                                                                                  
  --------------------------------------------------------------------------------------------------------------------------------------

`*` Requires scope, approval, or step-up authentication. Super Admin
access remains audited and does not imply unrestricted access to
customer content.

## 7.4 Fine-grained permission keys

Examples: - `corporate.analytics.read` - `corporate.finance.read` -
`contract.read` - `contract.approve` - `workforce.profile.read` -
`workforce.profile.verify` - `workforce.assignment.create` -
`affiliate.invite.create` - `affiliate.approve` - `sales.lead.assign` -
`order.submit` - `commission.scheme.manage` - `commission.calculate` -
`commission.adjust` - `payout.batch.approve` - `ai_worker.configure` -
`ai_worker.approve` - `ai_run.cancel` - `ai_model_policy.manage` -
`memory.read.restricted` - `ai_credits.topup.create` -
`ai_credits.topup.approve` - `audit.read` - `tenant.manage`

Permissions are assigned to roles and scoped to tenant, organization,
branch, resource, and time validity as needed.

------------------------------------------------------------------------

# 8. API Contract Standards

## 8.1 Naming and versioning

-   Base path: `/api/v1`.
-   Nouns for resources; explicit command subroutes for state
    transitions.
-   JSON request/response.
-   `snake_case` JSON keys recommended consistently across Python API.
-   UUID resource IDs.
-   UTC ISO-8601 timestamps.
-   Decimal values serialized as strings or safe numeric contract with
    documented precision; string is preferred for money.
-   Cursor pagination for large/continuously changing lists.
-   `Idempotency-Key` mandatory for financial/top-up/order/payout
    commands.
-   `X-Request-ID` generated or propagated.
-   Never return provider secrets or internal stack traces.

## 8.2 Standard response envelope

Success:

``` json
{
  "data": {},
  "meta": {
    "request_id": "req_opaque",
    "trace_id": "trace_opaque"
  }
}
```

Paginated:

``` json
{
  "data": [],
  "meta": {
    "next_cursor": "opaque_cursor",
    "has_more": true,
    "request_id": "req_opaque"
  }
}
```

Error:

``` json
{
  "error": {
    "code": "RESOURCE_NOT_AVAILABLE",
    "message": "Resource tidak tersedia atau tidak dapat diakses.",
    "request_id": "req_opaque",
    "details": []
  }
}
```

## 8.3 Authentication headers

``` http
Authorization: Bearer <access_token>