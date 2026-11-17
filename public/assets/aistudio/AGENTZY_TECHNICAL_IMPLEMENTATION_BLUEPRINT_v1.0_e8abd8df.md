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
Content-Type: application/json
X-Request-ID: <optional-client-correlation-id>
Idempotency-Key: <required-for-sensitive-commands>
```

API derives actor and tenant from verified identity/membership. A tenant
selector header may be accepted only as a requested context selector and
must be validated against membership.

## 8.4 Core API contract catalogue

  --------------------------------------------------------------------------------------------------------------
  Domain         Method         Endpoint                             Permission                   Idempotency
  -------------- -------------- ------------------------------------ ---------------------------- --------------
  Partnership    POST           `/public/partnership-applications`   public + anti-abuse          yes

  Corporate      GET            `/corporate/overview`                `corporate.analytics.read`   no

  Analytics      GET            `/corporate/analytics`               `corporate.analytics.read`   no

  Contract       GET            `/corporate/contracts`               `contract.read`              no

  Workforce      POST           `/workforce/registration`            registration policy          yes

  Affiliate      POST           `/affiliates/invitations`            `affiliate.invite.create`    yes

  Affiliate      POST           `/affiliates/{id}/approve`           `affiliate.approve`          yes

  Sales          POST           `/leads`                             `sales.lead.create`          yes

  Order          POST           `/orders`                            `order.create`               yes

  Provider       POST           `/provider-events`                   signed provider auth         yes

  Work order     POST           `/work-orders`                       `work_order.create`          yes

  Commission     POST           `/commission/calculations`           `commission.calculate`       yes

  Commission     POST           `/commission/adjustments`            `commission.adjust`          yes

  Payout         POST           `/payout-batches/{id}/approve`       `payout.batch.approve`       yes

  AI Worker      POST           `/ai-workers`                        `ai_worker.create`           yes

  AI Run         POST           `/ai-runs`                           `ai_run.create`              yes

  AI Run         POST           `/ai-runs/{id}/cancel`               `ai_run.cancel`              yes

  Knowledge      POST           `/knowledge/ingest`                  `knowledge.ingest`           yes

  Memory         POST           `/memory/search`                     memory scope policy          no

  Workflow       POST           `/workflow-runs`                     `workflow.run.create`        yes

  Workflow       POST           `/workflow-runs/{id}/approve`        `workflow.approve`           yes

  Credits        POST           `/ai-credits/topups`                 `ai_credits.topup.create`    yes

  Credits        GET            `/ai-credits/usage`                  `ai_credits.usage.read`      no
  --------------------------------------------------------------------------------------------------------------

## 8.5 Detailed contract --- Partnership application

`POST /api/v1/public/partnership-applications`

Request:

``` json
{
  "company_name": "Example Fiber Indonesia",
  "industry": "telecommunications",
  "pic_name": "Nama PIC",
  "pic_title": "Head of Operations",
  "business_email": "pic@example.co.id",
  "business_phone": "+62...",
  "website": "https://example.co.id",
  "operating_locations": ["West Java"],
  "human_workforce_needs": ["sales", "field_technician"],
  "ai_workforce_needs": ["lead_qualification", "operations_assistant"],
  "estimated_workforce": 100,
  "provider_products": ["FTTH"],
  "needs_summary": "Kebutuhan ringkas...",
  "privacy_consent": true,
  "privacy_policy_version": "2026-01"
}
```

Response `201`:

``` json
{
  "data": {
    "application_id": "uuid",
    "status": "received",
    "received_at": "2026-11-17T08:00:00Z"
  },
  "meta": {"request_id": "req_opaque"}
}
```

Do not return internal CRM scoring or other applicant data.

## 8.6 Detailed contract --- Affiliate invitation

`POST /api/v1/affiliates/invitations`

Request:

``` json
{
  "invitee_name": "Nama Calon Affiliate",
  "invitee_contact": "+62...",
  "channel": "referral_link",
  "campaign_id": "uuid"
}
```

Server-derived values: tenant, sponsor sales member, inviter identity,
referral code, expiration, allowed provider scope. Client must not
submit arbitrary sponsor ID or commission split.

Response:

``` json
{
  "data": {
    "invitation_id": "uuid",
    "affiliate_application_url": "https://...",
    "status": "invited",
    "expires_at": "2026-11-24T00:00:00Z"
  }
}
```

## 8.7 Detailed contract --- Commission calculation

`POST /api/v1/commission/calculations`

Request:

``` json
{
  "scheme_version_id": "uuid",
  "period_start": "2026-11-01",
  "period_end": "2026-11-30",
  "subject_worker_id": "uuid",
  "calculation_mode": "preview"
}
```

Server loads eligible source events and scheme version. Client cannot
supply authoritative productivity totals, rates, multiplier, affiliate
percentage, or payable amount.

Response:

``` json
{
  "data": {
    "calculation_id": "uuid",
    "status": "preview",
    "scheme_version": 3,
    "productivity": {
      "personal": "10.000",
      "affiliate": "5.000",
      "combined": "15.000",
      "affiliate_share": "3.000",
      "sales_incremental_share": "2.000",
      "sales_attributed_total": "12.000"
    },
    "financial_components": [],
    "source_event_count": 15,
    "requires_finance_approval": true
  }
}
```

Preview must not create payable ledger entries. Finalization is a
separate permission-controlled command and snapshots source
events/rules.

## 8.8 Detailed contract --- AI Run

`POST /api/v1/ai-runs`

Request:

``` json
{
  "ai_worker_id": "uuid",
  "task_id": "uuid",
  "input": {
    "objective": "Qualify assigned lead",
    "lead_reference": "uuid"
  },
  "execution_mode": "bounded",
  "idempotency_key": "client-generated-unique-key"
}
```

Server validates worker status, version, tenant, supervisor policy,
skills, tool permissions, budget, memory scope, and task assignment.

Response `202`:

``` json
{
  "data": {
    "ai_run_id": "uuid",
    "status": "queued",
    "events_url": "/api/v1/ai-runs/uuid/events"
  },
  "meta": {"request_id": "req_opaque"}
}
```

## 8.9 Detailed contract --- AI Credits top-up

`POST /api/v1/ai-credits/topups`

Request:

``` json
{
  "wallet_id": "uuid",
  "credits_amount": "10000",
  "payment_method": "configured_gateway"
}
```

Server applies wallet ownership, entitlement, min/max, pricing version,
approval, payment provider and idempotency. Client cannot set exchange
rate or final balance.

Response `202`:

``` json
{
  "data": {
    "topup_id": "uuid",
    "status": "payment_pending",
    "credits_amount": "10000",
    "pricing_version": "v4",
    "payment_reference": "opaque"
  }
}
```

## 8.10 Detailed contract --- Corporate analytics

`GET /api/v1/corporate/analytics?metric=sales_activation&period=monthly&from=2026-01-01&to=2026-11-30&group_by=region`

Response:

``` json
{
  "data": {
    "metric": "sales_activation",
    "unit": "count",
    "period": "monthly",
    "series": [],
    "dimensions": ["region"],
    "source_freshness": {
      "status": "near_realtime",
      "last_event_at": "2026-11-17T07:59:00Z",
      "computed_at": "2026-11-17T08:00:00Z"
    }
  },
  "meta": {"request_id": "req_opaque"}
}
```

Actual series must come from authorized data, never fixture data in
production.

## 8.11 Contract governance

-   Generate OpenAPI from FastAPI.
-   Keep schema examples in `docs/api/examples/`.
-   Breaking changes require `/v2` or compatible version strategy.
-   Publish deprecation window.
-   Contract tests are engineering checks; full end-to-end UAT remains
    Phase 22.
-   Every endpoint must define actor, tenant context, permission, input
    schema, output schema, errors, idempotency, side effects, audit
    event, and rate limit.

------------------------------------------------------------------------

# 9. Engine Logic & Algorithms

## 9.1 Affiliate attribution resolution

1.  Resolve order provider identity and external order ID.
2.  Load immutable attribution snapshot at order submission/lock time.
3.  Validate sponsor/affiliate active status and contract.
4.  Validate product scope and provider event.
5.  Reject duplicate attribution or route to exception queue.
6.  Record productivity event with source reference.
7.  Lock attribution for calculation period.
8.  Corrections create adjustment/re-attribution event with approval and
    reason.

## 9.2 Commission calculation pipeline

`provider_event_ingest → signature/schema validation → deduplicate → eligibility → attribution → productivity aggregation → 60/40 incremental allocation → SA tier resolution → incentive components → adjustments → statement → approval → ledger posting → payout reconciliation`

The 60/40 allocation is applied to affiliate-derived incremental
productivity as described by the PRD. The official provider rulebook
must define how productivity tier, OJT/Pro/Elite fee, multiplier,
Product Mix, and other incentives translate to payable amounts. Do not
infer multiplication semantics.

## 9.3 Model routing algorithm

1.  Classify task and data sensitivity.
2.  Resolve tenant's allowed provider/model policy.
3.  Check model capability and modality.
4.  Check region, retention, and residency compatibility.
5.  Check budget and rate limits.
6.  Score eligible models on quality, latency, availability, and
    normalized cost.
7.  Select best eligible model.
8.  If unavailable, fallback only to another eligible model.
9.  Record routing reason and pricing snapshot.
10. Record actual usage and provider response metadata.

## 9.4 Assignment scoring

Hard filters first: contract, role, skill/certification, availability,
region, tenant, safety and workload cap. Then score eligible workers:

`score = w_skill*skill_fit + w_availability*availability + w_distance*distance_fit + w_quality*quality_score - w_load*workload_penalty`

Weights are versioned and explainable. Human review can override only
with reason and audit.

## 9.5 AI Credits ledger

1.  Verify wallet/tenant and permission.
2.  Calculate estimate from pricing snapshot.
3.  Reserve budget/credits atomically.
4.  Execute AI run.
5.  Record provider usage.
6.  Calculate actual charge with effective pricing version.
7.  Settle reservation and append ledger transaction.
8.  Release unused reservation.
9.  On duplicate callback, idempotency prevents duplicate charge.
10. Corrections use reversal/adjustment transaction.

------------------------------------------------------------------------

# 10. Event & Workflow Contracts

## 10.1 Event envelope

``` json
{
  "event_id": "uuid",
  "event_type": "sales_order.activated",
  "event_version": 1,
  "tenant_id": "uuid",
  "occurred_at": "2026-11-17T08:00:00Z",
  "producer": "order_activation",
  "aggregate_type": "sales_order",
  "aggregate_id": "uuid",
  "correlation_id": "uuid",
  "causation_id": "uuid",
  "payload": {}
}
```

Events contain references and minimum necessary payload. Avoid putting
secrets, full identity documents, or unrestricted personal data in event
buses.

## 10.2 Required event families

-   `tenant.created`, `membership.activated`.
-   `partnership.application_received`, `contract.activated`.
-   `workforce.registered`, `workforce.verified`,
    `workforce.assignment_created`.
-   `affiliate.invited`, `affiliate.activated`,
    `affiliate.attribution_locked`.
-   `lead.created`, `order.submitted`, `order.activated`,
    `productivity.accepted`.
-   `work_order.assigned`, `work_order.completed`, `quality.approved`.
-   `commission.calculated`, `commission.approved`, `payout.posted`.
-   `ai_worker.approved`, `ai_run.queued`, `ai_run.completed`,
    `ai_run.failed`.
-   `ai_usage.recorded`, `ai_credit.reserved`, `ai_credit.settled`.
-   `workflow.started`, `workflow.approval_required`,
    `workflow.completed`.
-   `contract.expiring`, `invoice.overdue`,
    `security.incident_detected`.

## 10.3 Event processing guarantees

Assume at-least-once delivery. Consumers must be idempotent. Use
outbox/inbox pattern, deduplication key, retry with backoff, dead-letter
queue, and audited replay. Do not claim exactly-once delivery across
independent systems.

------------------------------------------------------------------------

# 11. Design System & Design Tokens

## 11.1 Visual direction

**Brand character:** trustworthy, modern, calm, precise, human-centered,
enterprise-grade.\
**Design language:** clean grids, generous whitespace, clear hierarchy,
restrained color, purposeful data visualization, subtle borders, minimal
shadows.\
**Avoid:** excessive gradients, neon glows, glassmorphism everywhere,
oversized decorative blobs, random rounded cards, tiny low-contrast
labels, generic AI robot imagery, charts without context, unnecessary
animation.

## 11.2 Brand colors provided

  -------------------------------------------------------------------------
  Token               HEX               RGB               Intended use
  ------------------- ----------------- ----------------- -----------------
  `brand.sky-light`   `#ADD8E6`         173, 216, 230     soft brand
                                                          surface, selected
                                                          states, subtle
                                                          highlights

  `brand.sky`         `#87CEEB`         135, 206, 235     brand accent,
                                                          illustrations,
                                                          chart highlight
  -------------------------------------------------------------------------

