"""Domain/application rules for organization unit lifecycle commands."""

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.core.authorization import authorize_object
from app.repositories.tenant_structure_repository import (
    get_active_parent_unit,
    get_organization_status,
    get_organization_unit_for_update,
    organization_unit_has_dependents,
    organization_unit_parent_would_cycle,
    set_organization_unit_status_row,
    update_organization_unit_row,
)


async def update_organization_unit(
    connection: AsyncConnection,
    *,
    tenant_id: UUID,
    unit_id: UUID,
    actor_id: UUID,
    changes: dict,
    authorization_context=None,
) -> dict:
    current = await get_organization_unit_for_update(connection, tenant_id, unit_id)
    if current is None:
        raise HTTPException(status_code=404, detail="Organization unit tidak ditemukan.")
    if authorization_context is not None:
        authorize_object(
            authorization_context,
            resource_tenant_id=tenant_id,
            organization_id=current["organization_id"],
            organization_unit_id=unit_id,
        )
    organization_status = await get_organization_status(
        connection, tenant_id, current["organization_id"]
    )
    if organization_status != "active":
        raise HTTPException(
            status_code=409,
            detail="Organization harus aktif sebelum struktur unit diubah.",
        )

    parent_unit_id = (
        changes["parent_unit_id"] if "parent_unit_id" in changes else current["parent_unit_id"]
    )
    if parent_unit_id is not None:
        parent = await get_active_parent_unit(
            connection, tenant_id, current["organization_id"], parent_unit_id
        )
        if parent is None:
            raise HTTPException(
                status_code=404,
                detail="Parent organization unit tidak aktif atau berada di luar organisasi.",
            )
        if parent_unit_id == unit_id:
            raise HTTPException(
                status_code=409, detail="Unit tidak dapat menjadi induknya sendiri."
            )
        if await organization_unit_parent_would_cycle(
            connection, tenant_id, unit_id, parent_unit_id
        ):
            raise HTTPException(
                status_code=409,
                detail="Parent baru berada di bawah unit ini dan akan membentuk siklus.",
            )

    status = changes.get("status") or current["status"]
    if status == "inactive" and await organization_unit_has_dependents(
        connection, tenant_id, unit_id
    ):
        raise HTTPException(
            status_code=409,
            detail="Unit dengan child, cabang, atau membership aktif tidak dapat dinonaktifkan.",
        )

    return await update_organization_unit_row(
        connection,
        tenant_id=tenant_id,
        unit_id=unit_id,
        actor_id=actor_id,
        name=(changes.get("name") or current["name"]).strip(),
        code=(changes.get("code") or current["code"]).strip().upper(),
        unit_type=changes.get("unit_type") or current["unit_type"],
        status=status,
        parent_unit_id=parent_unit_id,
    )


async def set_organization_unit_status(
    connection: AsyncConnection,
    *,
    tenant_id: UUID,
    unit_id: UUID,
    actor_id: UUID,
    status: str,
    authorization_context=None,
) -> tuple[dict, str]:
    current = await get_organization_unit_for_update(connection, tenant_id, unit_id)
    if current is None:
        raise HTTPException(status_code=404, detail="Organization unit tidak ditemukan.")
    if authorization_context is not None:
        authorize_object(
            authorization_context,
            resource_tenant_id=tenant_id,
            organization_id=current["organization_id"],
            organization_unit_id=unit_id,
        )
    previous_status = current["status"]

    if status == "archived":
        if await organization_unit_has_dependents(connection, tenant_id, unit_id):
            raise HTTPException(
                status_code=409,
                detail="Unit masih memiliki child unit, cabang, atau membership yang ditugaskan.",
            )
    elif status == "active":
        organization_status = await get_organization_status(
            connection, tenant_id, current["organization_id"]
        )
        if organization_status != "active":
            raise HTTPException(
                status_code=409,
                detail="Organization harus aktif sebelum unit dipulihkan.",
            )
        if current["parent_unit_id"] is not None:
            parent = await get_active_parent_unit(
                connection, tenant_id, current["organization_id"], current["parent_unit_id"]
            )
            if parent is None:
                raise HTTPException(
                    status_code=409,
                    detail="Parent unit harus aktif sebelum unit ini dipulihkan.",
                )
    row = await set_organization_unit_status_row(
        connection,
        tenant_id=tenant_id,
        unit_id=unit_id,
        actor_id=actor_id,
        status=status,
    )
    return row, previous_status


async def ensure_tenant_owner_retained(
    connection: AsyncConnection,
    *,
    tenant_id: UUID,
    membership_id: UUID,
) -> None:
    """Serialize owner lifecycle mutations and prevent ownerless active tenants."""
    await connection.execute(
        text("select pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"tenant-owner:{tenant_id}"},
    )
    target_owner = await connection.execute(
        text("""
            select exists(
              select 1
              from public.memberships m
              join public.membership_roles mr on mr.membership_id=m.id
              join public.roles r on r.id=mr.role_id
              where m.id=:membership_id and m.tenant_id=:tenant_id
                and m.status in ('active','invited','suspended') and r.key='corporate_owner'
                and (r.tenant_id is null or r.tenant_id=:tenant_id)
                and mr.scope_type='tenant'
                and (mr.valid_from is null or mr.valid_from<=now())
                and (mr.valid_until is null or mr.valid_until>now())
            )
        """),
        {"membership_id": membership_id, "tenant_id": tenant_id},
    )
    if not target_owner.scalar_one():
        return
    other_owner = await connection.execute(
        text("""
            select exists(
              select 1
              from public.memberships m
              join public.membership_roles mr on mr.membership_id=m.id
              join public.roles r on r.id=mr.role_id
              where m.tenant_id=:tenant_id and m.id<>:membership_id
                and m.status='active' and r.key='corporate_owner'
                and (r.tenant_id is null or r.tenant_id=:tenant_id)
                and mr.scope_type='tenant'
                and (mr.valid_from is null or mr.valid_from<=now())
                and (mr.valid_until is null or mr.valid_until>now())
            )
        """),
        {"membership_id": membership_id, "tenant_id": tenant_id},
    )
    if not other_owner.scalar_one():
        raise HTTPException(
            status_code=409,
            detail="Tenant harus mempertahankan minimal satu owner aktif.",
        )
