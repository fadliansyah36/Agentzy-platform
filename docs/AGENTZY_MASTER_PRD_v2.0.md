# AGENTZY --- MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Unified Human & AI Workforce Platform

**Versi:** 2.0 \| **Tanggal:** 17 November 2026 \| **Status:** Master
Product & Engineering Baseline\
**Positioning:** Enterprise SaaS + Managed Human Workforce + Managed AI
Workforce\
**Tagline:** One Platform to Manage Human & AI Workforce.

------------------------------------------------------------------------

## 0. Kendali Dokumen dan Prinsip

Dokumen ini menjadi acuan produk, arsitektur, database, backend,
frontend, AI runtime, workflow, security, dan implementasi Agentzy.

Prinsip wajib: 1. Satu platform terpadu, bukan aplikasi Human dan AI
yang terpisah. 2. Human Worker dan AI Worker adalah entitas eksekusi
berbeda, tetapi berbagi tenant, organisasi, task, workflow, KPI,
governance, dan analytics. 3. ISP/telekomunikasi menjadi industri awal;
domain dapat dikonfigurasi untuk industri lain. 4. FastAPI adalah
business authority. Frontend tidak boleh menjadi sumber kebenaran untuk
saldo, komisi, billing, KPI finansial, authorization, atau status
transaksi. 5. Supabase PostgreSQL adalah primary source of truth. Tidak
membuat database bisnis kedua. 6. Tidak ada mock/fake business data atau
fallback demo di production path. 7. Setiap phase mengintegrasikan
migration, API, authorization, UI, event, dan dokumentasi sesuai ruang
lingkupnya. 8. Migration dilakukan bertahap setiap phase, bukan ditumpuk
di akhir. 9. Pengujian intensif, UAT, pengujian nyata, staging,
load/security acceptance, dan production release gate ditempatkan pada
phase akhir. Pemeriksaan engineering minimum seperti lint, type-check,
migration consistency, schema/API contract validation dan static checks
tetap dilakukan selama development. 10. Tidak boleh menyatakan fitur
selesai tanpa bukti commit, migration, endpoint, UI route, permission,
dan integration evidence.

**Terminologi:** Tenant = batas isolasi data; Corporate = pelanggan
perusahaan; ISP Provider = mitra penyedia layanan; Human Worker = tenaga
kerja manusia; AI Worker = agen AI terkelola; Affiliate Freelance =
mitra independen yang direkrut dan didaftarkan; AI Credits = unit
metering internal, bukan token LLM atau uang tunai; SA/productivity =
basis produktivitas sesuai definisi provider yang berlaku.

------------------------------------------------------------------------

# 1. Visi, Masalah, dan Model Bisnis

## 1.1 Visi

Agentzy menyatukan pengelolaan tenaga kerja manusia dan tenaga kerja AI
dalam satu sistem enterprise. Corporate dapat memperoleh, mengelola,
menugaskan, memantau, mengevaluasi, dan mengukur hasil kerja kedua jenis
workforce melalui satu platform.

## 1.2 Masalah yang diselesaikan

-   Data workforce tersebar di spreadsheet, chat, dan aplikasi berbeda.
-   Produktivitas, sales, affiliate, order, instalasi, SLA, dan komisi
    tidak terhubung.
-   AI digunakan sebagai tools terpisah tanpa job description,
    supervisor, KPI, budget, permission, dan audit.
-   Biaya AI sulit ditelusuri per worker, workflow, departemen, dan
    corporate.
-   Kontrak, SOW, tagihan, dan performa layanan tidak transparan.
-   Manajemen membutuhkan analytics yang dapat ditelusuri ke data
    transaksi.

## 1.3 Dua lapisan komersial

**Agentzy Platform:** SaaS subscription/licensing, portal, API,
integrations, analytics, AI usage metering.\
**Agentzy Managed Services:** recruitment/management Human Workforce,
affiliate operations, technical workforce, AI Worker setup/operation,
hybrid operations.

Pisahkan pendapatan Agentzy, pendapatan ISP, biaya workforce, komisi, AI
provider cost, reimbursement, dan pass-through charges. Nilai penjualan
ISP bukan otomatis pendapatan Agentzy.

## 1.4 Nilai utama

-   Unified Human + AI Workforce.
-   Managed AI Workers dengan role, SOP, skills, tools, KPI, budget,
    supervisor, audit.
-   Workforce Passport dan work history.
-   Sales dapat merekrut Affiliate Freelance dan mendaftarkannya dalam
    sistem.
-   Deterministic Commission Engine.
-   Corporate Intelligence & Partner Portal.
-   Workflow Human-AI dengan approval dan handoff.
-   Multi-provider, multi-tenant, multi-industry.
-   Enterprise security dan governance.

------------------------------------------------------------------------

# 2. Platform dan Empat Portal

Satu platform dengan empat portal yang memakai identity, tenant, API,
data model, workflow, dan governance yang sama.

## 2.1 Corporate / ISP Partner Portal

**Tujuan:** dashboard khusus corporate/ISP untuk memantau layanan dan
hasil kerja sama Agentzy.

