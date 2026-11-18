# Phase 00 — Engineering Checks Report

**Date:** 18 November 2026  
**Status:** **PARTIAL — workflow added; first run pending**

## 1. Governing requirements

AGENTS.md requires minimum engineering checks during development: lint/type-check, Python compile/import, migration consistency, schema/API contract validation, static checks and focused deterministic unit checks. PRD v2.0 §20 requires actual evidence and forbids claiming checks that did not run. Full staging, UAT, real-world, load/security acceptance and production release remain deferred to Phase 22.

## 2. Environment evidence

Commands executed in the available container:

| Command | Result |
|---|---|
| `supabase --version` | BLOCKED — command not found |
| `bun --version` | BLOCKED — command not found |
| `node --version` | DONE — v22.16.0 |
| `git --version` | DONE — 2.47.3 |
| `npx --yes supabase@latest --version` | BLOCKED — timed out after 30 seconds |

The GitHub connector can inspect repository files but cannot provide a local working tree to run the app build. The current environment has no Bun or Supabase CLI.

## 3. CI workflow added

New file: `.github/workflows/phase-00-engineering-checks.yml`

Commit: `3a427e3a4990bee3889192eca83fcf285531e332`

The workflow runs on pushes to main when application/API/migration/toolchain files change and supports manual dispatch. It contains:
- Bun frozen-lockfile install.
- ESLint.
- TypeScript `tsc --noEmit`.
- Python 3.12 editable install with dev tools.
- Python `compileall`.
- Ruff static checks.
- FastAPI import and OpenAPI generation/JSON serialization (without connecting to the database).
- Migration filename/version uniqueness and order check.

The workflow is engineering CI only. It does not deploy, run staging/UAT, call production application endpoints, perform load tests or modify Supabase.

**First run:** pending verification through GitHub Actions after workflow commit. No passing result is claimed in this report.

## 4. Checks not yet evidenced

- Remote migration-history vs local source reconciliation in CI: not automated.
- Live schema vs migration source diff: not executed.
- Focused deterministic unit tests: no test suite inventory/execution evidence collected in this pass.
- Full API contract test beyond OpenAPI schema generation: not executed.
- Static security/dependency review: license workflow exists, but package/legal disposition remains open.
- Supabase Security Advisor after remediation: not run because remediation has not been applied.

## 5. Explicit non-execution

No staging, UAT, real-world testing, load testing, production deployment, production API smoke test or destructive database test was performed. No production database DDL or privilege changes were applied.