CMYK values provided in the PRD request: - `#ADD8E6`: 24, 6, 0, 10. -
`#87CEEB`: 78, 78, 0, 56.

Note: CMYK conversion varies by ICC profile and print process. The
supplied RGB/HEX values should be treated as authoritative for digital
UI; print artwork must be proofed with the selected printer/profile. The
supplied CMYK for `#87CEEB` should be revalidated before print
production.

## 11.3 Supporting palette

  -----------------------------------------------------------------------
  Token                   HEX                     Role
  ----------------------- ----------------------- -----------------------
  `brand.navy`            `#17324D`               primary text, strong
                                                  brand anchor

  `brand.deep-blue`       `#245477`               links, active
                                                  navigation, strong
                                                  accent

  `brand.blue-muted`      `#5F879E`               secondary charts and
                                                  icons

  `surface.canvas`        `#F5F8FA`               app background

  `surface.default`       `#FFFFFF`               cards and panels

  `surface.subtle`        `#EAF2F6`               subtle panel

  `surface.sky`           `#E6F4F9`               brand-tinted surface

  `border.default`        `#D8E3E9`               default border

  `border.strong`         `#B8C9D3`               emphasized border

  `text.primary`          `#172B3A`               main text

  `text.secondary`        `#526675`               supporting text

  `text.muted`            `#718391`               metadata; avoid for
                                                  essential text

  `text.inverse`          `#FFFFFF`               text on dark surfaces

  `status.success`        `#247A55`               success

  `status.warning`        `#A96816`               warning

  `status.danger`         `#B23A48`               destructive/error

  `status.info`           `#2D6F91`               informational

  `data.teal`             `#3B8C91`               chart series

  `data.amber`            `#C18A3A`               chart series

  `data.violet`           `#786A9C`               chart series

  `data.slate`            `#718391`               chart series
  -----------------------------------------------------------------------

