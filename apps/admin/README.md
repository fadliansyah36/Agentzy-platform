# Agentzy Super Admin Control Plane (`apps/admin`)

Portal tata kelola platform tingkat lanjut untuk mengelola seluruh ekosistem **Agentzy — Unified Human & AI Workforce Platform**.

## Struktur Folder Mandiri

```text
apps/admin/
├── components/
│   ├── AdminPortalClient.tsx
│   ├── data-display/AdminDataDisplay.tsx
│   ├── modals/AdminModals.tsx
│   └── shell/AdminAppShell.tsx
├── features/
│   ├── auth/
│   ├── overview/
│   ├── tenants/
│   ├── master-data/
│   ├── organization/
│   ├── workforce/
│   ├── ai-platform/
│   ├── finance/
│   └── governance/
├── hooks/
│   └── useAdminPortal.ts
├── lib/
│   ├── admin-data.ts
│   └── admin-types.ts
└── services/
    └── admin-service.ts
```

## Modul & Halaman UI (Sesuai Master PRD v2.0 & UI/UX Control Plane)

1. Global Overview (Dashboard) & Lifecycle Governance
2. Tenant Directory & Detail Tenant (CRUD)
3. Corporate Onboarding (3-Step Wizard) & Provider Management (CRUD)
4. Master Data Industri, Layanan & Produk (CRUD)
5. Subscription Plans, Entitlements & Limits (CRUD)
6. Organisasi, Cabang, Departemen & User (CRUD)
7. RBAC, Role & Access Matrix (CRUD & Interactive Matrix)
8. Human Workforce (Staff, Verifikasi KYC, Assignment Rules)
9. AI Worker Registry & Lifecycle + Detail & Konfigurasi AI Worker
10. LLM Provider Registry (CRUD & Health Check)
11. Model Registry (Activate / Disable & CRUD)
12. Model Router (Policy, Routing Rules CRUD & Simulator)
13. Skill Registry (License, Provenance & Approval)
14. Tool Registry (Permission, Risk & Sandbox CRUD)
15. Memory Governance (Retention, Consent, DSR)
16. Knowledge / RAG (Indexing & Sumber Data CRUD)
17. Workflow Orchestration, Durable Runs & Human-AI Approval
18. AI Credits (Pricing Rules CRUD & Wallet Ledger)
19. Billing & Subscription (Paket & Invoice CRUD)
20. Finance & Rekonsiliasi
21. Contract, SOW & SLA Management (CRUD)
22. Commission Scheme (Governance, Versioning & Simulasi 60/40)
23. Integrations & Webhook Health (CRUD & Logs)
24. Security Center (MFA, Active Sessions, Break-Glass Access & Feature Flags)
25. Audit Log & Incident Management
26. Data Governance (Klasifikasi, Retensi, DSR & Vendor Register)
27. Global Analytics, KPI, Ranking Tenant & System Health