Modul: 1. Executive Overview. 2. Business Analytics. 3. Sales &
Affiliate Analytics. 4. Human Workforce Monitoring. 5. AI Workforce
Monitoring. 6. Technical Operations. 7. KPI & Performance. 8. Financial
Intelligence. 9. Commission Monitoring. 10. AI Credits Center. 11.
Contract & Partnership Center. 12. Invoice & Payment. 13. Reports &
Export. 14. Organization/User Management. 15. Notifications & Alerts.
16. Audit & Compliance View.

Executive Overview menampilkan workforce aktif, Human/AI Worker count,
aktivitas, lead, order, activation, KPI target vs actual, produktivitas,
SLA, pendapatan yang menjadi hak corporate, biaya layanan Agentzy, AI
Credits balance/usage, dan kontrak yang mendekati expiry.

Analytics menyediakan filter periode, provider, region, branch,
department, team, product, channel, worker, dan status. Visualisasi:
trend, target-vs-actual, funnel, ranking, cohort, geographic view bila
diizinkan, cost/revenue breakdown, SLA, AI usage. Setiap chart wajib
menunjukkan unit, periode, source, dan last-updated.

Financial Intelligence menampilkan invoice Agentzy, subscription/managed
service, AI Credits, komisi sesuai kewenangan, biaya layanan sesuai
kontrak, payment aging, settlement, reconciliation, dan export. Margin
internal Agentzy tidak otomatis terlihat oleh corporate.

Contract Center: kontrak induk, SOW, service scope, SLA, KPI,
entitlement workforce, AI Worker limits, versioning, approvals,
signature status, effective/expiry date, renewal, amendment, invoice
reference, secure document access.

AI Credits Center: wallet per tenant/cost center, top-up request,
balance, transaction history, usage per
worker/department/model/workflow/run, input/output token, provider cost
snapshot, conversion rule, budget, hard/soft limit, alert, forecast
berlabel estimasi, monthly statement, optional auto-top-up dengan
consent dan cap.

## 2.2 Human Workforce Portal

Modul: - Registration & Identity Verification. - Workforce Passport. -
Profile, skills, certification, training. - Employment/engagement
status. - Availability dan scheduling. - Job marketplace/assignment. -
Sales workspace. - Affiliate recruitment. - Lead/customer activity. -
Order submission/tracking. - Technical work orders. - Check-in/out
sesuai policy. - Evidence upload. - KPI/performance. - Commission
statement. - Earnings/payout. - Notification, support, dispute. -
Contract/policy acknowledgement.

Workforce Passport menyimpan identity verification, klasifikasi hubungan
kerja, provider/organization, role, skill, sertifikasi, pengalaman,
availability, area kerja sesuai izin, assignment history, performance,
training, contract, dan earning history.

Klasifikasi hubungan harus mencerminkan fakta dan hukum: employee,
outsourced worker, independent contractor, freelance affiliate,
technical partner, project-based worker. Label aplikasi tidak boleh
dipakai untuk menghindari kewajiban hukum.

## 2.3 AI Workforce Management

Modul: - AI Worker Registry & Templates. - AI Worker Studio. - Job
Description, objective, KPI, SLA. - Model Router configuration. - Skill
Registry & Resolver. - Tool Registry & permissions. - Memory
Management. - Knowledge/RAG. - Workflow assignment. - AI Run Monitor. -
Approval & human handoff. - Budget & AI Credits. -
Performance/evaluation. - Versioning/release. - Safety/policy. -
Audit/run history/incident.

Setiap AI Worker memiliki `ai_worker_id`, tenant, role, department, JD,
objectives, KPI/SLA, supervisor, allowed skills/tools, model policy,
memory scope, knowledge access, budget, execution environment, version,
risk classification, dan audit trail.

Lifecycle:
`draft → configured → policy_review → approved → active → paused/suspended → retired`.

## 2.4 Agentzy Super Admin

Modul: - Global Overview. - Tenant/Corporate/Provider Management. -
Industry & Service Catalogue. - Subscription/entitlement. - Human
Workforce Operations. - Affiliate Governance. - AI Worker
Registry/Runtime. - LLM Provider & Model Router. - Skill/Tool
Registry. - Memory Governance. - AI Credits Pricing/Billing. -
Contract/SOW. - Commission Scheme. - Finance/Reconciliation. -
Integrations/Webhooks. - Security/Access. - Audit/Incident. - Data
Governance/Retention. - Feature Flags. - System Health.

Global/break-glass access harus time-bound, disetujui, dicatat, dan
ditinjau.

------------------------------------------------------------------------

# 3. Public Landing Page & Partnership Acquisition

## 3.1 Sitemap

`/` Home; `/about`; `/solutions`; `/solutions/human-workforce`;
`/solutions/ai-workforce`; `/solutions/hybrid-workforce`; `/industries`;
`/industries/telecommunications`; `/partners`; `/workforce`; `/contact`;
`/partnership/apply`; `/faq`; `/privacy`; `/terms`; `/security`;
`/login`.

## 3.2 Home Page Sections

1.  **Hero:** "Human Workforce and AI Workforce, Working as One." CTA:
    Ajukan Kerja Sama / Pelajari Solusi.
2.  **About Agentzy:** profil, visi, misi, unified workforce, managed
    services.
