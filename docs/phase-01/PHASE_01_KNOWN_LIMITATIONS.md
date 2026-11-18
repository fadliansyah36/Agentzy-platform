# Phase 01 — Known Limitations

1. M010 migration source is not applied to Agentzy-db. The live database retains broad client grants and the old fail-open RLS event-trigger function.
2. A verified logical backup/recovery artifact is not available through the connected Supabase access. Do not apply M010 or deploy the dependent backend verifier until recovery evidence and SQL review are complete.
3. Phase 00 remains IN PROGRESS; it is tracked in parallel and is not a Phase 01 entry gate.
4. Dynamic ABAC `access_policies.conditions` evaluation and policy administration are not complete. Current enforcement is membership/role/permission plus hierarchy object-scope checks.
5. Not every existing management route has been converted to the shared authorization helper; object-level enforcement coverage remains partial.
6. Branch and department update/archive endpoints and full hierarchy UI wiring remain incomplete.
7. The admin RBAC matrix and other portal permission controls are not yet fully wired to the new permission registry endpoints.
8. Workforce operational demo/local data remains in source but is hidden from the production rendering path; the current authenticated Workforce view only shows verified identity, active membership and role state until domain APIs are integrated.
9. Auth provider-native login success/failure event correlation, audit-reader authorization, break-glass lifecycle and operational alerting remain open.
10. Full response schemas, cursor pagination and idempotency for all sensitive commands remain incomplete.
11. No production deployment, UAT, staging, load test, penetration test or security acceptance is claimed.
12. Phase 01 status remains PARTIAL; Phase 02 is not started.
