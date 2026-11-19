"""Persistence boundary for tenant organization hierarchy records."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def get_organization_unit_for_update(connection: AsyncConnection, tenant_id, unit_id):
    result = await connection.execute(
        text("""
            select id,tenant_id,organization_id,parent_unit_id,name,code,unit_type,status
            from public.organization_units
            where id=:id and tenant_id=:tenant_id
            for update
        """),
        {"id": unit_id, "tenant_id": tenant_id},
    )
    row = result.mappings().first()
    return dict(row) if row else None


async def get_organization_status(connection: AsyncConnection, tenant_id, organization_id):
    result = await connection.execute(
        text("""
            select status from public.organizations
            where id=:organization_id and tenant_id=:tenant_id
        """),
        {"organization_id": organization_id, "tenant_id": tenant_id},
    )
    return result.scalar_one_or_none()


async def get_active_parent_unit(
    connection: AsyncConnection, tenant_id, organization_id, parent_unit_id
):
    result = await connection.execute(
        text("""
            select id from public.organization_units
            where id=:parent_id and tenant_id=:tenant_id
              and organization_id=:organization_id and status='active'
        """),
        {
            "parent_id": parent_unit_id,
            "tenant_id": tenant_id,
            "organization_id": organization_id,
        },
    )
    return result.scalar_one_or_none()


async def organization_unit_parent_would_cycle(
    connection: AsyncConnection, tenant_id, unit_id, parent_unit_id
) -> bool:
    result = await connection.execute(
        text("""
            with recursive descendants(id) as (
              select id from public.organization_units
              where tenant_id=:tenant_id and parent_unit_id=:unit_id
              union
              select child.id
              from public.organization_units child
              join descendants parent on child.parent_unit_id=parent.id
              where child.tenant_id=:tenant_id
            )
            select exists(select 1 from descendants where id=:parent_id)
        """),
        {"tenant_id": tenant_id, "unit_id": unit_id, "parent_id": parent_unit_id},
    )
    return bool(result.scalar_one())


async def organization_unit_has_dependents(
    connection: AsyncConnection, tenant_id, unit_id
) -> bool:
    result = await connection.execute(
        text("""
            select
              exists(select 1 from public.organization_units
                where tenant_id=:tenant_id and parent_unit_id=:id and status<>'archived')
              or exists(select 1 from public.branches
                where tenant_id=:tenant_id and organization_unit_id=:id and status<>'archived')
              or exists(select 1 from public.memberships
                where tenant_id=:tenant_id and organization_unit_id=:id
                  and status in ('invited','active','suspended'))
        """),
        {"tenant_id": tenant_id, "id": unit_id},
    )
    return bool(result.scalar_one())


async def update_organization_unit_row(
    connection: AsyncConnection,
    *,
    tenant_id,
    unit_id,
    actor_id,
    name: str,
    code: str,
    unit_type: str,
    status: str,
    parent_unit_id,
) -> dict:
    result = await connection.execute(
        text("""
            update public.organization_units
            set name=:name,code=:code,unit_type=:unit_type,status=:status,
                parent_unit_id=:parent_unit_id,updated_by=:actor,updated_at=now()
            where id=:id and tenant_id=:tenant_id
            returning id,tenant_id,organization_id,parent_unit_id,name,code,unit_type,status
        """),
        {
            "name": name,
            "code": code,
            "unit_type": unit_type,
            "status": status,
            "parent_unit_id": parent_unit_id,
            "actor": actor_id,
            "id": unit_id,
            "tenant_id": tenant_id,
        },
    )
    return dict(result.mappings().one())


async def set_organization_unit_status_row(
    connection: AsyncConnection, *, tenant_id, unit_id, actor_id, status: str
) -> dict:
    result = await connection.execute(
        text("""
            update public.organization_units
            set status=:status,updated_by=:actor,updated_at=now()
            where id=:id and tenant_id=:tenant_id
            returning id,tenant_id,organization_id,parent_unit_id,name,code,unit_type,status
        """),
        {
            "status": status,
            "actor": actor_id,
            "id": unit_id,
            "tenant_id": tenant_id,
        },
    )
    return dict(result.mappings().one())
