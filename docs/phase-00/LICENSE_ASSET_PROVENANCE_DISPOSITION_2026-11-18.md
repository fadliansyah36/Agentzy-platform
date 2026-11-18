# Phase 00 — License Exceptions & Asset Provenance Disposition

**Date:** 18 November 2026  
**Status:** **PARTIAL / BLOCKED — technical inventory available; legal/owner evidence incomplete**

## 1. Package inventory evidence

Source: `docs/phase-00/reports/dependency-license-review.json`, generated 2026-11-17T17:34:57.265Z from `bun.lock` and SBOM `docs/phase-00/sbom/bun-lock.cdx.json`. The lockfile blob SHA recorded by the report is `635cf4455bc8f37bafd73f4c6e82f77dd492da07`.

- 1,037 exact name/version coordinates expected and reviewed.
- 960 installed-tree packages plus 77 exact-version npm registry fallback packages.
- Exact set match: true; unresolved registry lookups: zero.
- 988 license texts bundled; two NOTICE files detected and preserved.

The scan is technical evidence, not legal approval. The generated report's package-level risk labels are triage classifications.

## 2. Exception counts and disposition

| Risk group | Count | Technical disposition | Gate status |
|---|---:|---|---|
| Recognized permissive SPDX + detected license file | 966 | KEEP WITH CONDITIONS — retain license texts and required attribution/NOTICE in distribution | PENDING owner/legal approval of notice bundle |
| LGPL/MPL copyleft review | 26 | KEEP WITH CONDITIONS only while dependency remains; confirm actual shipped artifacts, linking/combination, source/relocation and notice duties | BLOCKED pending technical distribution map + legal review |
| Manual/non-standard license expression | 5 | PENDING EVIDENCE; inspect exact license text and publisher terms | BLOCKED |
| Metadata license present, package LICENSE file not detected | 40 | PENDING EVIDENCE; obtain publisher LICENSE/copyright evidence; do not fabricate | BLOCKED |

### 2.1 Manual review coordinates

| Package | Version | Scanner expression | Required evidence |
|---|---|---|---|
| argparse | 2.0.1 | Python-2.0 | Exact upstream license text and interpretation |
| caniuse-lite | 1.0.30001826 | CC-BY-4.0 | Attribution text, source attribution and distribution notice |
| deep-freeze | 0.0.1 | Public Domain | Publisher declaration and jurisdiction-specific public-domain basis |
| url-template | 2.0.8 | BSD* | Exact BSD variant and notice text |
| valid-url | 1.0.9 | MIT* | Exact MIT license text and copyright holder |

### 2.2 Copyleft groups

- LGPL-3.0-or-later: 14 `@img/sharp-libvips*` / `@img/sharp*` platform and WASM coordinates.
- MPL-2.0: 12 `lightningcss*` platform packages plus `axe-core@4.14.1`.
- The report identifies the exact package version and tarball integrity. This does not prove whether every optional platform package ships in Agentzy production artifacts. Confirm actual deployment target, install conditions and packaged output before legal disposition.

### 2.3 Missing license-file group

All 40 exact coordinates are recorded in the JSON evidence report. They include Firebase compatibility/installations packages, Next SWC platform binaries, pnpm helper packages, Tailwind WASM, unrs resolver platform bindings, and smaller transitive packages including `client-only`, `eslint-config-next`, `google-gax`, `pg-gateway` and `tr46`. The scanner reports declared SPDX metadata but did not locate a package LICENSE file. Retrieve upstream license/copyright material for the exact version; a declared metadata field alone is not final evidence.

## 3. NOTICE and attribution

The scanner preserved two detected NOTICE/COPYING-related files. Presence is not proof that the file is legally required; absence is not proof that no attribution obligation exists. Review the exact license text and retain required upstream notices in the distribution package. Do not generate fictitious copyright lines or notices.

## 4. Asset inventory and disposition

Source: `docs/phase-00/ASSET_METADATA_INVENTORY_2026-11-18.md`.

- 31 raster files; 29,037,921 bytes total.
- Six exact duplicate blob groups.
- 13 files under `public/assets/aistudio/` are not confirmed in the targeted source-reference scan.
- Brand/landing/PWA assets have source references recorded in the inventory.
- Pixel dimensions and binary content were not decoded in this audit; GitHub tree metadata supplied blob SHA and size only.

**Disposition for all 31 assets: PENDING EVIDENCE.** Retain files in place to avoid UI breakage; retention is not a grant of rights or permission to redistribute. The inventory records path, byte size, Git blob SHA, usage when confirmed, and duplicate relationships. It does not establish creator, original source URL, owner, license, commercial-use permission or attribution obligation.

Required asset register fields still missing:
- Original source/source URL and acquisition date.
- Creator/rightsholder and proof of ownership or license grant.
- License identifier/version and commercial redistribution permission.
- Required attribution text and placement.
- Exact component/route usage or confirmed unused state.
- Approver and evidence link.

Do not delete duplicates or replace images until import/build references and UI impact are reviewed.

## 5. Owner, evidence and decision record

| Work item | Status | Owner |
|---|---|---|
| Exact package coordinate reconciliation | DONE | Dependency Maintainer |
| License-text collection and NOTICE detection | DONE (technical scan) | Dependency Maintainer |
| 966 permissive package notice obligations | PENDING APPROVAL | Legal/IP Owner + Dependency Maintainer |
| 26 LGPL/MPL review | BLOCKED | Legal/IP Owner + Frontend/Build Owner |
| 5 manual expressions | BLOCKED | Legal/IP Owner |
| 40 missing license files | BLOCKED | Dependency Maintainer |
| 31 asset metadata inventory | DONE (metadata only) | Frontend Owner |
| 31 asset rights/provenance register | BLOCKED | Brand/Asset Owner + Legal/IP Owner |
| Final package and asset dispositions | PENDING APPROVAL | Project Owner |

No package or asset was removed, replaced or modified in this work. Phase 00 license/asset gate remains **PARTIAL / BLOCKED**.