Use navy/charcoal for primary text and controls. Light sky blues are
accents/surfaces, not the default body-text color. Validate contrast
against WCAG 2.2 AA for actual component states.

## 11.4 Color usage ratios

Guideline, not a hard constraint: - 65--75% white/cool-neutral
surfaces. - 15--20% navy/neutral typography and structural elements. -
5--10% sky-blue brand accents. - Remaining colors reserved for semantic
status and data visualization.

Do not color every card blue. Use brand color to communicate hierarchy
and interaction.

## 11.5 Typography

Recommended primary family: **Inter** or **Geist Sans** (choose one as
product default and self-host where licensing/build policy allows). Use
a system fallback stack.

Type scale: \| Token \| Size \| Line height \| Weight \| Usage \|
\|---\|---:\|---:\|---:\|---\| \| `text-xs` \| 12px \| 16px \| 400/500
\| metadata, helper \| \| `text-sm` \| 14px \| 20px \| 400/500 \|
secondary UI \| \| `text-base` \| 16px \| 24px \| 400 \| body \| \|
`text-lg` \| 18px \| 28px \| 500 \| section lead \| \| `text-xl` \| 20px
\| 28px \| 600 \| card/section title \| \| `text-2xl` \| 24px \| 32px \|
600 \| page subsection \| \| `text-3xl` \| 30px \| 36px \| 600 \| page
title \| \| `text-4xl` \| 36px \| 44px \| 650 \| landing hero \| \|
`text-5xl` \| 48px \| 56px \| 650 \| desktop hero only \|