3.  **Solutions:** Human, AI, Hybrid Workforce.
4.  **Advantages:** unified platform, managed operations, transparent
    KPI, Human-AI collaboration, affiliate recruitment, multi-provider,
    governance.
5.  **Industries:** ISP/telekomunikasi sebagai fokus awal; ekspansi
    industri lain.
6.  **Service catalogue tanpa harga.**

Human Workforce service list: - Sales workforce. - Affiliate/freelance
network management. - Field technician workforce. -
Recruitment/onboarding. - Training/certification. -
Scheduling/dispatch. - Performance/KPI. - Commission administration. -
Workforce reporting.

AI Workforce service list: - AI Sales Assistant. - AI Lead
Qualification. - AI Affiliate Recruitment/Onboarding Assistant. - AI
Marketing & Content Assistant. - AI Customer Support Assistant. - AI
Technical Knowledge Assistant. - AI Operations Coordinator. - AI Data &
Performance Analyst. - AI Finance Reporting Assistant. - Custom AI
Worker by job description.

Setiap layanan menjelaskan scope, output, boundary, governance, dan
integrasi. Jangan mengklaim kapabilitas yang belum tersedia.

7.  **Partnership process:** application → qualification → discovery →
    proposal/scope → legal/commercial review → contract/SOW → tenant
    onboarding → deployment → operational review.
8.  **FAQ:** Agentzy, Human vs AI, managed AI, corporate supervision,
    affiliate recruitment, commission, multi-ISP, integration, AI
    Credits, security, partnership, multi-industry.
9.  **CTA & contact.**

## 3.3 Partnership Form

Fields: company name/type, PIC, title, business email/phone, website,
operating locations, Human Workforce needs, AI Workforce needs,
estimated workforce optional, provider/products, needs summary, optional
attachments, privacy/communication consent.

Backend controls: validation, rate limit, bot protection, duplicate
protection, consent timestamp/policy version, file type/size validation,
malware scan/quarantine, CRM lead creation, notification. Public user
tidak boleh membaca internal prospect records.

------------------------------------------------------------------------

# 4. ISP Industry Configuration

Provider profile berisi provider identity, product catalogue,
FTTH/FWA/produk lain, coverage source, order requirements, activation
mapping, SLA, incentive scheme, eligibility, API/webhook configuration,
data mapping version, dan contract terms.

Tidak semua ISP menyediakan public API. Gunakan hanya REST API, webhook,
partner portal, secure file exchange, atau rekonsiliasi resmi yang
diotorisasi. Dilarang scraping/akses tanpa izin.

Sales lifecycle:
`lead_created → assigned → contacted → qualified → coverage_checked → offer_presented → order_submitted → provider_validation → approved → installation → activated → commission_eligible → settled`.

Technical lifecycle:
`work_order_created → dispatch_pending → assigned → accepted → scheduled → on_site → work_started → evidence_submitted → QC_pending → completed/rework → closed`.

Setiap transisi menyimpan actor, timestamp, source, evidence,
validation, reason, idempotency key, dan audit event.

------------------------------------------------------------------------

# 5. Human Workforce & Assignment Engine

Job families awal: - Sales Manager/Area Manager, SPV, Sales Resmi,
Affiliate Freelance, Sales Representative, Marketing Staff. - FTTH/FWA
Technician, installation, maintenance, troubleshooting, surveyor, field
quality inspector, coordinator. - Job family lain ditambahkan melalui
industry configuration.

Lifecycle:
`invited → registered → identity_pending → verified → onboarding → eligible → active → inactive/suspended → offboarded`.

Assignment Engine memakai hard constraints dan weighted scoring. Hard
constraints seperti sertifikasi wajib, izin, kontrak, tenant, dan
availability tidak boleh dikalahkan skor.

Contoh:
`score = w1*skill_fit + w2*availability + w3*distance_score + w4*performance_score - w5*workload_penalty`

Bobot versioned, explainable, dan audited. Hindari atribut sensitif
sebagai ranking factor.

KPI dapat mencakup productivity, conversion, availability compliance,
SLA, first-time-right, quality, customer feedback, training, safety, dan
attribution. Setiap KPI memiliki definisi, formula/version, source,
owner, period, target, unit, dan effective date.

------------------------------------------------------------------------

# 6. Affiliate Recruitment & Commission Engine

## 6.1 Affiliate Recruitment

Sales Resmi yang memiliki permission dapat: - Membuat referral
code/link. - Mengundang calon affiliate. - Mengirim form registrasi. -
Melihat application status. - Membantu onboarding/training. - Mengajukan
aktivasi. - Mengelola atribusi affiliate. - Memantau produktivitas dan
komisi. - Menangani dispute sesuai kewenangan.

Affiliate lifecycle:
`invited → application_submitted → identity_verification → agreement_pending → training_pending → approved → active → suspended/offboarded`.

Eligibility: identity verified, agreement aktif, training selesai bila
diwajibkan, attribution valid, order diterima provider, dan tidak ada
fraud/duplicate disqualifier. Attribution dikunci setelah status
tertentu; koreksi hanya role berwenang dengan reason dan audit log.

## 6.2 Kesepakatan pembagian produktivitas

