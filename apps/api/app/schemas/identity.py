from uuid import UUID

from pydantic import BaseModel, Field


class MembershipRead(BaseModel):
    id: UUID
    tenant_id: UUID
    tenant_name: str
    organization_id: UUID | None = None
    organization_unit_id: UUID | None = None
    branch_id: UUID | None = None
    department_id: UUID | None = None
    role_keys: list[str] = Field(default_factory=list)
    permissions: list[str] = Field(default_factory=list)
    status: str


class IdentityRead(BaseModel):
    user_id: UUID
    email: str | None = None
    display_name: str | None = None
    memberships: list[MembershipRead] = Field(default_factory=list)


class TenantRead(BaseModel):
    id: UUID
    name: str
    slug: str
    status: str
    membership_status: str


class OrganizationRead(BaseModel):
    id: UUID
    tenant_id: UUID
    parent_id: UUID | None = None
    name: str
    slug: str
    organization_type: str
    status: str
