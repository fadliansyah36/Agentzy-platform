# Phase 00 Continuation Evidence — 18 November 2026

Repository: `fadliansyah36/Agentzy-platform`  
Branch: `main`  
Latest inspected repository commit before this evidence update: `8fe6141610fab3a01026a4966f5090dab4dbc016`  
Supabase: `Agentzy-db`, ref `cwhjdnkotuhueeudpgeu`  
Status: **Phase 00 remains IN PROGRESS; no sign-off.**

## 1. Resolved dependency inventory / SBOM

Source evidence:
- Root `package.json`, package `ai-studio-applet@0.1.0`.
- Canonical lockfile `bun.lock`, Git blob SHA `635cf4455bc8f37bafd73f4c6e82f77dd492da07`, 274,134 bytes.
- Bun lock format `lockfileVersion=2`, `configVersion=1`.
- Lockfile contains 1,130 package locator entries; deduplication by exact package name + version produces **1,037 unique resolved npm package coordinates**.
- CycloneDX 1.6 SBOM: `docs/phase-00/sbom/bun-lock.cdx.json`.

**Important qualification:** this is a resolved dependency inventory, not a completed license compliance reconciliation. The Bun lockfile contains package identities, exact versions, dependency metadata and integrity values, but no license declarations. SBOM components therefore use `NOASSERTION` and explicitly mark license status unresolved. Before acceptance, each package's authoritative package metadata, LICENSE file, NOTICE/attribution and transitive obligations must be reconciled; exceptions must be recorded. Do not infer licenses from package names or websites alone.

Manifest compatibility issue remains: `next ^15.4.9` and `eslint-config-next 16.0.8` are different major lines; compatibility review is open. No dependency versions were changed.

## 2. Environment-variable inventory and exposure review

Verified `.env.example` declares exactly:
- `GEMINI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Direct source references confirmed in reviewed files:
- `app/api/ai-workforce/generate-content/route.ts`: server-side `GEMINI_API_KEY`; the handler directly initializes Google GenAI and calls a hard-coded model from Next.js. This remains an architectural migration item for the FastAPI AI Gateway.
- `app/api/maps/reverse-geocode/route.ts`: server-side `GOOGLE_MAPS_API_KEY`, with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` fallback.
- `app/api/config/maps/route.ts`: browser-facing key configuration route. It previously fell back from the public key to the server-only `GOOGLE_MAPS_API_KEY`, which could disclose a secret to browser callers.