Baseline keputusan terdahulu: - Product scope: FTTH, FWA, PXGY. -
Produktivitas personal Sales Resmi tetap 100% menjadi basis Sales
Resmi. - Incremental productivity dari affiliate dibagi 60% untuk
Affiliate dan 40% untuk Sales Resmi. - Tier SA Sales Resmi memakai
gabungan personal + affiliate yang teratribusi. - Order/event yang sama
tidak boleh dihitung dua kali.

Definisi: - `P_personal`: productivity valid dari order personal
Sales. - `P_affiliate`: productivity valid dari affiliate terdaftar yang
teratribusi. - `P_combined = P_personal + P_affiliate`. -
`ΔP = P_combined - P_personal`. - `Affiliate_share = 0.60 × ΔP`. -
`Sales_incremental_share = 0.40 × ΔP`. -
`Sales_attributed_total = P_personal + 0.40 × ΔP`. -
`Affiliate_attributed_total = 0.60 × ΔP`.

Contoh: personal 10 SA, affiliate 5 SA, combined 15 SA, incremental 5
SA. Affiliate memperoleh 3 SA ekuivalen; Sales memperoleh 2 SA
incremental ditambah 10 SA personal, sehingga basis atribusi Sales 12 SA
ekuivalen. Ini ilustrasi unit produktivitas, bukan nominal pembayaran.

## 6.3 Referensi incentive figures terdahulu

Angka berikut adalah baseline historis dari diskusi dan wajib dicocokkan
dengan dokumen insentif resmi XL SMART yang berlaku sebelum menjadi
payable rule.

**AE OJT fee/progressive reference:** Rp80.000, Rp100.000, Rp130.000,
Rp150.000, Rp200.000.\
**Lump sum reference:** 3 SA = Rp325.000; 7 SA = Rp600.000.

**AE Pro / AE Elite tier reference:**

  SA range     Fee reference   Multiplier reference
  ---------- --------------- ----------------------
  1--6              Rp80.000                      0
  7--9             Rp150.000                    1,5
  10--13           Rp175.000                      2
  14--29           Rp200.000                      4
  30--39           Rp225.000                   4,25
  40--49           Rp250.000                    4,5
  ≥50              Rp275.000                   4,65

Jangan mengalikan fee dan multiplier secara asumtif. Dokumen sumber
harus menjelaskan apakah fee per SA, marginal/progressive, lump sum,
tier rate, atau komponen terpisah. OJT/Pro/Elite harus menjadi grade
eksplisit. Product Mix, campaign incentive, quality incentive, bonus,
dan komponen lain dipisahkan agar tidak double count. Affiliate split
hanya berlaku pada komponen yang diizinkan kontrak. Pajak, potongan,
payout, dispute, dan clawback mengikuti kontrak/hukum.

## 6.4 Deterministic Calculation

LLM tidak boleh menghitung payable commission. Commission Engine memakai
Decimal/fixed precision, immutable scheme version, source event,
eligibility, dan audit.

``` python
def calculate_commission(period, sales_id, scheme):
    events = load_provider_productivity_events(period, sales_id)
    events = validate_provider_acceptance(events)
    events = deduplicate(events, key=("provider_id", "order_id", "event_type"))
    events = filter_eligible(events, scheme)

    personal = sum_decimal(e.productivity for e in events
                           if e.attribution_type == "sales_personal")
    affiliate = sum_decimal(e.productivity for e in events
                            if e.attribution_type == "affiliate"
                            and e.affiliate_owner_id == sales_id)

    combined = personal + affiliate
    incremental = combined - personal
    affiliate_share = incremental * Decimal("0.60")
    sales_increment = incremental * Decimal("0.40")
    sales_basis = personal + sales_increment

    tier = resolve_tier(scheme.grade, combined, scheme.tier_rules)
    components = calculate_incentive_components(
        scheme=scheme, tier=tier, personal=personal,
        affiliate=affiliate, sales_basis=sales_basis
    )
    return immutable_calculation_snapshot(
        source_events=events, scheme_version=scheme.version,
        personal=personal, affiliate=affiliate,
        combined=combined, affiliate_share=affiliate_share,
        sales_increment=sales_increment, tier=tier,
        components=components
    )
```

Urutan engine: validate → deduplicate → product eligibility →
attribution → productivity → split → tier → component calculation →
adjustment/clawback → statement → payout/reconciliation.

Commission ledger immutable; koreksi melalui adjustment entry. Payout
batch menggunakan approval, idempotency, dan reconciliation. Statement
menampilkan source event, formula, rule version, gross, adjustment,
deduction, net, dan status.

Fraud controls: duplicate order/customer, self-referral, invalid order
patterns, identity mismatch, unusual spike, manual review, immutable
attribution, no commission before provider acceptance.

------------------------------------------------------------------------

# 7. AI Workforce Catalog & Governance

Role ISP: - Sales Executive/Assistant, Lead Qualification, Follow-up,
Sales Coach, Sales Analyst. - Affiliate Recruitment/Onboarding
Assistant, Training Coach, Affiliate Analyst. - Marketing Strategist,
Content Creator, Social Media Assistant, Ads Analyst, Partnership
Outreach. - Technical Assistant, Troubleshooting Assistant, Work Order
Coordinator, Knowledge Assistant, Quality Assistant. - Workforce
Planner, Operations Coordinator, Commission Analyst, Financial Analyst,
Executive Reporting.

