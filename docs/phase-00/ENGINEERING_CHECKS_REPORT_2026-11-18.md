# Phase 00 — Engineering Checks Report

**Date:** 18 November 2026  
**Status:** **PARTIAL — workflow executed; multiple checks failed and are now evidence-backed**

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

**First run:** GitHub Actions run `44224158408` on commit `3a427e3a4990bee3889192eca83fcf285531e332` completed with overall `failure`. [Run details](https://github.com/fadliansyah36/Agentzy-platform/actions/runs/44224158408).

## 4. Actual first-run results (GitHub Actions run 44224158408)\n\n| Check | Result | Evidence / reason |\n|---|---|---|\n| Migration filename/version/order consistency | **PASS** | Job `Migration source consistency` completed successfully; 3 migration source files validated. |\n| Python compileall | **PASS** | `python -m compileall -q app` completed successfully. |\n| Ruff | **FAIL** | `ruff check app` reported **101 errors**, including import ordering (`I001`) and line-length (`E501`); 7 findings are auto-fixable. The codebase does not currently meet its configured Ruff rules. |\n| FastAPI import + OpenAPI generation | **SKIPPED** | Step was skipped because Ruff failed earlier in the same job. |\n| Frozen Bun lockfile install | **FAIL** | `bun install --frozen-lockfile` detected `@supabase/supabase-js` added to `package.json` but missing from the saved `bun.lock`. |\n| ESLint | **SKIPPED** | Dependency install failed. |\n| TypeScript `tsc --noEmit` | **SKIPPED** | Dependency install failed. |\n\nThe lockfile mismatch is a repository dependency consistency defect. Do not regenerate/commit a lockfile blindly: inspect the exact intended version and dependency tree, then update `bun.lock` with Bun and rerun frozen install. Ruff findings should be reviewed and fixed in a dedicated engineering cleanup, without changing portal behavior or Phase 01 feature scope.\n\n## 5. Checks not yet evidenced

- Remote migration-history vs local source reconciliation in CI: not automated.
- Live schema vs migration source diff: not executed.
- Focused deterministic unit tests: no test suite inventory/execution evidence collected in this pass.
- Full API contract test beyond OpenAPI schema generation: not executed.
- Static security/dependency review: license workflow exists, but package/legal disposition remains open.
- Supabase Security Advisor after remediation: not run because remediation has not been applied.

## 6. Explicit non-execution

No staging, UAT, real-world testing, load testing, production deployment, production API smoke test or destructive database test was performed. No production database DDL or privilege changes were applied. The workflow's static checks are not a substitute for runtime/production acceptance tests.
