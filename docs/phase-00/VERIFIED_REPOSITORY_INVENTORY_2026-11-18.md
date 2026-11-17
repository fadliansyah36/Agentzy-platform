# Phase 00 — Verified Repository Inventory (18 November 2026)

Status: PARTIAL — structural, route, manifest, environment-name and design-token inventory captured; license/SBOM, full env reference scan and asset metadata inventory remain open.

## Connector binding runbook

Use the GitHub connector account named **More Ai**, profile `fadliansyah36`, link ID `link_6af361418a4481919cc84f9f7e0d522b`. The repository is `fadliansyah36/Agentzy-platform`, branch `main`. Do not use the similarly named personal link `link_6aba8fa0b8548191a9edb9cc303ea4d9` for this repository.

Use the Supabase connector account named **Agentzy DB**, link ID `link_6afc797a7c44819192023bb809b8cae1`, project ref `cwhjdnkotuhueeudpgeu`. Important connector argument distinction:
- `get_project` expects `id: "cwhjdnkotuhueeudpgeu"` (not `project_id`).
- Database actions such as `execute_sql`, `list_tables`, `list_migrations`, and `get_advisors` expect `project_id: "cwhjdnkotuhueeudpgeu"`.
- Every Supabase call also receives the Agentzy DB `link_id`.
- Do not substitute another Supabase project or another account binding.

Verified read-only project metadata on 18 Nov 2026: project `Agentzy-db`, status `ACTIVE_HEALTHY`, region `ap-northeast-1`, PostgreSQL `17.12.0.000`, organization `Agentzy` (`hfxqdyoretyybhgrgmsa`).

## Recursive repository inventory

GitHub recursive tree API on `main`: 284 entries, `truncated=false`. This is the full returned tree at the time of capture.

Existing application structure:
- `app/` — Next.js App Router, including root landing route, portal wrappers and Next.js API route handlers.
- `apps/admin/` — existing Admin UI feature modules.
- `apps/corporate/` — existing Corporate UI feature modules.
- `apps/ai-workforce/` — existing AI Workforce UI feature modules.
- `components/`, `hooks/`, `lib/`, `public/`, `src/` — existing shared UI/application resources.

Do not create duplicate `apps/landing` or `apps/workforce` portals merely because those folders are absent: route surfaces already exist under root `app/`. First map their implementation ownership, then add backend infrastructure alongside current code.

Infrastructure folders absent from the recursive tree:
- `apps/api/` (Python/FastAPI)
- `supabase/` (Agentzy migration source)
- `packages/api-client/`
- `packages/api-contracts/`
- `packages/design-tokens/`
- `workers/`, `services/`, `infrastructure/`

## Current Next.js routes discovered

| Route file | Surface |
|---|---|
| `app/page.tsx` | Landing / root |
| `app/admin/page.tsx` | Admin entry |
| `app/admin/[section]/page.tsx` | Admin section wrapper |
| `app/corporate/page.tsx` | Corporate entry |
| `app/corporate/[section]/page.tsx` | Corporate section wrapper |
| `app/ai-workforce/page.tsx` | AI Workforce entry |
| `app/ai-workforce/[section]/page.tsx` | AI Workforce section wrapper |
| `app/workforce/page.tsx` | Workforce entry |
| `app/api/ai-workforce/generate-content/route.ts` | Next.js AI generation handler; direct provider call must move behind FastAPI AI Gateway |
| `app/api/config/maps/route.ts` | Maps config handler; review for server-key disclosure |
| `app/api/maps/reverse-geocode/route.ts` | Reverse geocoding handler; provider call should be owned by backend |

Route inventory is based on route-file paths; it does not claim every nested navigation item or dynamic state has been reviewed.

## Package manifest inventory

Root manifest: `package.json`; package manager lockfile: `bun.lock` (274,134 bytes; Git blob SHA `635cf4455bc8f37bafd73f4c6e82f77dd492da07`). No root npm, pnpm or yarn lockfile was returned by the recursive tree.