Use tabular numerals for money, metrics, and tables. Avoid excessive
all-caps. Keep Indonesian copy concise and natural.

## 11.6 Spacing scale

Base unit 4px: - `space-0`: 0 - `space-1`: 4px - `space-2`: 8px -
`space-3`: 12px - `space-4`: 16px - `space-5`: 20px - `space-6`: 24px -
`space-8`: 32px - `space-10`: 40px - `space-12`: 48px - `space-16`:
64px - `space-20`: 80px - `space-24`: 96px

## 11.7 Radius, border, elevation

-   `radius-sm`: 6px --- small controls.
-   `radius-md`: 10px --- inputs/buttons.
-   `radius-lg`: 14px --- cards/panels.
-   `radius-xl`: 20px --- larger surfaces.
-   `radius-pill`: 999px --- chips only.
-   Border default: 1px solid `#D8E3E9`.
-   Shadow-sm: `0 1px 2px rgba(23,43,58,0.05)`.
-   Shadow-md: `0 8px 24px rgba(23,43,58,0.08)`.
-   Avoid stacked shadows and excessive floating cards.

## 11.8 Layout tokens

-   Desktop app content max width: 1440px.
-   Reading content max width: 760px.
-   Corporate dashboard grid: 12 columns desktop, 8 tablet, 4 mobile.
-   Main sidebar: 248px expanded, 72px collapsed (desktop).
-   Top bar: 64px desktop, 56px mobile.
-   Page gutter: 32px desktop, 24px tablet, 16px mobile.
-   Card padding: 20--24px desktop, 16px mobile.
-   Data table row: 48--56px depending density.
-   Mobile tap target: minimum 44×44px.

## 11.9 Component tokens and behavior

### Buttons

-   Primary: navy background `#17324D`, white text; hover `#245477`.
-   Secondary: white surface, border `#B8C9D3`, navy text.
-   Brand subtle: `#E6F4F9` surface, navy text.
-   Danger: `#B23A48`, used only for destructive actions.
-   Disabled: neutral gray; never rely on color alone.

### Inputs

-   Height 44px default.
-   White background, 1px border.
-   Focus ring 2px `#87CEEB` plus offset.
-   Error message text and icon; do not rely only on red border.
-   Labels always visible; placeholder is not a label.

### Cards

-   White surface, subtle border, radius 14px.
-   No gradient by default.
-   Card title 14--16px semibold.
-   KPI value 28--32px tabular.
-   Include unit, period, comparison, and source/freshness when
    meaningful.

### Tables

-   Sticky header only for long tables.
-   Right-align numeric values.
-   Use tabular numerals.
-   Explicit empty/loading/error states.
-   Do not hide critical actions in hover-only controls.
-   Mobile may use responsive row cards where appropriate.

### Charts

-   Navy, sky, teal, amber, violet, slate series.
-   Limit simultaneous series; label units and time period.
-   Avoid 3D charts.
-   Avoid red/green as the only distinction.
-   Include legend, accessible summary, and no-data state.
-   Revenue/commission chart must disclose gross/net and source status.

### Status badges

-   Use semantic colors sparingly.
-   Pair color with text/icon.
-   No decorative badges for ordinary metadata.

