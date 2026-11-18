# Phase 00 — Independent Review Scope & Independence

## Common review protocol

Each reviewer receives read-only access to the evidence package and the exact commit SHA under review. The reviewer must:
- State identity, employer/organization, role, relevant competence and review date.
- Declare relationships to implementers, Project Owner, Security Lead, Asset Owner, Domain Owners and Product Owner.
- Declare financial, reporting, personal or other conflicts.
- Explain any independence limitation and whether it can be mitigated.
- Review source evidence, not only summaries or checklists.
- Record sample/method, findings, severity rationale, exceptions, evidence references and recommendation.
- Sign and date the written report.
- Avoid modifying the artifacts or reviewing work they personally implemented.

## Reviewer-specific scope

### AGZ-REV-SEC-01 — Security & Supabase
- Verify exact project ref and live security evidence.
- Review event-trigger fail-open behavior and remediation design.
- Review SECURITY DEFINER exposure and Advisor 0028/0029.
- Review per-table grants/default privileges and least-privilege rationale.
- Review hosted Auth/Data API/Storage evidence.
- Review backup/PITR plan and recovery runbook.
- State what was not tested; no Phase 22 security acceptance testing is implied.

### AGZ-REV-TECH-01 — Technical Architecture & Repository
- Verify AGENTS.md, Master PRD v2.0 and Blueprint v1.0 alignment.
- Review repository structure, ADRs, migration source/history and branch governance.
- Review screen/action/callback/API/domain/permission ownership matrix.
- Review FastAPI authority and frontend boundary.
- Re-run or inspect recorded minimum engineering checks and exact commit SHA.
- Confirm RR-014/RR-015/RR-016 evidence remains valid without re-opening completed work.

### AGZ-REV-LEGAL-01 — Legal/IP & Asset Provenance
- Review all 31 asset path records and duplicate relationships.
- Verify creator/rightsholder/source/acquisition evidence and license terms.
- Assess commercial-use, modification, redistribution and attribution obligations.
- Review dependency-license exceptions in RR-008–RR-010 if included in assigned legal scope.
- Issue per-asset disposition and written approval/restrictions.

### AGZ-REV-GOV-01 — Governance & Final Acceptance
- Review Residual Risk Register consistency and status evidence.
- Verify risk owners, control owners, decisions and Product Owner authority.
- Assess evidence completeness, traceability and reviewer independence.
- Verify Phase 00 exit criteria and any proposed residual-risk acceptance against policy.
- Issue independent closure recommendation; Product Owner retains final acceptance decision.

## Required reviewer report format

1. Reviewer identity, organization, role and qualifications.
2. Independence declaration and conflict assessment.
3. Scope and exclusions.
4. Evidence package commit SHA and document references.
5. Review method and sample.
6. Findings with evidence and severity rationale.
7. Open risks and corrective actions.
8. Recommendation: ACCEPT / ACCEPT WITH CONDITIONS / REJECT / INSUFFICIENT EVIDENCE.
9. Signature and date.

## Independence gate

A reviewer is not independent if they authored or implemented the control being reviewed, own the control's operation, or made the decision whose correctness they are asked to assess, unless Governance documents a permitted mitigation and acceptance policy explicitly allows it. The four scopes should be staffed by separate qualified people; no self-review.

No reviewer has been confirmed and no independent review has been performed as of this document.
