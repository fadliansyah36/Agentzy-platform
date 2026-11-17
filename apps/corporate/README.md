# Agentzy Corporate / ISP Partner Portal (`apps/corporate`)

Modul UI mandiri untuk portal **Corporate / ISP Partner** sesuai **Agentzy Master PRD v2.0** (Section 2.1 & Section 17) dan **Technical Implementation Blueprint v1.0** (Section 12.1).

## Struktur Folder Mandiri

```text
apps/corporate/
├── components/
│   ├── CorporatePortalClient.tsx       # Root client orchestrator
│   ├── data-display/                   # KPI cards, charts, segmented tabs, freshness meta
│   ├── modals/                         # Seluruh Modal Card UI (Top Up, Filter, AI Worker, Audit, Map, QC, RBAC, Report)
│   └── shell/                          # AppShell (Desktop 252px Navy Sidebar + Mobile-First Thumb Nav + Drawer)
├── features/
│   ├── ai-credits/                     # AI Credits Center (Wallet, Top Up, Riwayat, Forecast)
│   ├── analytics/                      # Business Analytics & Sales/Affiliate Analytics
│   ├── auth/                           # Corporate Login / SSO & Pilih Tenant
│   ├── commission/                     # Commission Monitoring (60/40 Split, Perhitungan, Rekon)
│   ├── contracts/                      # Contract & Partnership Center (MSA, SOW, SLA, Entitlements)
│   ├── finance/                        # Invoice Center & Payment Reconciliation
│   ├── kpi/                            # KPI & Performance + Ranking & Leaderboard
│   ├── notifications/                  # Notifications & Alerts (SLA, Budget 80%, Contract Expiry)
│   ├── organization/                   # Organization Tree, Departments & User RBAC
│   ├── overview/                       # Executive Overview
│   ├── reports/                        # Reports & Export (CSV/XLSX/PDF)
│   ├── settings/                       # Settings, Integrations, Security, API & Audit Compliance
│   ├── technical/                      # Technical Operations (Work Order, SLA, Map, Evidence QC)
│   └── workforce/                      # Human Workforce & AI Workforce Monitoring
├── hooks/                              # useCorporatePortal state & workflow hook
├── lib/                                # Typed domain models, constants, & formatters
└── services/                           # Typed API adapter boundary (/api/v1/corporate/*)
```

## Rute Next.js Terhubung

- `/corporate` — Executive Overview (atau layar Login/SSO saat keluar sesi)
- `/corporate/[section]` — Deep-link langsung ke setiap modul (`login`, `overview`, `analytics`, `sales-affiliate`, `human-workforce`, `ai-workforce`, `technical-ops`, `kpi-performance`, `commission`, `ai-credits`, `contracts`, `invoices`, `payments`, `reports`, `organization`, `notifications`, `leaderboard`, `settings`).
