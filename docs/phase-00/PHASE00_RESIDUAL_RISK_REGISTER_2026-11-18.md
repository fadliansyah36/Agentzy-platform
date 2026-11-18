# Phase 00 — Residual Risk Register

**Date:** 18 November 2026  
**Overall:** **PARTIAL / BLOCKED — Phase 01 prohibited**  
**Repository:** `fadliansyah36/Agentzy-platform` / `main`  
**Supabase:** `Agentzy-db` / `cwhjdnkotuhueeudpgeu`

| ID | Risk / gate | Status | Evidence | Required action | Owner | Approval |
|---|---|---|---|---|---|---|
| RR-001 | RLS event-trigger catches and swallows exceptions (AC-06) | BLOCKED | Live function definition and trigger catalog; Security Advisor 0028/0029 WARN | Create additive migration via Supabase CLI, fail closed, revoke public API EXECUTE; apply only with verified backup/PITR and post-change checks | Supabase Admin + Security Lead | PENDING |
| RR-002 | Function direct EXECUTE by anon/authenticated | BLOCKED | Function ACL includes PUBLIC/anon/authenticated/service_role; Advisor observation 2026-11-18 02:34:49Z | Apply reviewed ACL revocation and verify event trigger still fires, RPC denied, Advisor findings cleared | Supabase Admin | PENDING |
| RR-003 | Broad grants on existing public tables | BLOCKED | Live role_table_grants shows broad table privileges for anon/authenticated/service_role | Inventory every client and API data path, decide explicit per-table/column grants, prepare additive migration; no blanket revoke | Database/Security Lead | PENDING |
| RR-004 | Broad default privileges | BLOCKED | pg_default_acl rows for postgres/supabase_admin grant broad privileges | Revoke only project-owned defaults after service-role and application usage review; document managed-role boundary | Supabase Admin | PENDING |
| RR-005 | Hosted Auth config unverified | BLOCKED | Connector lacks authoritative provider/SMTP/password/MFA/session/redirect configuration endpoint | Project owner supplies Dashboard screenshots/export or grants authorized Dashboard read access | Supabase Project Owner | PENDING |
| RR-006 | Hosted Data API exposed schemas unverified | BLOCKED | No authoritative pgrst.db_schemas setting returned; config.toml is local declaration only | Verify Dashboard API settings and PostgREST exposed schemas | Supabase Project Owner | PENDING |
| RR-007 | Storage bucket inventory has zero buckets/objects/policies | DONE (current catalog only) | storage.buckets=0, objects=0, storage policies=0 | Owner confirms whether Storage is intentionally unused or whether required buckets are not provisioned | Product Owner | PENDING |
| RR-008 | 26 LGPL/MPL dependencies | BLOCKED | Exact coordinates in dependency-license-review.json; 14 sharp/libvips LGPL and 12 MPL packages | Determine shipped artifacts/platforms and source/linking/notice obligations; legal decision | Legal/IP + Build Owner | PENDING |
| RR-009 | 5 manual license expressions | BLOCKED | argparse, caniuse-lite, deep-freeze, url-template, valid-url | Review exact publisher license text and record signed disposition | Legal/IP Owner | PENDING |
| RR-010 | 40 missing package LICENSE files | BLOCKED | Exact coordinates and registry tarball evidence in JSON report | Retrieve exact upstream license/copyright evidence; do not fabricate | Dependency Maintainer | PENDING |
| RR-011 | 31 asset provenance incomplete | BLOCKED | Metadata/hash inventory; source/owner/license/commercial rights/attribution missing | Complete creator/rightsholder/source/license/permission/attribution/usage evidence for every asset | Brand/Asset Owner + Legal/IP | PENDING |
| RR-012 | Screen callback/action inventory incomplete | PARTIAL | Route/module inventory and view file lists; 11 page/layout, 3 API handlers | Trace every button/form/callback/hook/service and record API, permission and entity | Frontend Lead | PENDING |
| RR-013 | API/domain ownership incomplete | PARTIAL | Current FastAPI routes and three Next handlers mapped at domain level | Approve canonical owner and API contract for every action; resolve Next.js AI provider route | Backend Lead + Domain Owners | PENDING |
| RR-014 | Bun lockfile does not match package.json | BLOCKED | CI run 44224158408: frozen install failed because @supabase/supabase-js added but not locked | Generate lock with Bun after confirming exact dependency resolution; rerun frozen install | Frontend/Dependency Owner | PENDING |
| RR-015 | FastAPI Ruff checks fail | BLOCKED | CI run 44224158408: 101 findings, 7 auto-fixable | Review lint findings and format/import cleanup without behavior change; rerun Ruff | Backend Lead | PENDING |
| RR-016 | Frontend ESLint/TypeScript/OpenAPI checks not executed | BLOCKED | CI steps skipped after install/Ruff failures | Fix lockfile/Ruff; rerun all checks and capture results | Frontend + Backend Leads | PENDING |
| RR-017 | GitHub main branch not protected | PARTIAL | GitHub branch API reports protected=false | Project owner decides branch-protection/required-check policy; no policy changed in this pass | Repository Owner | PENDING |
| RR-018 | No independent Phase 00 approval | PENDING APPROVAL | No signed Product Owner/Security/Engineering approval record | Review evidence pack and record approval or rejection; do not start Phase 01 without separate explicit instruction | Product Owner | PENDING |

## Change boundary

No production database DDL, grants, policies, functions, event triggers, Auth configuration, Storage configuration, frontend UI, application feature, dependency version, deployment or business data was changed in this continuation. The only implementation change is the addition of a static engineering-check workflow; all other changes are documentation.

## Final gate disposition

- P00-AC-05: BLOCKED.
- P00-AC-06: BLOCKED.
- P00-AC-03: BLOCKED.
- P00-AC-02 / AC-04: PARTIAL.
- P00-AC-09: PENDING APPROVAL.
- P00-AC-10: NOT APPROVED.

**Phase 00 is not CLOSED. Phase 01 must not start.**
