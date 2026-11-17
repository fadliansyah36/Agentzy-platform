# Agentzy AI Workforce Management Portal (`apps/ai-workforce`)

Modul portal mandiri untuk mengelola **AI Worker**, **Model Router**, **Skills & Tools Registry**, **Memory Coordinator**, **Knowledge/RAG**, **Workflow Orchestration & Durable Runs**, **Approval & Human Handoff**, **Generate Content Studio (Chat & Artifact untuk Support Staff Sales)**, **AI Credits & Budget**, serta **Safety, Autonomy Policy & Audit Log** sesuai Agentzy Master PRD v2.0.

## Struktur Direktori Mandiri

- `lib/` — Tipe domain (`ai-workforce-types.ts`) dan data baseline (`ai-workforce-data.ts`)
- `services/` — Utilitas dan layanan klien (`ai-workforce-service.ts`)
- `hooks/` — State management portal (`useAIWorkforcePortal.ts`)
- `components/` — App shell mobile-first + desktop sidebar (`shell/`) dan modal operasional (`modals/`)
- `features/` — Seluruh modul halaman UI portal:
  - `auth/` — Splash Onboarding, Login & Pilih Tenant
  - `overview/` — Overview Dashboard & Peringatan
  - `workers/` — AI Worker Registry, Detail (Info, JD & Misi, KPI/SLA, Versi), dan AI Worker Studio (5-step wizard)
  - `capabilities/` — Model Router & Provider, Skills & Tools Registry, Memory Coordinator & Knowledge/RAG
  - `content-studio/` — Chat & Artifact Generate Content (Video, Design, Gambar, Dokumen) untuk Fasilitas Support Staff Sales
  - `collaboration/` — Task & Goal Management serta Kolaborasi Human + AI
  - `workflows/` — Workflow Center, Advanced Workflow Builder, Node Library, Workflow/AI Runs, Recovery & Compensation
  - `approvals/` — Approval Center (Human-in-the-Loop) & Human Assignment / Handoff Center
  - `analytics/` — AI Credits & Budget Allocation, Performance Analytics, Workflow Business Impact Funnel
  - `governance/` — Safety & Autonomy Policy (L0–L4), SLA & Compliance, Audit Log & Insiden, Pengaturan