### Navigation

-   Clear active state using subtle sky surface and navy text.
-   Avoid a fully saturated blue sidebar unless explicitly selected as a
    brand direction.
-   Keep portal-specific navigation separate while shared shell
    components remain consistent.

## 11.10 Design tokens --- CSS variables

``` css
:root {
  --az-brand-sky-light: #ADD8E6;
  --az-brand-sky: #87CEEB;
  --az-brand-navy: #17324D;
  --az-brand-deep-blue: #245477;
  --az-brand-blue-muted: #5F879E;

  --az-surface-canvas: #F5F8FA;
  --az-surface-default: #FFFFFF;
  --az-surface-subtle: #EAF2F6;
  --az-surface-sky: #E6F4F9;

  --az-border-default: #D8E3E9;
  --az-border-strong: #B8C9D3;

  --az-text-primary: #172B3A;
  --az-text-secondary: #526675;
  --az-text-muted: #718391;
  --az-text-inverse: #FFFFFF;

  --az-success: #247A55;
  --az-warning: #A96816;
  --az-danger: #B23A48;
  --az-info: #2D6F91;

  --az-radius-sm: 6px;
  --az-radius-md: 10px;
  --az-radius-lg: 14px;
  --az-radius-xl: 20px;

  --az-space-1: 4px;
  --az-space-2: 8px;
  --az-space-3: 12px;
  --az-space-4: 16px;
  --az-space-5: 20px;
  --az-space-6: 24px;
  --az-space-8: 32px;
  --az-space-10: 40px;
  --az-space-12: 48px;
  --az-space-16: 64px;

  --az-shadow-sm: 0 1px 2px rgba(23,43,58,.05);
  --az-shadow-md: 0 8px 24px rgba(23,43,58,.08);
}
```

## 11.11 Tailwind theme mapping (conceptual)

``` ts
export const agentzyTheme = {
  colors: {
    brand: {
      skyLight: "#ADD8E6",
      sky: "#87CEEB",
      navy: "#17324D",
      deepBlue: "#245477",
      mutedBlue: "#5F879E",
    },
    surface: {
      canvas: "#F5F8FA",
      DEFAULT: "#FFFFFF",
      subtle: "#EAF2F6",
      sky: "#E6F4F9",
    },
    text: {
      primary: "#172B3A",
      secondary: "#526675",
      muted: "#718391",
      inverse: "#FFFFFF",
    },
    status: {
      success: "#247A55",
      warning: "#A96816",
      danger: "#B23A48",
      info: "#2D6F91",
    },
  },
  borderRadius: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "20px",
  },
};
```

## 11.12 Anti-AI-slop visual principles

-   Use real product UI patterns, not decorative AI-themed illustrations
    as a substitute for product clarity.
-   No generic glowing brain/robot imagery in corporate portal.
-   Avoid giant gradient backgrounds and glass panels.
-   Prefer meaningful data hierarchy and concise copy.
-   Use consistent spacing and typography.
-   Use charts only when they answer a business question.
-   Do not fabricate dashboard numbers in mockups intended to look live;
    label design prototypes clearly.
-   Landing page may use a single custom illustration system showing
    collaboration between people and AI, but should remain restrained.
-   Use real workforce/operational photography only with rights and
    consent.
-   Every visual element must communicate navigation, state, data, or
    brand identity.

## 11.13 Portal-specific design guidance

**Landing:** spacious editorial layout, white/cool-neutral canvas, navy
typography, sky-blue highlights, concise CTA, service capability
sections, no pricing unless approved.

**Corporate:** information-dense but calm; sidebar navigation, overview
KPI strip, analytics canvas, tables and drill-down; use sky blue for
selected states, navy for key actions.

**Human Workforce:** mobile-first, task-first, high contrast, large
touch targets, offline/sync status visible, minimal navigation depth.

**AI Workforce:** operational console, worker status, run timeline,
skills/tools policy, usage/budget and approval; distinguish
configured/active/paused/failed clearly.

**Super Admin:** high-density governance console with strong
table/filter patterns, risk indicators, audit detail, and confirmation
for privileged actions.

------------------------------------------------------------------------

# 12. Frontend Architecture & Component Inventory

## 12.1 Application folder pattern

``` text
apps/corporate/
├── app/
│   ├── (auth)/
│   ├── (portal)/
│   │   ├── overview/
│   │   ├── analytics/
│   │   ├── workforce/
│   │   ├── sales/
│   │   ├── technical/
│   │   ├── finance/
│   │   ├── contracts/
│   │   ├── ai-credits/
│   │   └── reports/
│   └── api/                 # only safe app-local handlers, not business authority
├── components/
│   ├── shell/
│   ├── navigation/
│   ├── data-display/
│   ├── feedback/
│   └── forms/
├── features/
├── hooks/
├── lib/
├── services/                # typed API adapters only
└── styles/
```

Equivalent feature-first structure applies to other portals.

## 12.2 Shared component library

