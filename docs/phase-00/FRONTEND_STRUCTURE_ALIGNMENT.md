# Frontend Structure Alignment — PRD/Blueprint Errata

Date: 18 November 2026  
Repository: `fadliansyah36/Agentzy-platform`  
Branch: `main`  
Status: Authoritative Phase 00 documentation correction

## Purpose and scope

This document corrects **frontend folder names and frontend ownership references only** in the Master PRD v2.0 and Technical Implementation Blueprint v1.0 so that implementation follows the repository's verified existing layout. It does not authorize moving, renaming, duplicating, or redesigning existing frontend code.

All prescribed backend and platform infrastructure paths remain unchanged, including `apps/api/`, `supabase/`, `packages/api-client/`, `packages/api-contracts/`, `packages/design-tokens/`, `workers/`, `services/`, and `infrastructure/`.

If a frontend folder example in the PRD/Blueprint conflicts with this errata, use the verified existing frontend mapping below. Product scope, portal capabilities, API architecture, backend layout, database model, phase sequence, and security rules remain governed by the original PRD, Blueprint, and AGENTS.md.

## Verified frontend layout on main

```text
app/                         # Existing Next.js App Router
├── page.tsx                 # Public landing route
├── admin/                   # Super Admin route surface/wrappers
├── corporate/               # Corporate/ISP route surface/wrappers
├── ai-workforce/             # AI Workforce route surface/wrappers
├── workforce/                # Human Workforce route surface
└── api/                      # Existing app-local API route handlers

apps/
├── admin/                   # Existing Super Admin UI feature modules
├── corporate/               # Existing Corporate/ISP UI feature modules
└── ai-workforce/             # Existing AI Workforce UI feature modules

components/                   # Shared frontend components
hooks/                        # Shared React hooks
lib/                          # Shared frontend libraries/utilities
src/                          # Existing source modules/assets
public/                       # Static assets and PWA resources
```

This is a mapping of the current repository, not a target folder migration. The Human Workforce and public landing route surfaces currently live under root `app/`; do not create duplicate `apps/workforce/` or `apps/landing/` directories merely to match the earlier conceptual examples.

## Backend/platform structure remains as prescribed

```text
apps/api/                     # Python/FastAPI modular monolith and composition root
supabase/                     # Supabase configuration and ordered migrations
packages/api-client/          # Typed frontend API client
packages/api-contracts/       # Shared API contracts
packages/design-tokens/       # Shared design-token package, when extracted from existing CSS
workers/
services/
infrastructure/
```

The backend/API and platform directories above are target infrastructure paths and remain unchanged. Their absence from the current tree is an implementation gap, not a reason to alter frontend paths.

## Frontend-to-backend integration boundary

- Existing Next.js routes and UI feature modules remain in their current locations.
- Existing frontend screens must be preserved; only missing UI components may be added when required by PRD scope and existing design tokens/styles.
- Frontend business actions must use typed API adapters and the FastAPI `/api/v1` contracts once implemented.
- Existing Next.js `app/api/` handlers are transitional app-local handlers only; they must not become business authority or bypass FastAPI.
- Supabase PostgreSQL remains the sole primary business data source; sensitive business operations remain server-authorized through FastAPI.
- No duplicate frontend portals, duplicate business database, mock production data, or silent demo fallback.

## Source evidence

- Repository: `fadliansyah36/Agentzy-platform`, branch `main`.
- Verified repository inventory: `docs/phase-00/VERIFIED_REPOSITORY_INVENTORY_2026-11-18.md`.
- Recursive Git tree inventory recorded 286 entries, `truncated=false`, at the time of the inventory.
- Existing route files include `app/page.tsx`, `app/admin/*`, `app/corporate/*`, `app/ai-workforce/*`, `app/workforce/*`, and `app/api/*`.
- Existing feature folders include `apps/admin/`, `apps/corporate/`, and `apps/ai-workforce/`.

## Explicit non-changes

No source code was moved or renamed. No backend folder convention was changed. No Supabase schema, migration, grant, policy, Auth setting, or Data API setting was changed. No staging, deployment, or real-world test was run.
