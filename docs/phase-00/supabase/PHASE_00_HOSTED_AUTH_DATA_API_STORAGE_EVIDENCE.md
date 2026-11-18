# Phase 00 — Hosted Auth, Data API & Storage Evidence

**Project:** Agentzy-db  
**Project ref:** `cwhjdnkotuhueeudpgeu`  
**Project URL:** `https://cwhjdnkotuhueeudpgeu.supabase.co`  
**Evidence date:** 2026-11-18 (UTC)  
**Verification method:** Supabase project connector, PostgreSQL catalog queries, Security Advisor; hosted Dashboard pages are not exposed by the connector.  
**Overall:** PENDING EXTERNAL EVIDENCE — hosted settings are not certified.

## Project identity

| Setting | Actual value | Expected baseline | Evidence | Owner | Verification | Decision |
|---|---|---|---|---|---|---|
| Project identity | Agentzy-db / cwhjdnkotuhueeudpgeu | Exact canonical ref | Supabase `get_project` and `list_projects` | Supabase Project Owner | VERIFIED | Correct project |
| Status | ACTIVE_HEALTHY | Active before database inspection | Supabase `get_project` | Supabase Admin | VERIFIED | Read-only inspection allowed |
| PostgreSQL | 17.12.0.000 | PRD-supported PostgreSQL baseline | Supabase project metadata | Supabase Admin | VERIFIED | Record as current engine |
| Region | ap-northeast-1 | Approved residency/latency region | Supabase project metadata | Product Owner | VERIFIED as metadata; business approval not supplied | Owner decision pending |
| Organization plan | Free / tier_free | Plan appropriate for security and recovery needs | Supabase `get_organization` for organization hfxqdyoretyybhgrgmsa | Project Owner | VERIFIED | Recovery limitation recorded separately |

## 1. Hosted Auth configuration

The connected Supabase tools do not return the hosted Auth dashboard configuration. No value below is inferred from local `supabase/config.toml` or from defaults in documentation.

| Setting | Actual value | Expected baseline | Evidence required | Owner | Verification | Decision |
|---|---|---|---|---|---|---|
| Active providers | NOT VERIFIED | Only approved providers enabled | Dashboard → Authentication → Providers screenshot/export | Supabase Project Owner/Admin | PENDING | Pending evidence |
| Signup / invitation policy | NOT VERIFIED | Controlled invitation/onboarding; no unintended public signup | Auth signup settings and invitation policy | Project Owner | PENDING | Pending owner decision |
| Email verification | NOT VERIFIED | Required before privileged/tenant access | Provider settings screenshot | Supabase Admin | PENDING | Pending evidence |
| SMTP / email delivery | NOT VERIFIED | Production-grade sender, verified domain, rate/abuse controls | Auth SMTP settings with secrets redacted | Supabase Admin | PENDING | Pending evidence |
| Password security | NOT VERIFIED | Strong password policy and leaked-password protection where available | Auth security/password settings | Supabase Admin | PENDING | Pending evidence |
| Session / JWT lifetime | NOT VERIFIED | Short-lived access token and controlled refresh/session lifecycle | Auth session settings | Supabase Admin | PENDING | Pending evidence |
| Redirect URLs / Site URL | NOT VERIFIED | Exact allowlist; no wildcard/untrusted origins | Auth URL configuration page | Supabase Admin + App Owner | PENDING | Pending evidence |
| MFA | NOT VERIFIED | MFA enforced for privileged roles; policy documented | Auth MFA settings and privileged access policy | Supabase Admin + Security Lead | PENDING | Pending evidence |
| SSO / privileged access | NOT VERIFIED | Least privilege, break-glass time-bound and audited | Auth SSO/provider and organization access settings | Project Owner | PENDING | Pending evidence |

## 2. Hosted Data API configuration

