from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import authorize_action, authorize_object
from app.core.security import current_claims
from app.db.session import engine, user_session

router = APIRouter()
claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)


class OrganizationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=80,
        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    status: str | None = Field(default=None, pattern="^(active|inactive|archived)$")
    organization_type: str | None = Field(
        default=None, pattern="^(company|division|department|branch|team)$"
    )


class OrganizationUnitCreate(BaseModel):
    organization_id: UUID
    parent_unit_id: UUID | None = None
    name: str = Field(min_length=2, max_length=160)
    code: str = Field(min_length=2, max_length=40, pattern="^[A-Z0-9][A-Z0-9_-]*$")
    unit_type: str = Field(pattern="^(division|unit|team|cost_center)$")


class BranchCreate(BaseModel):
    organization_id: UUID
    organization_unit_id: UUID | None = None
    name: str = Field(min_length=2, max_length=160)
    code: str = Field(min_length=2, max_length=40, pattern="^[A-Z0-9][A-Z0-9_-]*$")


class DepartmentCreate(BaseModel):
    organization_id: UUID
    branch_id: UUID | None = None
    parent_department_id: UUID | None = None
    name: str = Field(min_length=2, max_length=160)
    code: str = Field(min_length=2, max_length=40, pattern="^[A-Z0-9][A-Z0-9_-]*$")


class MembershipRoleAssign(BaseModel):
    role_key: str = Field(min_length=2, max_length=80)
    scope_type: str = Field(
        default="tenant",
        pattern="^(tenant|organization|organization_unit|branch|department)$",
    )
    scope_id: UUID | None = None
    valid_until: datetime | None = None


async def _authorize(
    session: AsyncSession,
    claims: dict,
    tenant_id: UUID,
    permission: str,
    platform_permission: str,
):
    resource_type, action = permission.rsplit(".", 1)
    context, _ = await authorize_action(
        session,
        user_id=UUID(claims["sub"]),
        tenant_id=tenant_id,
        permission_key=permission,
        platform_permission=platform_permission,
        aal=claims.get("aal"),
        resource_type=resource_type,
        action=action,
        resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
    )
    return context


async def _audit(
    connection,
    request: Request,
    actor: UUID,
    tenant_id: UUID,
    action: str,
    resource_type: str,
    resource_id: UUID,
    metadata: dict | None = None,
):
    import json

    await connection.execute(
        text("""
            insert into public.audit_logs(
              tenant_id,actor_user_id,action,resource_type,resource_id,request_id,
              ip_address,user_agent,metadata
            ) values (
              :tenant_id,:actor,:action,:resource_type,:resource_id,:request_id,
              :ip,:user_agent,cast(:metadata as jsonb)
            )
        """),
        {
            "tenant_id": tenant_id,
            "actor": actor,
            "action": action,
            "resource_type": resource_type,
            "resource_id": str(resource_id),
            "request_id": request.headers.get("x-request-id"),
            "ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "metadata": json.dumps(metadata or {}),
        },
    )


@router.get("/{tenant_id}", tags=["Tenants"])
async def read_tenant(
    tenant_id: UUID, claims: dict = claims_dependency, session: AsyncSession = session_dependency
):
    platform = await _authorize(
        session, claims, tenant_id, "corporate.organization.read", "platform.tenants.read"
    )
    query = text("""
        select id,name,slug,tenant_type,status,default_timezone,default_currency,
               created_at,updated_at
        from public.tenants where id=:tenant_id
    """)
    if platform is None:
        async with engine.connect() as connection:
            result = await connection.execute(query, {"tenant_id": tenant_id})
    else:
        result = await session.execute(query, {"tenant_id": tenant_id})
    row = result.mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Tenant tidak ditemukan.")
    return dict(row)