Manifest:
- package: `ai-studio-applet`, version `0.1.0`, private.
- runtime dependencies: `@google/genai ^2.4.0`, `@hookform/resolvers ^5.2.1`, `@vis.gl/react-google-maps ^1.10.2`, `autoprefixer ^10.4.21`, `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `firebase ^13.4.0`, `lucide-react ^0.553.0`, `motion ^12.23.24`, `next ^15.4.9`, `postcss ^8.5.6`, `react ^19.2.1`, `react-dom ^19.2.1`, `tailwind-merge ^3.3.1`.
- dev dependencies: `@tailwindcss/postcss 4.1.11`, `@tailwindcss/typography ^0.5.19`, `@types/node ^20`, `@types/react ^19`, `@types/react-dom ^19`, `eslint 9.39.1`, `eslint-config-next 16.0.8`, `firebase-tools ^15.0.0`, `tailwindcss 4.1.11`, `tw-animate-css ^1.4.0`, `typescript 5.9.3`.
- Observed compatibility review item: Next.js 15 with eslint-config-next 16. Do not change versions without validating compatibility and updating the canonical Bun lockfile.
- License/SBOM status: OPEN. The manifest and lockfile do not provide sufficient evidence to claim a full license inventory. Need a generated resolved dependency SBOM with package name, exact version, source, license expression, license file/notice, direct/transitive classification, and unresolved-license disposition. Do not guess license metadata.

## Environment variable names

The checked-in `.env.example` contains names only:
- `GEMINI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

No secret values are recorded here. Full source-wide environment reference scan and hosting/provider secret-name reconciliation remain OPEN. The server-side Google Maps key must never be returned by a browser-facing config route; the public key, if required, must be a separate referrer/API restricted key.

## Existing CSS design-token source

Source: `app/globals.css` at the inspected `main` tree.
- Brand: `--az-brand-sky-light #ADD8E6`, `--az-brand-sky #87CEEB`, `--az-brand-azure #0284C7`, `--az-brand-azure-hover #0369A1`, `--az-brand-navy #17324D`, `--az-brand-deep-blue #245477`, `--az-brand-blue-muted #5F879E`.
- Surfaces: canvas `#F5F8FA`, default `#FFFFFF`, subtle `#EAF2F6`, sky `#E6F4F9`.
- Borders: `#D8E3E9`, `#B8C9D3`.
- Text: `#172B3A`, `#526675`, `#718391`, inverse `#FFFFFF`.
- Status: success `#247A55`, warning `#A96816`, danger `#B23A48`, info `#2D6F91`.
- Data: teal `#3B8C91`, amber `#C18A3A`, violet `#786A9C`, slate `#718391`.
- Radius: 6/10/14/20px; shadows `--az-shadow-sm` and `--az-shadow-md`.
- Typography: Plus Jakarta Sans; JetBrains Mono for technical/tabular values.
- Google sign-in button baseline: white background, 1px #B8C9D3 border, 10px radius, 14px text, 44px height, full width, 600 font weight; hover uses canvas surface and muted blue border.

## Remaining Phase 00 inventory work

1. Produce a complete resolved dependency SBOM/license report from `bun.lock`, including notices and unresolved licenses.
2. Scan source files for every `process.env` / environment access and reconcile names with deployment/provider configuration without exposing values.
3. Inventory public assets with path, file type, dimensions/size, hash and usage reference; do not infer usage from filename alone.
4. Expand route inventory to screen/navigation/component and API ownership mapping.
5. Obtain authoritative Supabase Dashboard or supported Management API evidence for Auth providers, URL/redirect allowlists, password/MFA/SMTP/security settings and Data API exposed schemas.
6. Complete function/event-trigger dependency review and approve `rls_auto_enable()` ACL disposition. Current Advisor has two WARNs (anon and authenticated); no production grant/function change is approved or applied.
7. Reconcile Blueprint M000–M220 batch by batch against live project migration history (currently empty) and current application schema (no Agentzy public relations observed). M000 is an inspection/policy record, not a fabricated schema migration.
8. Close P00-AC-01 through P00-AC-10 with inspectable evidence before Phase 01 begins.

No database DDL, Auth setting, Data API setting, privilege, function or migration was changed during this inventory capture. No staging or real-world/UAT tests were run.
