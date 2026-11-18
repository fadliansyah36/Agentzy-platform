# Phase 00 — Legal / IP Approval

**Decision: PENDING — NOT APPROVED**  
**Review date:** 18 November 2026  
**Required authorities:** Legal/IP Owner, Dependency Maintainer, Brand/Asset Owner and independent Legal/IP reviewer.

## 1. Scope
- 1,037 exact package coordinates in the CycloneDX SBOM.
- 966 permissive/attribution-check entries.
- 26 LGPL/MPL entries (14 LGPL-3.0-or-later sharp/libvips coordinates and 12 MPL-2.0 coordinates).
- Five manual-expression entries: argparse@2.0.1, caniuse-lite@1.0.30001826, deep-freeze@0.0.1, url-template@2.0.8, valid-url@1.0.9.
- Forty packages with declared MIT/Apache metadata but no detected bundled LICENSE file.
- 988 license texts consolidated and two NOTICE/COPYING files detected.
- All 31 raster assets in `PHASE_00_ASSET_PROVENANCE_MATRIX.md`.

## 2. Current technical disposition
Automated package scan reconciles 1,037/1,037 coordinates with zero unresolved registry lookups. This is technical inventory, not legal approval. The 966 entries still require attribution/NOTICE review. The 26 LGPL/MPL packages require shipped-artifact, platform, linking and source-obligation analysis. The five manual expressions require exact publisher text. The 40 missing-license-file packages require exact-version upstream evidence.

All 31 image assets remain PENDING EVIDENCE. No creator/rightsholder, source, commercial permission, redistribution permission or attribution evidence was supplied for any item.

## 3. Approval record
| Required approval | Identity / evidence | Decision |
|---|---|---|
| Legal/IP Owner | Not provided | PENDING |
| Dependency Maintainer | Not provided | PENDING |
| Brand/Asset Owner | Not provided | PENDING |
| Independent Legal/IP Reviewer | Not provided | PENDING |

No legal approval is inferred from repository retention, automated SPDX classification, duplicate hashes, CI success or Product Owner authorization to begin remediation.

## 4. Decision
**NOT APPROVED. RR-008–RR-011 remain BLOCKED.** No asset or package is designated production-approved. Final legal decision requires exact source evidence and authorized, reviewer-authored sign-off.