**Code remediation committed:** `app/api/config/maps/route.ts` now returns only `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and never falls back to `GOOGLE_MAPS_API_KEY`. Commit: `00592945136770307b17d4e87b5db1ad112748c3`. No secret values are included in this report.

Additional configuration observations:
- `next.config.ts` references `DISABLE_HMR` for development-only HMR behavior; it is not listed in `.env.example`.
- `firebase-applet-config.json` contains Firebase client configuration, including a browser-visible API key and OAuth client identifier. These are client configuration values, not server secrets, but Firebase API key restrictions, authorized domains, and enabled APIs must be verified in Firebase Console.
- GitHub code-search requests for broad environment terms returned no results and are not reliable evidence of absence. The direct file review above is targeted, not a complete source-wide scan.

**Open:** complete a source-wide scan of every tracked source/config file and reconcile all discovered names with deployment environment configuration. Hosting/provider secret settings were not accessible from the GitHub connector. Never record values in the repository evidence.

## 3. Asset metadata and usage inventory

Detailed file list: `docs/phase-00/ASSET_METADATA_INVENTORY_2026-11-18.md`.

Verified from recursive Git tree:
- 31 raster image files by extension.
- Total size: 29,037,921 bytes (27.69 MiB).
- Six exact duplicate blob groups: six image pairs under `public/images/` and `src/assets/images/`; each pair has identical Git blob SHA and byte size.
- Every asset row records repository path, byte size and Git blob SHA.
- Targeted source references were confirmed for landing illustrations, Agentzy logo, workforce banners/field imagery, favicon and PWA icons.
- 13 files are in `public/assets/aistudio/`; their provenance and production suitability need review.

**Open:** pixel dimensions and decoded image metadata have not been measured because the current GitHub connector tree response provides only blob metadata and the available fetch operation does not provide binary image bytes. Complete usage mapping for every asset, image rights/provenance and duplicate disposition also remain open. Do not delete duplicate copies until import/build references are fully traced.

## 4. Supabase Auth and Data API configuration evidence

Fresh project metadata confirms:
- Project `Agentzy-db`, ref `cwhjdnkotuhueeudpgeu`.
- Status `ACTIVE_HEALTHY`.
- PostgreSQL 17.12.0.000; region `ap-northeast-1`.

The available Supabase connector exposes project metadata, database SQL/catalog inspection, migrations, tables, extensions and advisors. It does **not** expose authoritative Auth provider/security configuration or Data API exposed-schema configuration in the current tool surface.

Therefore the following are **not verified** and must not be assumed:
- Auth providers and provider enablement.
- Site URL and redirect allowlists.
- Password policy, MFA enforcement, session lifetime/revocation, rate limits and CAPTCHA/bot settings.
- SMTP/email sender configuration.
- Data API exposed schemas and API role exposure settings.

Required evidence source: authorized Supabase Dashboard configuration views or a supported Management API response for the exact project. Dashboard sections to capture include Authentication provider/URL/security settings and Integrations → Data API exposed schemas. Do not place secret values or SMTP credentials in evidence.

## 5. Security disposition — `public.rls_auto_enable()`

Fresh read-only evidence:
- Security Advisor reports two WARN findings: `anon_security_definer_function_executable` and `authenticated_security_definer_function_executable`.
- Function: `public.rls_auto_enable()`; `SECURITY DEFINER`; owner `postgres`; fixed `search_path = pg_catalog`.
- ACL observed: EXECUTE for PUBLIC, postgres, anon, authenticated and service_role.
- Event trigger `ensure_rls` is enabled (`evtenabled=O`), event `ddl_command_end`, tags `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO`, function `rls_auto_enable()`, event-trigger owner `postgres`.
- Function inspects DDL commands and enables RLS for newly created table/partitioned-table objects in schema `public`.
- Function catches `WHEN OTHERS` during ALTER TABLE and only raises a log message; it does not fail the originating DDL. This is a fail-open risk if enabling RLS fails.
- The function is an event-trigger function, not an ordinary application RPC. Advisor still flags its broad EXECUTE ACL as externally callable through the exposed schema.

**Disposition:**
1. Preserve the event trigger and function for now; do not manually invoke the event-trigger function.
2. Do not change ACLs in this production project during this audit. The user has explicitly disallowed staging/real-world testing, and no isolated disposable database was provisioned to validate privilege behavior before revocation.
3. The intended hardening direction is to remove unnecessary API-role execution (PUBLIC/anon/authenticated and likely service_role if no operational use), retaining only the privilege required for the event trigger to execute. Before applying, verify PostgreSQL's event-trigger function privilege semantics against the exact server version and a disposable non-production reproduction, or obtain equivalent authoritative evidence. The current no-staging constraint prevents that validation now.
4. Independently address the fail-open exception behavior in a reviewed migration/implementation decision; an RLS enforcement mechanism should not silently permit a table-creation operation to complete without its expected RLS state.
5. After an approved change, verify event trigger behavior and rerun Supabase Security Advisor. No ACL, function, trigger or schema changes were made in this audit.

## 6. Current Phase 00 disposition

| Acceptance area | Status | Evidence / remaining work |
|---|---|---|
| Repository tree and route ownership | PARTIAL | Verified inventory and folder alignment; full source ownership review remains |
| Dependency inventory | PARTIAL | 1,037-coordinate CycloneDX SBOM committed |
| License / NOTICE reconciliation | OPEN | Lockfile lacks license declarations; package-by-package review required |
| Environment names and references | PARTIAL | Key names and selected usages confirmed; complete tracked-source scan and deployment reconciliation pending |
| Asset byte metadata / hashes / duplicates | PARTIAL | 31 files, bytes, Git blob SHA, six duplicate groups |
| Asset dimensions / provenance / full usage | OPEN | Binary inspection and complete usage mapping pending |
| Supabase live database baseline | PARTIAL | Project metadata, schema/migration/extension/RLS/function/trigger/advisor evidence; Auth/Data API settings pending |
| `rls_auto_enable()` security disposition | PARTIAL / NO CHANGE | Risk analyzed; no ACL change until safe privilege validation |
| Migration batch M000–M220 | PARTIAL | Reconciliation document exists; Phase 00 sign-off remains open |
| Phase 00 acceptance and Phase 01 readiness | OPEN | Do not start Phase 01 until all applicable acceptance criteria have evidence and sign-off |

## 7. Explicit non-actions and constraints

- No staging environment was created or used.
- No real-world/UAT test was run.
- No Supabase schema, migration, grant, RLS policy, function, trigger, Auth setting or Data API setting was changed.
- No dependency version was changed.
- No asset was deleted or moved.
- No backend FastAPI or new frontend portal structure was created as part of this evidence pass.
- The Maps config secret fallback was removed as a targeted source security fix.
