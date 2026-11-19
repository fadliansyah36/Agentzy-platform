-- Phase 01 — enforce organization-unit ancestry for nested department reads.
-- The branch is the authoritative parent of a department's organization unit.
-- This preserves organization/branch/department scoping while closing the unit-scope gap.

drop policy if exists departments_read_active_tenant on public.departments;

create policy departments_read_active_tenant
on public.departments
for select
to authenticated
using (
    exists (
        select 1
        from public.memberships m
        join public.tenants t on t.id = m.tenant_id
        where m.tenant_id = departments.tenant_id
          and m.user_id = (select auth.uid())
          and m.status = 'active'
          and t.status = 'active'
          and (m.organization_id is null or m.organization_id = departments.organization_id)
          and (
              m.organization_unit_id is null
              or exists (
                  select 1
                  from public.branches b
                  where b.id = departments.branch_id
                    and b.tenant_id = departments.tenant_id
                    and b.organization_unit_id = m.organization_unit_id
              )
          )
          and (m.branch_id is null or m.branch_id = departments.branch_id)
          and (m.department_id is null or m.department_id = departments.id)
    )
);

comment on policy departments_read_active_tenant on public.departments is
    'Tenant-scoped department reads include organization-unit ancestry through the department branch.';