Setiap worker memiliki job contract: mission, JD, scope/exclusions,
input/output schema, task types, KPI/SLA, allowed tools/data, memory
permission, approval, model policy, budget, escalation, supervisor,
version, evaluation.

Autonomy: - L0 Advisory. - L1 Drafting. - L2 Bounded internal
execution. - L3 External action after approval. - L4 Policy-bounded
allowlisted autonomy. Tidak ada unrestricted autonomy. Komunikasi
eksternal, ads activation, perubahan harga/kontrak, pembayaran, data
deletion, dan permission changes memerlukan approval/policy khusus.

------------------------------------------------------------------------

# 8. AI Gateway, LLM, Model Router, Skills, Memory & RAG

## 8.1 AI Gateway

Semua LLM call melewati backend AI Gateway. Tanggung jawab: tenant
context, auth, policy, model routing, prompt registry, context assembly,
metering, timeout/retry, rate limit, safety, tool permission, structured
output validation, trace, dan logging. Frontend tidak memanggil LLM
provider langsung.

## 8.2 Model Router

Input: task type, capability, quality threshold, latency, cost ceiling,
context window, modality, data classification, provider availability,
tenant allowlist, region/residency, budget, tool support.

Hard constraints dievaluasi lebih dahulu: provider/model allowlist, data
classification, tenant policy, region, budget, capability, safety.
Setelah itu scoring:
`route_score = capability_fit*wq + latency_fit*wl + availability*wa - normalized_cost*wc - risk_penalty`.

Fallback hanya ke model yang eligible. Registry menyimpan provider,
model/version, capabilities, context limit, modality, tool support,
pricing effective date, rate limit, region, retention policy, tenant
allowlist, evaluation, deprecation.

## 8.3 Prompt & Tool Registry

Prompt versioned, schema-bound, injection-aware, data-minimized,
redacted, evaluated, dan rollbackable. Tool menyimpan name/version,
description, JSON schema, permission, risk class, approval, timeout,
idempotency, rate limit, audit. Tool dijalankan backend, bukan browser.
Tool output dianggap untrusted sampai divalidasi.

## 8.4 Skills Registry & Resolver

Metadata: skill ID/version, description, input/output contract, files,
dependencies, license/provenance, permissions, tool dependencies, risk,
tenant availability, validation, publisher, compatibility.

Resolver: parse task → tenant/worker permission → license/provenance →
compatibility → dependencies → tool permissions → immutable run snapshot
→ sandboxed execution. User-provided skill code tidak boleh mendapat
arbitrary execution.

## 8.5 Memory Coordinator

Satu coordinator mengatur: 1. Working Memory --- konteks sementara
task/run. 2. Conversation Memory --- percakapan sesuai
consent/retention. 3. Long-term Memory --- fakta stabil yang diizinkan.
4. Episodic Memory --- pengalaman/event terdahulu. 5. Semantic Memory
--- konsep/pengetahuan terstruktur. 6. Procedural Memory ---
SOP/playbook. 7. Organizational Memory --- kebijakan/keputusan tenant.
8. Personal Memory --- informasi personal sesuai consent dan scope.

Metadata: tenant, owner/subject, worker/run/conversation scope, type,
source/provenance, confidence, sensitivity, consent/purpose,
created/expiry, retention, access policy, embedding version, deletion
status.

Lifecycle:
`captured → classified → permission_checked → stored → indexed → retrieved → updated/expired → deleted`.

Memory tidak melintasi tenant. Retrieval wajib permission check dan
provenance. Deletion mencakup source, index, cache, dan derived
references sesuai kebijakan. Personal memory tidak menjadi shared
organizational memory tanpa dasar/consent. Low-confidence memory bukan
fakta pasti. Proteksi memory poisoning dan prompt injection wajib.

## 8.6 RAG / Knowledge Engine

Pipeline: ingest → quarantine/scan → MIME validation → extraction/OCR →
classification → chunking → metadata → embedding → pgvector index →
hybrid retrieval → permission filter → rerank → context → citation →
feedback/evaluation → deletion propagation.

Supabase pgvector dan PostgreSQL full-text search menjadi fondasi. Tidak
membuat vector DB kedua tanpa ADR. Retrieval harus tenant-, permission-,
source-, dan version-aware.

------------------------------------------------------------------------

# 9. Workflow, Orchestration & Durable Execution

Workflow Definition berbeda dari Workflow Run; Task berbeda dari AI Run
dan Human Assignment.

Workflow definition: trigger, input schema, steps, conditions, branches,
parallel groups, approval, AI execution, tool calls, wait/timer, retry,
timeout, compensation, error route, completion criteria, version.

Lifecycle:
`created → validated → queued → running → waiting_approval/waiting_external → retrying → completed/failed/cancelled/timed_out`.

Setiap step mencatat ID, input/output reference, start/end, attempt,
idempotency, state, error, checkpoint, actor, trace ID.

