from datetime import datetime
from typing import Literal
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


class AuthSessionRead(BaseModel):
    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    refreshed_at: datetime | None = None
    not_after: datetime | None = None
    aal: str | None = None
    user_agent: str | None = None
    is_current: bool
    is_revoked: bool
    revoked_at: datetime | None = None


class AuthSessionPageMeta(BaseModel):
    current_session_id: UUID
    active_count: int = Field(ge=0)


class AuthSessionPage(BaseModel):
    data: list[AuthSessionRead]
    meta: AuthSessionPageMeta


class AuthSessionRevocationRead(BaseModel):
    status: Literal["revoked"]
    session_id: UUID
    current_session_revoked: bool
