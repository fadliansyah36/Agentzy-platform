# Phase 01 — Tenant & Organization Model

## Existing objects

The live Agentzy database already contains `tenants` and `organizations`. Existing objects are retained; no duplicate tenant or organization source of truth is introduced.

## M010 additions

- Tenant settings: legal name, JSON settings, default timezone, default currency and data region.
- `organization_units`: tenant + organization scoped parent-child units.
- `branches`: tenant + organization scoped branch records, optionally under an organization unit.
- `departments`: tenant + organization scoped department records, optionally under a branch and parent department.
- Composite foreign keys ensure parent, organization and tenant identifiers remain consistent.
- Memberships gain organization-unit, branch and department assignments.

## Server-side resolution

A client-supplied tenant ID is only a selector. FastAPI resolves the authenticated subject's active membership and verifies that the tenant is active before producing a tenant context. The context includes organization, organization-unit, branch and department scope plus role and permission keys.

## API coverage

Existing tenant list/create/update and organization list/create routes are retained. New tenant detail, organization update, organization-unit list/create, branch list/create and department list/create routes are added.

## Remaining

Full update/archive endpoints for organization units, branches and departments, pagination, tenant settings UI and portal-specific organization hierarchy wiring remain incomplete.