Gunakan durable workflow engine (Temporal atau ekuivalen) bila
diperlukan untuk long-running execution, timer, retry, cancellation,
checkpoint, recovery. Outbox pattern memastikan perubahan bisnis dan
event konsisten; consumer idempotent, retry, DLQ, schema version.

Human-AI handoff harus membawa context summary, source references,
pending actions, risk flags, dan next owner. Retry hanya
transient/idempotent; financial side effect tidak boleh diulang tanpa
idempotency. Compensation adalah business action eksplisit, bukan
rollback ajaib.

Contoh: AI marketing membuat draft → approval corporate → AI lead
qualification → Sales Resmi follow-up/closing → AI order monitor →
teknisi instalasi → AI checklist → supervisor quality approval.

------------------------------------------------------------------------

# 10. Backend FastAPI & API Contract

## 10.1 Backend Design

Modular monolith terlebih dahulu, domain boundaries tegas, API-first,
typed contracts, async I/O, background workers. Microservices hanya
dipisah jika scale, isolation, ownership, atau deployment benar-benar
membutuhkan.

Domain service: Identity; Tenant; Corporate; Partnership; Human
Workforce; Affiliate; Sales/CRM; Provider Integration; Order/Activation;
Technical Operations; Commission Engine; Finance/Billing; AI Credits; AI
Gateway; Model Router; AI Worker Registry; AI Runtime; Skill Registry;
Memory Coordinator; Knowledge/RAG; Workflow Orchestrator; Analytics/KPI;
Reporting; Notification; File/Artifact; Audit/Security.

## 10.2 API Standards

REST JSON; SSE/WebSocket untuk progress; webhook untuk provider;
`/api/v1`; OpenAPI; cursor pagination; filter/sort allowlist;
Idempotency-Key; request/correlation/trace ID; standard error envelope;
UTC storage; Decimal untuk uang; explicit state machine.

Error response:

``` json
{
  "error": {
    "code": "COMMISSION_PERIOD_LOCKED",
    "message": "Periode komisi telah dikunci.",
    "request_id": "opaque-id",
    "details": []
  }
}
```

## 10.3 Endpoint Baseline

**Public:**\
`POST /public/partnership-applications`, `GET /public/service-catalog`,
`GET /public/faqs`, `POST /public/contact`.

**Identity:**\
`GET /me`, `PATCH /me`, `GET /me/permissions`,
`POST /auth/session/revoke`.

**Corporate:**\
`GET /corporate/overview`, `/analytics`, `/kpis`, `/financial-summary`,
`/contracts`, `/invoices`, `/workforce`, `/ai-usage`;
`POST /corporate/reports`.

**Workforce:**\
`POST /workforce/registration`; `GET /workforce/me/passport`,
`/assignments`, `/performance`, `/earnings`;
`PATCH /workforce/me/profile`; assignment accept/complete commands.

**Affiliate:**\
`POST /affiliates/invitations`, `/applications`; `GET /affiliates/{id}`,
`/productivity`, `/commission`; approval command.

**Sales/Orders:**\
`POST/GET /leads`; `POST /orders`; `GET /orders/{id}`; provider
submit/events.

**Technical:**\
`POST/GET /work-orders`; assignment, events, evidence, quality-review
commands.

**Commission/Finance:**\
`GET /commission/schemes`; `POST /commission/schemes`,
`/commission/calculations`, `/commission/adjustments`,
`/payout-batches`; statement, approve, reconcile endpoints.

**AI:**\
`GET/POST /ai-workers`; update/approve/pause; `POST /ai-runs`;
`GET /ai-runs/{id}`; cancel/events.

**Skills/Memory/Knowledge:**\
`GET /skills`; `POST /skills/resolve`, `/memory/search`,
`/memory/records`, `/knowledge/ingest`, `/knowledge/search`; document
deletion.

**Workflow:**\
`GET/POST /workflows`; publish; `POST /workflow-runs`;
get/approve/cancel run.

**AI Credits:**\
`GET /ai-credits/wallet`, `/transactions`, `/usage`;
`POST /ai-credits/topups`; `PATCH /ai-credits/budgets`.

**Admin:**\
Tenant, provider, user, model, integration, audit, security-event, and
system-health endpoints under `/admin`.

Endpoint list adalah baseline; setiap API wajib memiliki
request/response schema, permission, state transition, pagination,
idempotency, error code, dan OpenAPI contract.

------------------------------------------------------------------------

# 11. Frontend, PWA & UX

Technology: Next.js, React, TypeScript strict, Tailwind, design tokens,
PWA manifest/service worker, typed API client, server-state cache,
schema validation, realtime subscription terkontrol.

Applications: - `apps/landing`: public website. - `apps/corporate`:
Corporate/ISP Portal. - `apps/workforce`: Human Workforce PWA. -
`apps/ai-workforce`: AI Workforce Management. - `apps/admin`: Super
Admin. - `apps/api`: FastAPI composition root.

Mobile-first untuk workforce lapangan; responsive desktop untuk
corporate/admin. Wajib ada loading, empty, error, denied, offline,
stale-data state. Chart wajib punya unit, period, source, last updated.
Tidak boleh ada fake KPI.