-   AppShell, Sidebar, Topbar, Breadcrumbs.
-   PageHeader, SectionHeader.
-   Button, IconButton, LinkButton.
-   TextField, Select, DateRange, SearchInput.
-   DataTable, Pagination, FilterBar.
-   KPIStat, TrendIndicator, ChartPanel.
-   StatusBadge, EmptyState, ErrorState, LoadingSkeleton.
-   ConfirmDialog, ApprovalPanel.
-   FileUploader, EvidenceViewer.
-   ActivityTimeline, AuditDiff.
-   OfflineSyncIndicator.
-   AIWorkerStatus, RunTimeline, UsageMeter.
-   CreditBalance, TransactionList.
-   ContractSummary, InvoiceStatus.

## 12.3 Frontend state rules

-   Server state belongs in typed query cache.
-   UI state remains local unless shared.
-   Authorization is always enforced server-side; hiding UI is not
    security.
-   Realtime updates invalidate/refetch authorized query data; do not
    trust event payload as full source of truth.
-   No direct browser mutation of finance, commission, AI credit, order
    state, or tenant permissions.

------------------------------------------------------------------------

# 13. Python Backend Structure & Coding Standards

## 13.1 Proposed layout

``` text
apps/api/
├── app/
│   ├── main.py
│   ├── lifespan.py
│   ├── middleware/
│   ├── dependencies/
│   ├── api/
│   │   └── v1/
│   ├── composition/
│   └── settings.py
├── pyproject.toml
└── README.md

services/commission_engine/
├── domain/
├── application/
├── infrastructure/
├── api/
├── tests/
├── pyproject.toml
└── README.md
```

## 13.2 Dependency direction

`api → application → domain`\
`infrastructure → application ports/domain abstractions`

Domain layer must not import FastAPI, Supabase SDK, provider SDK, or
infrastructure implementations.

## 13.3 Python standards

-   Python version pinned by repository toolchain.
-   Type hints for public functions.
-   Pydantic schemas at API boundaries.
-   Decimal for money and credit amounts.
-   Explicit timezone-aware datetime.
-   Structured logging.
-   No secrets in exceptions/logs.
-   Async only where I/O-bound and supported by dependencies.
-   Bounded concurrency and timeouts.
-   Dependency lockfile and vulnerability review.
-   Domain exceptions mapped to stable API error codes.

------------------------------------------------------------------------

# 14. Repository Structure

``` text
agentzy/
├── AGENTS.md
├── README.md
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── adr/
│   ├── api/
│   ├── data/
│   ├── security/
│   ├── design-system/
│   └── operations/
├── apps/
│   ├── landing/
│   ├── corporate/
│   ├── workforce/
│   ├── ai-workforce/
│   ├── admin/
│   └── api/
├── services/
│   ├── identity/
│   ├── tenant/
│   ├── corporate/
│   ├── partnership/
│   ├── workforce/
│   ├── affiliate/
│   ├── sales_crm/
│   ├── provider_integration/
│   ├── order_activation/
│   ├── technical_operations/
│   ├── commission_engine/
│   ├── finance_billing/
│   ├── ai_credits/
│   ├── ai_gateway/
│   ├── model_router/
│   ├── ai_worker_registry/
│   ├── ai_runtime/
│   ├── skill_registry/
│   ├── memory_coordinator/
│   ├── knowledge_rag/
│   ├── workflow_orchestrator/
│   ├── analytics_kpi/
│   ├── reporting/
│   ├── notification/
│   ├── file_artifact/
│   ├── audit_security/
│   └── integration_hub/
├── packages/
│   ├── ui/
│   ├── design-tokens/
│   ├── api-client/
│   ├── api-contracts/
│   ├── schemas/
│   ├── auth-client/
│   ├── pwa/
│   ├── config/
│   └── shared-types/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   ├── seed/
│   ├── functions/
│   └── tests/
├── workers/
│   ├── event-dispatcher/
│   ├── workflow-worker/
│   ├── ai-run-worker/
│   ├── analytics-worker/
│   ├── ingestion-worker/
│   ├── notification-worker/
│   └── reconciliation-worker/
├── infrastructure/
│   ├── docker/
│   ├── deployment/
│   ├── observability/
│   └── policies/
├── scripts/
└── .github/workflows/
```

Service folders are independent domain modules with explicit interfaces.
They do not imply immediate independent microservice deployment.

------------------------------------------------------------------------

# 15. Phase-by-Phase Acceptance Criteria