@router.patch("/{tenant_id}/organizations/{organization_id}", tags=["Organization"])
async def update_organization(
    tenant_id: UUID,
    organization_id: UUID,
    payload: OrganizationUpdate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    values = payload.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(status_code=422, detail="Tidak ada perubahan yang dikirim.")
    if values.get("slug") and not values["slug"].islower():
        raise HTTPException(status_code=422, detail="Slug organisasi harus huruf kecil.")
    async with engine.begin() as connection:
        current = await connection.execute(
            text("""
                select id,tenant_id,parent_id from public.organizations
                where id=:organization_id and tenant_id=:tenant_id for update
            """),
            {"organization_id": organization_id, "tenant_id": tenant_id},
        )
        row = current.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Organization tidak ditemukan.")
        if context is not None:
            authorize_object(context, resource_tenant_id=tenant_id, organization_id=organization_id)
        assignments = ", ".join(f"{key}=:{key}" for key in values)
        result = await connection.execute(
            text(f"""
                update public.organizations
                set {assignments},updated_at=now()
                where id=:organization_id and tenant_id=:tenant_id
                returning id,tenant_id,parent_id,name,slug,organization_type,status,updated_at
            """),
            {**values, "organization_id": organization_id, "tenant_id": tenant_id},
        )
        updated = dict(result.mappings().one())
        await _audit(
            connection,
            request,
            UUID(claims["sub"]),
            tenant_id,
            "organization.updated",
            "organization",
            organization_id,
            values,
        )
    return updated


@router.get("/{tenant_id}/organization-units", tags=["Organization"])
async def list_organization_units(
    tenant_id: UUID, claims: dict = claims_dependency, session: AsyncSession = session_dependency
):
    platform = await _authorize(
        session, claims, tenant_id, "corporate.organization.read", "platform.tenants.read"
    )
    query = text("""
        select id,tenant_id,organization_id,parent_unit_id,name,code,unit_type,status,
               created_at,updated_at
        from public.organization_units
        where tenant_id=:tenant_id and status='active'
        order by name
    """)
    if platform is None:
        async with engine.connect() as connection:
            result = await connection.execute(query, {"tenant_id": tenant_id})
    else:
        result = await session.execute(query, {"tenant_id": tenant_id})
    return [dict(row) for row in result.mappings().all()]


@router.post(
    "/{tenant_id}/organization-units",
    status_code=status.HTTP_201_CREATED,
    tags=["Organization"],
)
async def create_organization_unit(
    tenant_id: UUID,
    payload: OrganizationUnitCreate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    if context is not None:
        authorize_object(
            context, resource_tenant_id=tenant_id, organization_id=payload.organization_id
        )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                insert into public.organization_units(
                  tenant_id,organization_id,parent_unit_id,name,code,unit_type,created_by,updated_by
                ) values (
                  :tenant_id,:organization_id,:parent_unit_id,:name,:code,:unit_type,:actor,:actor
                )
                returning id,tenant_id,organization_id,parent_unit_id,name,code,unit_type,status,
                          created_at,updated_at
            """),
            {"tenant_id": tenant_id, **payload.model_dump(), "actor": actor},
        )
        row = dict(result.mappings().one())
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "organization_unit.created",
            "organization_unit",
            row["id"],
            {"code": payload.code},
        )
    return row


@router.get("/{tenant_id}/branches", tags=["Organization"])
async def list_branches(
    tenant_id: UUID, claims: dict = claims_dependency, session: AsyncSession = session_dependency
):
    platform = await _authorize(
        session, claims, tenant_id, "corporate.organization.read", "platform.tenants.read"
    )
    query = text("""
        select id,tenant_id,organization_id,organization_unit_id,name,code,status,
               created_at,updated_at
        from public.branches where tenant_id=:tenant_id and status='active' order by name
    """)
    if platform is None:
        async with engine.connect() as connection:
            result = await connection.execute(query, {"tenant_id": tenant_id})
    else:
        result = await session.execute(query, {"tenant_id": tenant_id})
    return [dict(row) for row in result.mappings().all()]


@router.post("/{tenant_id}/branches", status_code=status.HTTP_201_CREATED, tags=["Organization"])
async def create_branch(
    tenant_id: UUID,
    payload: BranchCreate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    if context is not None:
        authorize_object(
            context,
            resource_tenant_id=tenant_id,
            organization_id=payload.organization_id,
            organization_unit_id=payload.organization_unit_id,
        )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                insert into public.branches(
                  tenant_id,organization_id,organization_unit_id,name,code,created_by,updated_by
                ) values (
                  :tenant_id,:organization_id,:organization_unit_id,:name,:code,:actor,:actor
                )
                returning id,tenant_id,organization_id,organization_unit_id,name,code,status,
                          created_at,updated_at
            """),
            {"tenant_id": tenant_id, **payload.model_dump(), "actor": actor},
        )
        row = dict(result.mappings().one())
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "branch.created",
            "branch",
            row["id"],
            {"code": payload.code},
        )
    return row


