# Dependency & License Risk Review — Phase 00

**Status: AUTOMATION IMPLEMENTED; PACKAGE-BY-PACKAGE RECONCILIATION PENDING WORKFLOW EXECUTION.**

## Purpose and scope

Agentzy is a privately owned repository (package.json marks the package private). That does not remove third-party package license conditions. This is a proportionate technical review: inventory the resolved npm dependency tree, identify declared/detected licenses, flag unknown and copyleft signals, and record LICENSE/NOTICE/COPYING evidence. It is not a formal legal audit and does not require replacing permissive packages merely because they are open source.

The governing PRD Phase 00 requires an asset/dependency/license inventory. PRD §8.4 separately requires license/provenance metadata and resolver checks for skills. Phase 11 owns runtime skill provenance, license and dependency enforcement.

## Inventory baseline

- Canonical lockfile: bun.lock.
- Existing SBOM: docs/phase-00/sbom/bun-lock.cdx.json.
- Expected baseline: **1,037 unique exact npm package name/version coordinates**, deduplicated from 1,130 lock locator entries.
- Lockfile metadata does not itself provide package license declarations. Existing SBOM NOASSERTION values are unresolved markers, not license findings.
- Scan includes direct and transitive dependencies, including development dependencies, to reconcile the complete Phase 00 inventory.

## Implemented automated workflow

.github/workflows/dependency-license-review.yml runs on demand and when dependency manifests/lockfile or audit script change. It installs the committed Bun lockfile in frozen mode, scans the installed dependency tree using @lizenz/checker, collects license texts, reconciles exact package name/version coordinates against the SBOM, generates JSON and Markdown evidence, uploads an artifact, and commits generated reports to main only when changed.

The installed tree is not expected to contain every optional platform-specific package. The scanner reconciles the installed tree plus registry fallback evidence against the exact SBOM coordinates; missing package metadata or unresolved registry lookups fail the job rather than silently omitting packages.

## Risk triage rules

- **UNKNOWN:** absent, UNKNOWN, UNLICENSED, NOASSERTION, or unresolved license declaration.
- **HIGH_REVIEW:** strong copyleft/source-availability signals such as AGPL, GPL, SSPL, EUPL, OSL or CPAL.
- **COPYLEFT_REVIEW:** weak/reciprocal copyleft signals such as LGPL, MPL, EPL, CDDL, CPL or RPL.
- **LOW_RISK_ATTRIBUTION_CHECK:** recognized permissive SPDX identifier and a detected license file. This is not a waiver of attribution/notice obligations.
- **MANUAL_REVIEW:** compound, custom, malformed, non-SPDX or otherwise unclassified expressions.
- **REVIEW_LICENSE_FILE_MISSING:** apparently permissive metadata without a detected license file.

No package is automatically approved or rejected by a simplistic allow-list. Compound AND/OR expressions and package-specific exceptions require review against actual license text and distribution model.

## NOTICE and attribution handling

The scanner records package-level NOTICE, THIRD-PARTY-NOTICES, and COPYING files when found. Presence is evidence, not proof that the file is legally required; absence is not proof that no notice obligation exists. Reviewers must inspect actual license terms and preserve required upstream notices. Do not invent notices for packages that do not require them.

## Decision register

No package is designated for replacement or unconditional approval from the lockfile alone. Once workflow evidence is available, record each flagged package as:
- **KEEP:** obligations understood and fulfillable; preserve required notices.
- **REPLACE:** obligation conflicts with proprietary distribution/product policy or cannot reasonably be fulfilled.
- **EXCEPTION:** approved package-specific rationale, owner and review date.
- **UNRESOLVED:** missing/ambiguous evidence; do not mark Phase 00 acceptance complete.

## Acceptance gate

P00 dependency/license inventory closes only after the workflow completes, all 1,037 exact coordinates reconcile (or platform-specific differences are explained), flagged packages have dispositions, required notices/attributions are preserved and traceable, and the generated report plus commit SHA are linked from BASELINE_EVIDENCE_AND_ACCEPTANCE.md.

## Explicit limitations

No staging, UAT, production deployment, or real-world testing is part of this task. The workflow performs package installation and static metadata/file inspection in an isolated GitHub Actions runner; it does not execute Agentzy application flows. The workflow has run successfully. Exact reconciliation covers 1,037/1,037 package coordinates (960 installed plus 77 registry fallback), with zero unresolved registry lookups. See `docs/phase-00/DEPENDENCY_LICENSE_FINDINGS_2026-11-18.md` for counts, package groups and provisional KEEP/REVIEW decisions. 988 license texts are preserved in the generated bundle. Package-level review remains open for 26 LGPL/MPL, 5 manual-expression and 40 license-file-missing coordinates.


## Latest run result

GitHub Actions run `44138463292` completed successfully. The generated report is committed under `docs/phase-00/reports/`. This confirms inventory and metadata collection, not final legal approval. Phase 00 remains open until the flagged groups and release attribution obligations are resolved.