Setiap phase harus menutup seluruh layer sesuai scope: schema/migration,
backend, permission, frontend, event/integration, observability,
documentation. Acceptance di bawah adalah engineering acceptance, bukan
pengganti UAT Phase 22.

  --------------------------------------------------------------------------------
  Phase                   Deliverables yang wajib ada      Acceptance criteria
  ----------------------- -------------------------------- -----------------------
  00 Governance           PRD baseline, ADR, AGENTS,       ownership, coding
                          repo/domain map                  rules, migration
                                                           policy, and source of
                                                           truth disetujui

  01 Identity/Tenant      Auth, tenant, org, membership,   login, tenant
                          RBAC/ABAC, RLS                   resolution, role scope,
                                                           API and DB
                                                           authorization aligned

  02 Landing              public pages, service catalogue, form validated, consent
                          FAQ, application form            recorded, anti-abuse
                                                           and CRM record flow
                                                           connected

  03 Corporate            corporate profile, contracts,    tenant can be onboarded
                          SOW, entitlement                 and contract scope
                                                           enforced in API/UI

  04 Workforce            passport, onboarding, skill,     worker lifecycle and
                          availability                     scoped profile access
                                                           complete

  05 Sales/Order          provider catalogue, leads,       lead/order source and
                          orders, events                   provider state
                                                           traceable; duplicate
                                                           event prevented

  06 Affiliate            invite, register, verify,        authorized Sales can
                          attribution                      invite; affiliate
                                                           status and sponsor
                                                           attribution auditable

  07 Commission           schemes, rules, calculation,     reproducible
                          ledger, payout                   calculation from source
                                                           event/rule version; no
                                                           duplicate posting;
                                                           finance approval

  08 Technical            work order, dispatch, evidence,  assignment and evidence
                          QC, SLA                          lifecycle mapped to API
                                                           and field UI

  09 AI Gateway           model registry, routing,         every model request
                          metering                         governed,
                                                           tenant-attributed,
                                                           budget-checked and
                                                           metered

  10 AI Registry          worker templates, versions,      worker config lifecycle
                          approval                         and permissioned
                                                           activation complete

  11 Skills/RAG           registry, resolver, tools,       skill
                          knowledge                        provenance/permission
                                                           and RAG citations
                                                           enforced

  12 Memory               memory types, consent,           retrieval permission
                          retrieval, retention             checked;
                                                           deletion/expiry
                                                           lifecycle represented

  13 Runtime              runs, steps, events, checkpoints run lifecycle,
                                                           cancellation, retry and
                                                           recovery states
                                                           persisted

  14 Workflow             workflow version, steps,         workflow can coordinate
                          approvals, handoff               AI/human with durable
                                                           state and audit

  15 ISP AI roles         role templates, KPI, evaluation  each initial role has
                                                           job contract, allowed
                                                           tools, budget,
                                                           supervisor and policy

  16 AI Credits           wallet, top-up, ledger, budgets  reserve/settle/refund
                                                           adjustment idempotent;
                                                           balance derives from
                                                           ledger

  17 Corporate Analytics  dashboard, KPI, reports          metrics have
                                                           definitions, source,
                                                           scope, period and
                                                           freshness

  18 Integrations         connectors, credentials refs,    authorized connection,
                          webhook                          health, replay
                                                           protection and error
                                                           handling present

  19 Super Admin          tenant/provider/model/security   privileged actions
                          governance                       permissioned, audited
                                                           and approval-gated

  20 Cross-portal         shared identity, navigation,     all portals use same
                          event/API alignment              domain source of truth;
                                                           no direct frontend
                                                           business writes

  21 Governance           retention, export, deletion,     data lifecycle,
                          finance close, runbooks          operational ownership,
                                                           backup and incident
                                                           procedures documented

  22 Final verification   UAT, security, load, staging,    sign-offs and critical
                          release gate                     findings closure;
                                                           production go/no-go
                                                           recorded

  23 Launch               controlled rollout, monitoring,  production ownership,
                          support                          alerting, support and
                                                           service review active
  --------------------------------------------------------------------------------

## 15.1 Phase evidence template

``` text
Phase:
Scope:
Commit(s):
Migration file(s):
Supabase project/reference:
Migration status:
API routes:
OpenAPI contract:
Frontend routes:
Permission keys:
RLS policies:
Events/workers:
Observability:
Known limitations:
Acceptance criteria status:
Evidence links:
Sign-off:
```

No phase may be marked complete using UI screenshots alone.

------------------------------------------------------------------------

# 16. Operational, Reliability & Observability Requirements

## 16.1 Minimum observability

-   Structured application logs.
-   Metrics for request latency/error, DB pool, queue depth/age, worker
    health.
-   Distributed tracing across API, worker, provider, AI run, and
    workflow.
-   Request/correlation/trace ID.
-   AI run timeline and tool execution logs.
-   Provider integration health.
-   Credit/commission reconciliation signals.
-   Security event alerts.

## 16.2 Reliability

-   Retry with exponential backoff and jitter.
-   Circuit breaker for provider outages.
-   Idempotent consumers.
-   Dead-letter queue with audited replay.
-   Timeouts on outbound calls.
-   Graceful degradation.
-   Backup/restore runbook.
-   Queue age and stuck-run alert.
-   Explicit service-level objectives to be set after workload sizing.

## 16.3 PWA offline policy