@router.get("/{tenant_id}/departments", tags=["Organization"])
async def list_departments(
    tenant_id: UUID, claims: dict = claims_dependency, session: AsyncSession = session_dependency
):
    platform = await _authorize(
        session, claims, tenant_id, "corporate.organization.read", "platform.tenants.read"
    )
    query = text("""
        select id,tenant_id,organization_id,branch_id,parent_department_id,name,code,status,
               created_at,updated_at
        from public.departments where tenant_id=:tenant_id and status='active' order by name
    """)
    if platform is None:
        async with engine.connect() as connection:
            result = await connection.execute(query, {"tenant_id": tenant_id})
    else:
        result = await session.execute(query, {"tenant_id": tenant_id})
    return [dict(row) for row in result.mappings().all()]


@router.post("/{tenant_id}/departments", status_code=status.HTTP_201_CREATED, tags=["Organization"])
async def create_department(
    tenant_id: UUID,
    payload: DepartmentCreate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    if context is not None:
        authorize_object(
            context,
            resource_tenant_id=tenant_id,
            organization_id=payload.organization_id,
            branch_id=payload.branch_id,
        )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                insert into public.departments(
                  tenant_id,organization_id,branch_id,parent_department_id,name,code,created_by,updated_by
                ) values (
                  :tenant_id,:organization_id,:branch_id,:parent_department_id,:name,:code,:actor,:actor
                )
                returning id,tenant_id,organization_id,branch_id,parent_department_id,
                          name,code,status,
                          created_at,updated_at
            """),
            {"tenant_id": tenant_id, **payload.model_dump(), "actor": actor},
        )
        row = dict(result.mappings().one())
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "department.created",
            "department",
            row["id"],
            {"code": payload.code},
        )
    return row


@router.post(
    "/{tenant_id}/memberships/{membership_id}/accept",
    status_code=status.HTTP_200_OK,
    tags=["Membership"],
)
async def accept_membership(
    tenant_id: UUID,
    membership_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
):
    user_id = UUID(claims["sub"])
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                select m.id,m.status,m.invitation_expires_at,t.status as tenant_status,
                       u.email_confirmed_at
                from public.memberships m
                join public.tenants t on t.id=m.tenant_id
                join auth.users u on u.id=m.user_id
                where m.id=:membership_id and m.tenant_id=:tenant_id and m.user_id=:user_id
                for update of m
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id, "user_id": user_id},
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Undangan tidak ditemukan.")
        if row["status"] != "invited" or row["tenant_status"] != "active":
            raise HTTPException(status_code=409, detail="Undangan tidak dapat diaktifkan.")
        if row["email_confirmed_at"] is None:
            raise HTTPException(status_code=403, detail="Verifikasi email wajib diselesaikan.")
        if row["invitation_expires_at"] and row["invitation_expires_at"] <= datetime.now(UTC):
            raise HTTPException(status_code=410, detail="Undangan telah kedaluwarsa.")
        updated = await connection.execute(
            text("""
                update public.memberships
                set status='active',joined_at=coalesce(joined_at,now()),
                    accepted_at=now(),updated_at=now()
                where id=:membership_id
                returning id,tenant_id,user_id,status,joined_at,accepted_at
            """),
            {"membership_id": membership_id},
        )
        accepted = dict(updated.mappings().one())
        await _audit(
            connection,
            request,
            user_id,
            tenant_id,
            "membership.accepted",
            "membership",
            membership_id,
        )
    return accepted


@router.post(
    "/{tenant_id}/memberships/{membership_id}/suspend",
    status_code=status.HTTP_200_OK,
    tags=["Membership"],
)
async def suspend_membership(
    tenant_id: UUID,
    membership_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.memberships.manage"
    )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        target_result = await connection.execute(
            text("""
                select organization_id,organization_unit_id,branch_id,department_id
                from public.memberships where id=:membership_id and tenant_id=:tenant_id
                for update
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        target = target_result.mappings().first()
        if target is None:
            raise HTTPException(status_code=404, detail="Membership tidak ditemukan.")
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=target["organization_id"],
                organization_unit_id=target["organization_unit_id"],
                branch_id=target["branch_id"],
                department_id=target["department_id"],
            )
        result = await connection.execute(
            text("""
                update public.memberships set status='suspended',updated_at=now()
                where id=:membership_id and tenant_id=:tenant_id and status='active'
                returning id
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Membership aktif tidak ditemukan.")
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "membership.suspended",
            "membership",
            membership_id,
        )
    return {"id": str(membership_id), "status": "suspended"}


@router.post(
    "/{tenant_id}/memberships/{membership_id}/revoke",
    status_code=status.HTTP_200_OK,
    tags=["Membership"],
)
async def revoke_membership(
    tenant_id: UUID,
    membership_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.memberships.manage"
    )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        target_result = await connection.execute(
            text("""
                select organization_id,organization_unit_id,branch_id,department_id
                from public.memberships where id=:membership_id and tenant_id=:tenant_id
                for update
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        target = target_result.mappings().first()
        if target is None:
            raise HTTPException(status_code=404, detail="Membership tidak ditemukan.")
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=target["organization_id"],
                organization_unit_id=target["organization_unit_id"],
                branch_id=target["branch_id"],
                department_id=target["department_id"],
            )
        result = await connection.execute(
            text("""
                update public.memberships
                set status='revoked',ended_at=now(),updated_at=now()
                where id=:membership_id and tenant_id=:tenant_id
                  and status in ('active','invited','suspended')
                returning id,user_id
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        revoked = result.mappings().first()
        if revoked is None:
            raise HTTPException(status_code=404, detail="Membership tidak ditemukan.")
        await _audit(
            connection, request, actor, tenant_id, "membership.revoked", "membership", membership_id
        )
    return {"id": str(membership_id), "status": "revoked"}


@router.post(
    "/{tenant_id}/memberships/{membership_id}/roles",
    status_code=status.HTTP_200_OK,
    tags=["Access Control"],
)
async def assign_membership_role(
    tenant_id: UUID,
    membership_id: UUID,
    payload: MembershipRoleAssign,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.memberships.manage"
    )
    role_key = payload.role_key.strip().lower()
    if role_key.startswith("platform_"):
        raise HTTPException(
            status_code=422, detail="Platform role tidak dapat diberikan pada tenant."
        )
    if role_key in (
        "corporate_owner",
        "corporate_admin",
        "corporate_ai_manager",
        "ai_workforce_admin",
    ):
        owner = await session.execute(
            text("""
                select exists (
                  select 1 from public.memberships m
                  join public.membership_roles mr on mr.membership_id=m.id
                  join public.roles r on r.id=mr.role_id
                  where m.user_id=:actor and m.tenant_id=:tenant_id
                    and m.status='active' and mr.scope_type='tenant'
                    and r.key='corporate_owner'
                )
            """),
            {"actor": UUID(claims["sub"]), "tenant_id": tenant_id},
        )
        platform_manager = await session.execute(
            text("""
                select exists (
                  select 1 from public.memberships m
                  join public.membership_roles mr on mr.membership_id=m.id
                  join public.roles r on r.id=mr.role_id
                  join public.role_permissions rp on rp.role_id=r.id
                  where m.user_id=:actor and m.status='active'
                    and mr.scope_type='platform'
                    and rp.permission_key='platform.memberships.manage'
                )
            """),
            {"actor": UUID(claims["sub"])},
        )
        if not bool(owner.scalar_one()) and not (
            claims.get("aal") == "aal2" and bool(platform_manager.scalar_one())
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Role elevated hanya dapat diberikan oleh tenant owner atau "
                    "platform membership admin dengan MFA."
                ),
            )
    async with engine.begin() as connection:
        membership = await connection.execute(
            text("""
                select id,organization_id,organization_unit_id,branch_id,department_id
                from public.memberships where id=:membership_id and tenant_id=:tenant_id
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        target = membership.mappings().first()
        if target is None:
            raise HTTPException(status_code=404, detail="Membership tidak ditemukan.")
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=target["organization_id"],
                organization_unit_id=target["organization_unit_id"],
                branch_id=target["branch_id"],
                department_id=target["department_id"],
            )
        role = await connection.execute(
            text("""
                select id from public.roles
                where key=:role_key and (tenant_id is null or tenant_id=:tenant_id)
            """),
            {"role_key": role_key, "tenant_id": tenant_id},
        )
        role_id = role.scalar_one_or_none()
        if role_id is None:
            raise HTTPException(status_code=404, detail="Role tidak ditemukan.")
        scope_columns = {
            "organization": "organization_id",
            "organization_unit": "organization_unit_id",
            "branch": "branch_id",
            "department": "department_id",
        }
        if payload.scope_type == "tenant" and payload.scope_id is not None:
            raise HTTPException(status_code=422, detail="Tenant scope tidak memerlukan scope_id.")
        if payload.scope_type != "tenant":
            column = scope_columns[payload.scope_type]
            if payload.scope_id is None or target[column] != payload.scope_id:
                raise HTTPException(
                    status_code=404, detail="Scope tidak tersedia untuk membership."
                )
        await connection.execute(
            text("""
                insert into public.membership_roles(
                  membership_id,role_id,assigned_by,scope_type,scope_id,valid_from,valid_until
                ) values (
                  :membership_id,:role_id,:actor,:scope_type,:scope_id,now(),:valid_until
                )
                on conflict(membership_id,role_id) do update set
                  assigned_by=excluded.assigned_by,scope_type=excluded.scope_type,
                  scope_id=excluded.scope_id,valid_from=excluded.valid_from,
                  valid_until=excluded.valid_until,assigned_at=now()
            """),
            {
                "membership_id": membership_id,
                "role_id": role_id,
                "actor": UUID(claims["sub"]),
                "scope_type": payload.scope_type,
                "scope_id": payload.scope_id,
                "valid_until": payload.valid_until,
            },
        )
        await _audit(
            connection,
            request,
            UUID(claims["sub"]),
            tenant_id,
            "membership.role.assigned",
            "membership",
            membership_id,
            {"role_key": role_key, "scope_type": payload.scope_type},
        )
    return {
        "membership_id": str(membership_id),
        "role_key": role_key,
        "scope_type": payload.scope_type,
        "scope_id": payload.scope_id,
    }


class BranchUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    code: str | None = Field(default=None, min_length=2, max_length=40, pattern="^[A-Z0-9][A-Z0-9_-]*$")
    organization_unit_id: UUID | None = None
    status: str | None = Field(default=None, pattern="^(active|inactive|archived)$")


class DepartmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    code: str | None = Field(default=None, min_length=2, max_length=40, pattern="^[A-Z0-9][A-Z0-9_-]*$")
    branch_id: UUID | None = None
    parent_department_id: UUID | None = None
    status: str | None = Field(default=None, pattern="^(active|inactive|archived)$")


@router.patch("/{tenant_id}/branches/{branch_id}", tags=["Organization"])
async def update_branch(
    tenant_id: UUID,
    branch_id: UUID,
    payload: BranchUpdate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    values = {key: value for key, value in payload.model_dump(exclude_unset=True).items()}
    if not values:
        raise HTTPException(status_code=422, detail="No branch changes supplied.")
    async with engine.begin() as connection:
        current = await connection.execute(
            text("""
                select id,tenant_id,organization_id,organization_unit_id,status
                from public.branches
                where id=:id and tenant_id=:tenant_id
                for update
            """),
            {"id": branch_id, "tenant_id": tenant_id},
        )
        branch = current.mappings().first()
        if branch is None:
            raise HTTPException(status_code=404, detail="Branch not found.")
        if context is not None:
            authorize_object(
                context, resource_tenant_id=tenant_id,
                organization_id=branch["organization_id"],
                organization_unit_id=branch["organization_unit_id"],
                branch_id=branch_id,
            )
        if "organization_unit_id" in values and values["organization_unit_id"] is not None:
            unit = await connection.execute(
                text("""
                    select 1 from public.organization_units
                    where id=:unit_id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {"unit_id": values["organization_unit_id"], "tenant_id": tenant_id,
                 "organization_id": branch["organization_id"]},
            )
            if unit.scalar_one_or_none() is None:
                raise HTTPException(status_code=404, detail="Active organization unit not found in this branch scope.")
        if values.get("status") == "archived":
            dependencies = await connection.execute(
                text("""
                    select
                      exists(select 1 from public.departments
                        where tenant_id=:tenant_id and branch_id=:branch_id and status='active')
                      or exists(select 1 from public.memberships
                        where tenant_id=:tenant_id and branch_id=:branch_id and status='active')
                """),
                {"tenant_id": tenant_id, "branch_id": branch_id},
            )
            if dependencies.scalar_one():
                raise HTTPException(status_code=409, detail="Archive active departments and memberships before archiving this branch.")
        assignments = ", ".join(f"{key}=:{key}" for key in values)
        result = await connection.execute(
            text(f"""
                update public.branches set {assignments},updated_by=:actor,updated_at=now()
                where id=:id and tenant_id=:tenant_id
                returning id,tenant_id,organization_id,organization_unit_id,name,code,status,updated_at
            """),
            {**values, "actor": UUID(claims["sub"]), "id": branch_id, "tenant_id": tenant_id},
        )
        updated = dict(result.mappings().one())
        await _audit(connection, request, UUID(claims["sub"]), tenant_id,
                      "branch.updated", "branch", branch_id, values)
    return updated


@router.patch("/{tenant_id}/departments/{department_id}", tags=["Organization"])
async def update_department(
    tenant_id: UUID,
    department_id: UUID,
    payload: DepartmentUpdate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    values = {key: value for key, value in payload.model_dump(exclude_unset=True).items()}
    if not values:
        raise HTTPException(status_code=422, detail="No department changes supplied.")
    async with engine.begin() as connection:
        current = await connection.execute(
            text("""
                select id,tenant_id,organization_id,branch_id,parent_department_id,status
                from public.departments
                where id=:id and tenant_id=:tenant_id
                for update
            """),
            {"id": department_id, "tenant_id": tenant_id},
        )
        department = current.mappings().first()
        if department is None:
            raise HTTPException(status_code=404, detail="Department not found.")
        if context is not None:
            authorize_object(
                context, resource_tenant_id=tenant_id,
                organization_id=department["organization_id"],
                branch_id=department["branch_id"],
                department_id=department_id,
            )
        target_branch = values.get("branch_id", department["branch_id"])
        if target_branch is not None:
            branch = await connection.execute(
                text("""
                    select 1 from public.branches
                    where id=:branch_id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {"branch_id": target_branch, "tenant_id": tenant_id,
                 "organization_id": department["organization_id"]},
            )
            if branch.scalar_one_or_none() is None:
                raise HTTPException(status_code=404, detail="Active branch not found in this organization.")
        if "parent_department_id" in values and values["parent_department_id"] is not None:
            parent_id = values["parent_department_id"]
            parent = await connection.execute(
                text("""
                    select id,branch_id from public.departments
                    where id=:parent_id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {"parent_id": parent_id, "tenant_id": tenant_id,
                 "organization_id": department["organization_id"]},
            )
            parent_row = parent.mappings().first()
            if parent_row is None or parent_row["branch_id"] != target_branch:
                raise HTTPException(status_code=404, detail="Parent department is outside the active hierarchy.")
            descendants = await connection.execute(
                text("""
                    with recursive descendants(id) as (
                      select id from public.departments
                      where id=:department_id and tenant_id=:tenant_id
                      union all
                      select d.id from public.departments d
                      join descendants x on d.parent_department_id=x.id
                      where d.tenant_id=:tenant_id
                    )
                    select exists(select 1 from descendants where id=:parent_id)
                """),
                {"department_id": department_id, "tenant_id": tenant_id, "parent_id": parent_id},
            )
            if descendants.scalar_one():
                raise HTTPException(status_code=409, detail="Department parent change would create a hierarchy cycle.")
        if values.get("status") == "archived":
            dependencies = await connection.execute(
                text("""
                    select
                      exists(select 1 from public.departments
                        where tenant_id=:tenant_id and parent_department_id=:department_id and status='active')
                      or exists(select 1 from public.memberships
                        where tenant_id=:tenant_id and department_id=:department_id and status='active')
                """),
                {"tenant_id": tenant_id, "department_id": department_id},
            )
            if dependencies.scalar_one():
                raise HTTPException(status_code=409, detail="Archive child departments and memberships before archiving this department.")
        assignments = ", ".join(f"{key}=:{key}" for key in values)
        result = await connection.execute(
            text(f"""
                update public.departments set {assignments},updated_by=:actor,updated_at=now()
                where id=:id and tenant_id=:tenant_id
                returning id,tenant_id,organization_id,branch_id,parent_department_id,name,code,status,updated_at
            """),
            {**values, "actor": UUID(claims["sub"]), "id": department_id, "tenant_id": tenant_id},
        )
        updated = dict(result.mappings().one())
        await _audit(connection, request, UUID(claims["sub"]), tenant_id,
                      "department.updated", "department", department_id, values)
    return updated


@router.post("/{tenant_id}/branches/{branch_id}/archive", tags=["Organization"])
async def archive_branch(
    tenant_id: UUID, branch_id: UUID, request: Request,
    claims: dict = claims_dependency, session: AsyncSession = session_dependency,
):
    return await update_branch(
        tenant_id, branch_id, BranchUpdate(status="archived"), request, claims, session
    )


@router.post("/{tenant_id}/branches/{branch_id}/restore", tags=["Organization"])
async def restore_branch(
    tenant_id: UUID, branch_id: UUID, request: Request,
    claims: dict = claims_dependency, session: AsyncSession = session_dependency,
):
    return await update_branch(
        tenant_id, branch_id, BranchUpdate(status="active"), request, claims, session
    )


@router.post("/{tenant_id}/departments/{department_id}/archive", tags=["Organization"])
async def archive_department(
    tenant_id: UUID, department_id: UUID, request: Request,
    claims: dict = claims_dependency, session: AsyncSession = session_dependency,
):
    return await update_department(
        tenant_id, department_id, DepartmentUpdate(status="archived"), request, claims, session
    )


@router.post("/{tenant_id}/departments/{department_id}/restore", tags=["Organization"])
async def restore_department(
    tenant_id: UUID, department_id: UUID, request: Request,
    claims: dict = claims_dependency, session: AsyncSession = session_dependency,
):
    return await update_department(
        tenant_id, department_id, DepartmentUpdate(status="active"), request, claims, session
    )