Offline PWA teknisi: assigned work order cache, encrypted/protected
local queue, evidence draft, sync event ID/idempotency, server-side
conflict resolution, pending/failed sync status, last sync. Jangan
menyimpan credential atau data sensitif berlebihan. Revocation/logout
membersihkan protected cache.

------------------------------------------------------------------------

# 12. Supabase & Database Architecture

Supabase PostgreSQL adalah source of truth; Supabase Auth, Storage,
Realtime, pgvector, PostGIS bila diperlukan, RLS, SQL migrations
versioned. Backup/PITR/retention mengikuti kemampuan plan dan kebijakan
operasional.

## 12.1 Database Domain Inventory

**Core:** `tenants`, `organizations`, `organization_units`, `branches`,
`users`, `memberships`, `departments`, `roles`, `permissions`,
`role_permissions`, `user_roles`, `access_policies`, `service_accounts`.

**Corporate/Contract:** `corporate_profiles`, `provider_profiles`,
`partnership_applications`, `contracts`, `contract_versions`,
`contract_services`, `contract_approvals`, `service_catalog`,
`corporate_invoices`, `corporate_payments`.

**Human:** `workforce_profiles`, `workforce_contracts`,
`workforce_assignments`, `workforce_availability`,
`workforce_locations`, `certifications`, `workforce_certifications`,
`skill_registry`, `workforce_skills`, `workforce_performance`,
`workforce_events`, `training_courses`, `training_enrollments`.

**Affiliate/Sales:** `sales_teams`, `sales_members`,
`affiliate_profiles`, `affiliate_invitations`, `affiliate_agreements`,
`affiliate_attributions`, `referral_codes`, `leads`, `lead_activities`,
`customers`, `sales_orders`, `order_attributions`, `provider_products`,
`coverage_checks`, `productivity_events`.

**Technical:** `technicians`, `work_orders`, `work_order_assignments`,
`work_order_events`, `work_order_evidence`, `work_order_measurements`,
`work_order_checklists`, `quality_inspections`, `sla_policies`.

**Commission/Finance:** `commission_schemes`,
`commission_scheme_versions`, `commission_rules`,
`commission_eligibility_rules`, `commission_calculations`,
`commission_calculation_items`, `commission_adjustments`,
`commission_ledger`, `financial_accounts`, `financial_transactions`,
`journal_entries`, `payout_batches`, `payout_items`,
`provider_settlements`, `settlement_reconciliations`.

**AI:** `ai_worker_templates`, `ai_workers`, `ai_worker_versions`,
`ai_worker_assignments`, `ai_worker_skills`, `ai_worker_tools`,
`ai_worker_models`, `ai_worker_budgets`, `ai_runs`, `ai_run_steps`,
`ai_run_events`, `ai_approvals`, `ai_usage_records`,
`ai_tool_executions`, `ai_evaluations`.

**Skills/Memory/RAG:** `skill_packages`, `skill_versions`,
`skill_dependencies`, `skill_permissions`, `memory_records`,
`memory_permissions`, `memory_retention_policies`, `memory_access_logs`,
`knowledge_documents`, `knowledge_chunks`, `knowledge_access_policies`,
`knowledge_ingestion_jobs`, `knowledge_citations`.

**Workflow:** `tasks`, `task_events`, `task_assignments`, `workflows`,
`workflow_versions`, `workflow_runs`, `workflow_steps`,
`workflow_approvals`, `workflow_checkpoints`, `task_comments`.

**Credits/Billing:** `ai_credit_wallets`, `ai_credit_transactions`,
`ai_credit_topups`, `ai_credit_budgets`, `ai_credit_reservations`,
`ai_credit_pricing_rules`, `ai_credit_usage_statements`,
`billing_subscriptions`, `billing_items`, `payment_attempts`.

**Analytics:** `analytics_events`, `analytics_aggregates`,
`kpi_definitions`, `kpi_targets`, `kpi_measurements`,
`report_definitions`, `report_runs`, `report_schedules`.

**Integration/Governance:** `integrations`, `integration_credentials`,
`integration_events`, `webhook_events`, `outbox_events`,
`notification_events`, `audit_logs`, `security_events`,
`consent_records`, `data_subject_requests`, `retention_jobs`.

Inventory ini adalah checklist domain, bukan instruksi membuat tabel
duplikat. Reconcile dengan schema existing sebelum migration.

## 12.2 Migration Rules

-   Setiap schema change adalah SQL migration versioned di Git.
-   Migration deterministic dan ordered.
-   Breaking change memakai expand-migrate-contract.
-   Destructive migration memerlukan data migration dan recovery plan.
-   Seed hanya reference/configuration data yang sah, bukan aktivitas
    bisnis palsu.
-   Terapkan migration ke Supabase target dengan credential terkontrol
    dan catat migration state.
-   Backfill besar harus resumable.
-   Foreign keys, constraints, indexes, tenant ownership, lifecycle, dan
    idempotency wajib dirancang.
-   Ledger finansial immutable; koreksi melalui adjustment.

------------------------------------------------------------------------

# 13. Analytics & KPI Engine

Pipeline:
`domain transaction → outbox/event → ingestion → validation → aggregation → query model → dashboard/report`.

KPI definition: key, business meaning, formula/version,
numerator/denominator, unit, grain, dimensions, source, target,
effective date, owner, visibility, freshness SLA.

