# Dependency & License Findings — 18 November 2026

**Scope:** Phase 00 dependency inventory and proportionate license/NOTICE risk triage.  
**Status:** inventory reconciled; package-level risk dispositions remain open. This is not a formal legal opinion.

## 1. Reconciliation result

| Measure | Result |
|---|---:|
| Exact SBOM package coordinates | 1,037 |
| Found in Linux installed tree | 960 |
| Platform/optional coordinates checked via registry fallback | 77 |
| Total exact coordinates reviewed | **1,037 / 1,037** |
| Unresolved registry lookups | **0** |
| Exact set reconciliation | **PASS** |
| License texts consolidated in repository | **988** |
| Package NOTICE/COPYING files detected | **2** |

The 77 registry-fallback packages are not treated as missing: Bun did not install them on the Linux runner because the resolved packages include platform-specific optional variants. Their exact name/version metadata and package tarballs were inspected.

## 2. Risk classification

| Classification | Count | Interpretation |
|---|---:|---|
| LOW_RISK_ATTRIBUTION_CHECK | 966 | Recognized permissive SPDX declaration and license text found; attribution obligations still apply |
| COPYLEFT_REVIEW | 26 | LGPL/MPL declarations; review distribution/linking and source-offer obligations |
| MANUAL_REVIEW | 5 | Non-standard, non-SPDX or guessed expressions |
| REVIEW_LICENSE_FILE_MISSING | 40 | License metadata exists, but a package LICENSE file was not found in installed package/tarball evidence |
| UNKNOWN / HIGH_REVIEW | 0 | No such labels in this run; this does not eliminate manual-review findings |

### Copyleft group

The 26 coordinates are concentrated in:
- @img/sharp-libvips-* and @img/sharp-*: LGPL-3.0-or-later, including compound Apache/LGPL/MIT declarations.
- lightningcss*: MPL-2.0.
- axe-core: MPL-2.0.

These are **not automatically designated for replacement**. The platform-specific variants share the same license family; review should focus on which variants enter shipped artifacts and how native/WASM components are linked or distributed. Preserve detected license texts in the consolidated bundle.

### Manual-review group

| Package | Declared/detected value | Required follow-up |
|---|---|---|
| argparse@2.0.1 | Python-2.0 | Verify exact SPDX meaning and source license text |
| caniuse-lite@1.0.30001826 | CC-BY-4.0 | Verify attribution and source/database notice requirements |
| deep-freeze@0.0.1 | Public Domain | Verify upstream dedication/jurisdiction evidence |
| url-template@2.0.8 | BSD* | Confirm guessed BSD variant and preserve copyright notice |
| valid-url@1.0.9 | MIT* | Confirm guessed MIT text and copyright notice |

### License file missing group

The 40 packages have a declared MIT or Apache-2.0 license in package metadata, but no package LICENSE file was found in the inspected install/tarball paths. This is not equivalent to an unknown license. Recover authoritative LICENSE/copyright text from the exact upstream source before release. Do not invent or synthesize package-specific copyright statements.

## 3. NOTICE / attribution evidence

The scan found and copied these package NOTICE files:
- bare-path@3.1.3
- import-in-the-middle@3.6.0

Their contents are retained under docs/phase-00/reports/upstream-notices/. Presence of a NOTICE file is not proof that every package requires a separate NOTICE; absence is not proof that no attribution duty exists. The consolidated license-text file retains 988 detected package license texts. The 40 missing-file packages and remaining copyleft/manual exceptions must be closed against authoritative upstream evidence.

## 4. Provisional package decisions

- **KEEP — provisional:** 966 permissive packages with detected license texts. Include the consolidated license bundle in release distribution and retain package attribution.
- **KEEP WITH CONDITIONS — review:** 26 LGPL/MPL packages. No replacement is ordered at this point. Confirm shipped/native/WASM usage, applicable source availability and notice obligations before product distribution.
- **KEEP PENDING EVIDENCE:** 40 metadata-declared MIT/Apache packages without detected license text. Retrieve exact upstream license/copyright evidence; otherwise replace only if evidence cannot be established or obligations cannot be met.
- **MANUAL REVIEW:** 5 packages listed above. Confirm exact license expression/text and attribution before closing.
- **REPLACE:** none recommended solely from this automated report. Replacement should be a documented decision based on an actual incompatibility or inability to satisfy the license, not on the mere fact that the repo is proprietary.

## 5. Durable evidence

- Per-package JSON: docs/phase-00/reports/dependency-license-review.json
- Human-readable result: docs/phase-00/reports/dependency-license-review.md
- Consolidated license texts: docs/phase-00/reports/THIRD_PARTY_LICENSES.generated.md
- Detected upstream notices: docs/phase-00/reports/upstream-notices/
- Scanner: scripts/audit-dependency-licenses.mjs
- Workflow: .github/workflows/dependency-license-review.yml

## 6. Acceptance

Automated inventory and exact coordinate reconciliation are complete. P00-AC-03 remains **PARTIAL**, not DONE, until:
1. the 40 missing license-text/copyright records are recovered or documented as justified exceptions;
2. all 26 LGPL/MPL package variants are checked against actual shipped artifact/linking context and obligations;
3. the five manual expressions are verified;
4. the two detected NOTICE files and all required package attributions are retained in the release distribution bundle;
5. final KEEP / REPLACE / EXCEPTION decisions are approved and linked from the Phase 00 acceptance record.

No staging, UAT, real-world application testing or production deployment was performed.