| Setting | Actual value | Expected baseline | Evidence required | Owner | Verification | Decision |
|---|---|---|---|---|---|---|
| Exposed schemas | NOT VERIFIED | Minimum required schema; prefer public API surface deliberately | Dashboard → Integrations → Data API settings screenshot/export | Supabase Project Owner/Admin | PENDING | Pending evidence |
| Accessible roles | NOT VERIFIED at hosted setting level | Least privilege; no broad exposure by default | Data API settings plus grants inventory | Supabase Admin | PENDING | Pending evidence |
| Table/function exposure | NOT VERIFIED at hosted setting level | Expose only approved API objects; sensitive functions not public | Data API settings and function inventory | Supabase Admin + Security Lead | PENDING | Pending evidence |
| RLS on public application tables | 9/9 enabled (catalog snapshot) | RLS enabled on every exposed tenant-owned table | Live catalog inspection | Supabase Admin | VERIFIED for enabled flag only | Does not prove policies are sufficient |
| FORCE RLS | 0/9 public application tables | Evaluate FORCE RLS per ownership/role model | Live catalog inspection | Database/Security Lead | VERIFIED | Formal decision required |
| Grants | Broad grants recorded for anon/authenticated/service_role on nine public tables | Explicit per-table/per-operation least privilege | Live grants catalog and application data-path map | Database/Security Lead | VERIFIED as existing risk | Remediation blocked pending review |
| Security Advisor | WARN 0028 and 0029 for public.rls_auto_enable() at 2026-11-18T05:10:30.245Z | No unintended public execution of SECURITY DEFINER functions | Supabase Security Advisor | Security Lead | VERIFIED | RR-002 remains BLOCKED |

A query returning NULL for `current_setting('pgrst.db_schemas', true)` is not authoritative evidence of hosted Data API exposed-schema configuration.

## 3. Storage configuration

| Setting | Actual value | Expected baseline | Evidence required | Owner | Verification | Decision |
|---|---|---|---|---|---|---|
| Bucket inventory | 0 buckets | Inventory every bucket; private by default | Live `storage.buckets` catalog | Supabase Admin | VERIFIED catalog only | Product Owner must decide whether Storage is intentionally unused |
| Object inventory | 0 objects | Reconcile all application file requirements | Live `storage.objects` catalog | Supabase Admin | VERIFIED catalog only | No object population observed |
| Storage policies | 0 policies | Explicit least-privilege policies for each bucket/action | Live `pg_policies`/Storage policy catalog | Supabase Admin | VERIFIED catalog only | No bucket policy exists |
| Public/private | No buckets to classify | Private by default; exceptions require written approval | Dashboard Storage bucket list | Project Owner | N/A — no buckets | Pending owner decision |
| Upload/download | No buckets/policies | Authorization through backend; scoped upload/download | Dashboard settings and application mapping | Backend Lead + Supabase Admin | NOT VERIFIED | Pending |
| Signed URL policy | NOT VERIFIED | Short-lived signed URLs only after authorization | Dashboard/app policy evidence | Security Lead | PENDING | Pending |
| Retention/deletion | NOT VERIFIED | Defined retention, deletion propagation and audit | Storage lifecycle settings and policy | Data Governance Owner | PENDING | Pending |

## 4. Required external evidence package

Please provide evidence for the exact project ref `cwhjdnkotuhueeudpgeu`:

1. Screenshot/export of Authentication → Providers.
2. Screenshot/export of Authentication → URL Configuration.
3. Screenshot/export of Authentication → Security / MFA / Sessions (as available).
4. SMTP settings screenshot with all credentials, tokens and secrets fully redacted.
5. Screenshot/export of Integrations → Data API exposed schemas and accessible roles.
6. Storage bucket list including public/private flag, bucket settings and policies; if intentionally unused, written Product Owner decision.
7. Each screenshot must show the project ref in the Dashboard header or include a verifiable project selector/context.
8. Record capture timestamp/timezone, submitting owner name/role, and written approval/decision.

**Evidence request status:** PENDING EXTERNAL EVIDENCE. No Dashboard screenshot/export was received in this execution. No hosted configuration was changed.

## 5. Acceptance decision

RR-005 and RR-006 remain BLOCKED. RR-007 remains DONE only for the verified zero-count catalog observation; Product Owner intent/requirement decision is still pending. This document is an evidence register, not a hosted security certification.