Operational tables tetap source facts. Aggregates dapat dibangun ulang
dan bukan sumber kebenaran finansial. Realtime hanya untuk event stream
yang memang realtime; agregasi near-realtime/batch harus menunjukkan
freshness. Report: executive, sales, affiliate, workforce, SLA,
commission, finance, AI Credits, AI Worker, contract/SLA, audit.

------------------------------------------------------------------------

# 14. AI Credits & Billing Engine

AI Credits adalah internal metering unit, bukan token atau uang tunai.
Usage record: tenant, wallet/cost center, AI Worker, run/step,
provider/model/version, input/output/cached tokens, tool/media usage,
provider cost snapshot, currency, conversion version,
reserved/consumed/refunded, timestamp.

Lifecycle:
`request → budget_check → reserve → execute → record_usage → calculate_charge → settle/release`.

Provider usage yang tetap ditagih saat run gagal harus dicatat.
Reservation tidak terpakai dilepas. Refund melalui ledger adjustment.
Duplicate webhook tidak boleh menagih dua kali.

Budget: tenant, department, worker, per-run, daily/monthly cap, alert
threshold, hard stop, approval override, emergency pause.

------------------------------------------------------------------------

# 15. Security Architecture --- Defense in Depth

Prinsip: Zero Trust, least privilege, deny-by-default, tenant isolation,
secure-by-default, auditability, data minimization, secure SDLC.

**Identity:** Supabase Auth, MFA privileged roles, secure
session/revocation, SSO/OIDC/SAML bila diperlukan, service identity
terpisah.

**Authorization:** RBAC + ABAC; RLS sebagai lapisan database; backend
authorization setiap operasi; object-level access untuk mencegah IDOR;
tenant ID dari authenticated membership, bukan request body.

**Tenant isolation:** RLS untuk SELECT/INSERT/UPDATE/DELETE; storage
object; realtime subscription; RPC/function privileges; nested
relationships. Tidak ada cross-tenant query tanpa authorized platform
scope.

**Secrets:** managed secret store, no secret in Git/browser/logs,
credential encryption, rotation, KMS/envelope encryption bila tersedia,
short-lived signed URLs.

**Application/API:** TLS, CORS allowlist, CSRF bila cookie auth, rate
limit, request size limit, schema validation, SSRF protection,
parameterized SQL, XSS output encoding, CSP, secure headers, upload
quarantine/malware scan, webhook signature/replay protection,
idempotency, dependency/container scanning.

**AI security:** prompt injection defense, tool allowlist, tool-level
authorization, data exfiltration controls, untrusted document isolation,
output validation, redaction, approval for high-impact action, sandbox,
egress allowlist, run limits, tenant memory isolation, memory poisoning
controls, audit.

**Privacy/compliance:** consent, purpose limitation, data
classification, retention, access/correction/deletion/export requests,
legal hold, breach response, vendor/subprocessor inventory, cross-border
transfer assessment, UU PDP Indonesia and other applicable regulations.
Legal review diperlukan untuk outsourcing/employment, tax, telecom,
consumer, K3, dan kontrak affiliate.

**Audit:** actor, tenant, action, resource, before/after diff where
appropriate, timestamp, request ID, approval, reason, result.
Append-only from application perspective.

**Security operations:** OpenTelemetry, Sentry/equivalent, security
event alerts, incident runbook, credential compromise, tenant isolation
incident, backup restore, AI abuse response, access review.

------------------------------------------------------------------------

# 16. Integrations

Integration record: connector, provider, tenant binding, auth method,
credential reference, scope, rate limit, webhook, sync strategy, mapping
version, health, last sync, error queue, audit.

Categories: ISP systems, CRM, authorized WhatsApp Business/messaging,
email, maps/geocoding, payment gateway, e-signature, accounting/ERP,
social/ads platforms, LLM providers, file/document sources. Integrations
hanya melalui authorized scopes dan sesuai terms, consent, dan hukum.

------------------------------------------------------------------------

# 17. Monorepo & Independent Service Structure

Satu monorepo dengan domain/service boundaries mandiri. Modular monolith
terlebih dahulu; folder terpisah bukan berarti harus langsung
microservices.

``` text
agentzy/
├── AGENTS.md
├── README.md
├── PRD/
│   ├── MASTER-PRD.md
│   ├── ARCHITECTURE.md
│   ├── API-CONTRACTS.md
│   ├── DATA-DICTIONARY.md
│   ├── SECURITY-BASELINE.md
│   ├── COMMISSION-RULEBOOK.md
│   └── IMPLEMENTATION-ROADMAP.md
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
├── docs/
└── .github/workflows/
```

Contoh internal service:

``` text
services/commission_engine/
├── domain/
│   ├── entities/
│   ├── value_objects/
│   ├── policies/
│   ├── calculations/
│   └── events/
├── application/
│   ├── commands/
│   ├── queries/
│   ├── handlers/
│   └── ports/
├── infrastructure/
│   ├── persistence/
│   ├── providers/
│   └── messaging/
├── api/
│   ├── routes.py
│   ├── schemas.py
│   └── dependencies.py
├── tests/
├── pyproject.toml