# Phase 00 — Asset Rights Source Register

**Status:** PENDING EXTERNAL EVIDENCE for all 31 asset paths.  
**Canonical inventory:** `PHASE_00_ASSET_31_PROVENANCE_MATRIX.md`.

| Asset ID range | Required evidence from Asset Owner | Required Legal/IP validation | Current status |
|---|---|---|---|
| AGZ-ASSET-001–031 | Original source/repository/URL, creator/rightsholder, acquisition record, date, file-level usage and written permission where applicable | License category, commercial-use, modification, redistribution, attribution/NOTICE, restrictions and enforceability | PENDING EVIDENCE |

## Evidence submission template (one record per Asset ID)

- Asset ID:
- Filename and Git blob SHA:
- Original source URL/repository:
- Creator:
- Copyright owner / rights holder:
- Acquisition date and method:
- License name/version and exact license text or terms URL:
- Purchase receipt / invoice / account record (if commercial asset):
- Written authorization (if permission-based):
- Commercial use: YES / NO / CONDITIONAL / UNKNOWN:
- Modification: YES / NO / CONDITIONAL / UNKNOWN:
- Redistribution / embedding in Agentzy: YES / NO / CONDITIONAL / UNKNOWN:
- Attribution / NOTICE text:
- Restrictions (territory, seat, product, audience, duration, derivative works, redistribution):
- Asset Owner declaration:
- Evidence reference (secure link; do not commit payment data or personal secrets):
- Legal/IP reviewer:
- Legal decision date and written decision:

## Classification rules

- **Open-source license:** preserve exact license and notice; confirm the asset itself is within license scope.
- **Commercial asset license:** attach purchase/license evidence and check seats, product, SaaS, redistribution and derivative restrictions.
- **Free asset with restrictions:** document each restriction and confirm Agentzy's intended use complies.
- **Public-domain claim:** require reliable evidence for jurisdiction and work; do not infer from download location.
- **Custom permission:** require written authorization from the actual rights holder.
- **Unknown/unverifiable origin:** recommend REPLACE or EXCLUDED if source cannot be proven.

## Disposition control

Allowed final statuses: APPROVED, RESTRICTED, REPLACE, EXCLUDED, PENDING EVIDENCE. A disposition is not final until Asset Owner evidence and Legal/IP review are recorded. The six duplicate working-copy files inherit no independent license; map them to the same rights evidence as their exact-byte source file.

No asset is approved for production at this time.
