# Agentzy — Unified Human & AI Workforce Platform

Repository implementation baseline for the Agentzy platform.

## Governance sources
- `AGENTS.md` — mandatory repository implementation rules
- `docs/AGENTZY_MASTER_PRD_v2.0.md` — product and engineering baseline
- `docs/AGENTZY_TECHNICAL_IMPLEMENTATION_BLUEPRINT_v1.0.md` — architecture, data model, API, security and design system
- `docs/AGENTZY_IMPLEMENTATION_BACKLOG_PER_PHASE.md` — phase 00–23 task registry and current blocker status
- `docs/AGENTZY_REPOSITORY_SUPABASE_AUDIT_2026-11-17.md` — repository and live Supabase audit snapshot

## Canonical resources
- GitHub repository: `fadliansyah36/Agentzy-platform`, branch `main`
- Supabase project: `Agentzy-db`, ref `cwhjdnkotuhueeudpgeu`

## Engineering invariants
- Preserve existing portal UI/UX; implement backend-first and wire screens to real APIs.
- Python FastAPI is the business authority; Supabase PostgreSQL is the sole primary business database.
- No duplicate database, fake/mock production data, silent demo fallback, or direct frontend business writes.
- Apply ordered, additive migrations only after the canonical live schema and security baseline have been reviewed.
- Follow PRD phases 00–23 and record evidence; full UAT, staging, load/security acceptance and release gate belong to Phase 22.

Phase 00 governance and baseline work is in progress. Connector access is available; this is not a claim that the database or application is migration-ready.