-   Cache only assigned and authorized work package data.
-   Keep local data minimized and protected.
-   Queue offline commands with unique event/idempotency IDs.
-   Server owns final state.
-   Conflict resolution must be explicit and auditable.
-   Revoked user/device must not continue to access protected content.

------------------------------------------------------------------------

# 17. Security Threat Model & Controls

  -----------------------------------------------------------------------
  Threat                              Control
  ----------------------------------- -----------------------------------
  Cross-tenant data leakage           tenant context, RLS, API auth,
                                      storage policy, realtime scope

  IDOR                                object-level authorization for
                                      every resource

  Credential leakage                  secret manager, redaction,
                                      rotation, no frontend secret

  Prompt injection                    untrusted content labels, policy
                                      boundaries, tool allowlist

  Tool abuse                          scoped tool permissions, approval,
                                      sandbox, rate/budget limits

  SSRF                                URL allowlist, DNS/IP validation,
                                      block private metadata ranges

  Webhook replay                      signature, timestamp tolerance,
                                      nonce/idempotency

  Commission fraud                    provider event validation,
                                      immutable attribution, duplicate
                                      detection

  Double payout                       immutable ledger, unique
                                      idempotency, payout reconciliation

  AI Credits double charge            reserve/settle ledger, idempotent
                                      provider usage

  Malicious upload                    quarantine, MIME validation,
                                      malware scan, private bucket

  Privilege escalation                deny-by-default, step-up auth,
                                      separation of duties

  Memory poisoning                    provenance, confidence, trust
                                      level, approval for sensitive
                                      writes

  Sensitive data exposure             classification, minimization,
                                      redaction, retention and audit
  -----------------------------------------------------------------------

Security is an architecture concern from Phase 01 onward, even though
comprehensive security assessment and penetration testing are scheduled
in Phase 22.

------------------------------------------------------------------------

# 18. Architecture Decisions Requiring ADR

  -----------------------------------------------------------------------
  ADR                     Decision                Proposed default
  ----------------------- ----------------------- -----------------------
  ADR-001                 Monorepo tooling        choose based on
                                                  existing repo; avoid
                                                  unnecessary migration

  ADR-002                 Modular monolith        FastAPI modular
                          boundary                monolith

  ADR-003                 Durable workflow engine Temporal or equivalent
                                                  after operational
                                                  evaluation

  ADR-004                 Queue/broker            select one
                                                  managed/operable
                                                  option; outbox is
                                                  mandatory

  ADR-005                 Analytics serving       Postgres aggregates
                                                  initially; add
                                                  warehouse only with
                                                  measured need

  ADR-006                 Auth/SSO                Supabase Auth baseline;
                                                  enterprise SSO as
                                                  capability

  ADR-007                 Model provider strategy provider adapters
                                                  behind AI Gateway

  ADR-008                 Embedding model         versioned registry;
                                                  dimensions must match
                                                  pgvector schema

  ADR-009                 File scanning           quarantine + malware
                                                  scanning integration

  ADR-010                 Payment provider        choose after Indonesian
                                                  commercial/settlement
                                                  requirements review

  ADR-011                 Deployment platform     align with existing
                                                  infrastructure and
                                                  operational ownership

  ADR-012                 Design system           shared
                                                  tokens/components
                                                  package across portals
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 19. Open Questions / Required Validation

These items must be resolved before corresponding feature is activated
for live financial or regulated operation:

1.  Official XL SMART incentive documents for AE OJT, AE Pro, AE Elite.
2.  Official definition of SA/productivity and eligible provider events.
3.  Exact meaning of fee and multiplier (per unit, progressive, lump
    sum, tier, or separate components).
4.  Contractual approval for 60% Affiliate / 40% Sales Official
    incremental split.
5.  Which incentive components can be shared and which remain
    personal-only.
6.  Affiliate legal relationship, contract, tax and payout obligations.
7.  Provider API/partner integration permissions and data mapping.
8.  AI Credits commercial conversion, refund, expiry, and invoice
    treatment.
9.  LLM provider data retention, region, privacy and pricing.
10. Data retention periods and legal basis by data class.
11. SLA, RTO/RPO, service support hours, and incident severity targets.
12. Final frontend hosting/subdomain and CI/CD conventions.

------------------------------------------------------------------------

# 20. Final Engineering Rule

Agentzy implementation is considered aligned only when each portal uses
the same authorized tenant context and shared domain services; all
sensitive business logic executes in FastAPI; all persistent business
records reside in the designated Supabase PostgreSQL source of truth;
migrations are versioned and applied incrementally; AI model access is
governed by the AI Gateway; Human-AI workflows are auditable; financial
and credit ledgers are deterministic; and design components follow the
shared Agentzy Design System.

The visual identity is anchored by `#ADD8E6` and `#87CEEB`, balanced
with navy, white, cool-neutral surfaces, and restrained semantic colors.
The product must remain calm, readable, precise, accessible, and
unmistakably enterprise-oriented rather than relying on generic AI
visual tropes.
