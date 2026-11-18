# Phase 00 — Hosted Supabase Configuration Evidence

**Project:** `Agentzy-db` / `cwhjdnkotuhueeudpgeu`  
**API URL:** https://cwhjdnkotuhueeudpgeu.supabase.co  
**Evidence capture:** 18 November 2026, approximately 05:03 UTC  
**Project state:** ACTIVE_HEALTHY · PostgreSQL 17.12 · ap-northeast-1

## Evidence boundary
Connected Supabase tools expose project metadata and database catalogs. They do not return authoritative hosted Auth provider/security configuration or the hosted Data API exposed-schema setting. Repository `supabase/config.toml` is local declarative configuration, not proof of hosted Dashboard state.

## 1. Auth
| Setting | Hosted value | Evidence / decision |
|---|---|---|
| Enabled providers | NOT VERIFIED | Dashboard evidence required |
| Public signup | NOT VERIFIED | Local config says false; not proof of hosted value |
| Invitation-only policy | NOT VERIFIED | Owner confirmation required |
| Email confirmation | NOT VERIFIED | Local config says true; not proof of hosted value |
| SMTP / sender identity | NOT VERIFIED | Dashboard evidence required; never disclose credentials |
| Password/security policy | NOT VERIFIED | Dashboard evidence required |
| Session / JWT expiry | NOT VERIFIED | Local config says 3600 seconds; hosted value not verified |
| Redirect URLs / allowed origins | NOT VERIFIED | Local config contains localhost redirects; hosted allowlist unknown |
| MFA / privileged assurance | NOT VERIFIED | Dashboard evidence required |
| Auth user count | 0 | Live catalog count; no first administrator exists |

## 2. Data API
| Setting | Value | Evidence / decision |
|---|---|---|
| Data API enabled | Repository config says true; hosted setting NOT VERIFIED | Dashboard API settings evidence required |
| Exposed schemas | Hosted value NOT VERIFIED | `current_setting('pgrst.db_schemas', true)` returned NULL; not authoritative |
| Public schema table grants | Broad grants observed | See `security/PHASE_00_RLS_GRANTS_EVIDENCE.md` |
| GraphQL exposure | Hosted value NOT VERIFIED | Dashboard evidence required |
| Function exposure | `public.rls_auto_enable()` flagged by Advisor | RR-002 remediation pending |

Supabase's 2026-04-28 notice explains that public-table grants determine Data API reachability and new-table exposure defaults changed in 2026: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically.

## 3. Storage
| Setting | Live catalog evidence | Decision |
|---|---|---|
| Buckets | 0 | Verified catalog fact |
| Objects | 0 | Verified catalog fact |
| Storage policies | 0 | Verified catalog fact |
| Intended use | Not established | Product Owner must decide intentionally unused vs required buckets |
| Public/private model | Not applicable while no buckets exist | If provisioned, private by default |
| Signed URL / upload / download | Not applicable yet | Must be domain-authorized and short-lived |

## 4. Required Project Owner evidence
For each Dashboard screenshot/export, record capture time, project ref, setting page, actual value, decision, reviewer and approval:
- Authentication → Providers, URL Configuration, Email/SMTP, Security and MFA.
- API → Data API exposed schemas and GraphQL exposure.
- Storage → bucket inventory, policies and service configuration.
- Confirm whether Storage is intentionally unused at Phase 00.

No screenshot, export, owner decision or reviewer evidence was supplied. Do not infer secure configuration from missing connector output.

**RR-005 and RR-006 remain BLOCKED. RR-007 is DONE for catalog observation only; Product Owner decision remains PENDING.**
