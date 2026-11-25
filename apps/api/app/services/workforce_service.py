"""Application services for Human Workforce lifecycle rules."""

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def assert_activation_prerequisites(
    connection: AsyncConnection, tenant_id: UUID, profile_id: UUID
) -> None:
    incomplete_tasks = await connection.execute(
        text(
            """
            select count(*) from public.workforce_onboarding_tasks
            where tenant_id=:tenant and workforce_profile_id=:profile
              and required and status not in ('completed','waived')
            """
        ),
        {"tenant": tenant_id, "profile": profile_id},
    )
    if incomplete_tasks.scalar_one() > 0:
        raise HTTPException(
            status_code=409, detail="Onboarding checklist wajib belum selesai."
        )

    active_engagement = await connection.execute(
        text(
            """
            select exists(
              select 1 from public.workforce_engagements
              where tenant_id=:tenant and workforce_profile_id=:profile and status='active'
            )
            """
        ),
        {"tenant": tenant_id, "profile": profile_id},
    )
    if not active_engagement.scalar_one():
        raise HTTPException(
            status_code=409, detail="Engagement agreement aktif belum tersedia."
        )

    required_training = await connection.execute(
        text(
            """
            select count(*) from public.workforce_training_courses c
            where c.status='published' and (c.tenant_id is null or c.tenant_id=:tenant)
              and coalesce(c.eligibility_rules->>'required_for_activation','false')='true'
              and not exists(
                select 1 from public.workforce_training_enrollments e
                where e.tenant_id=:tenant and e.workforce_profile_id=:profile and e.course_id=c.id
                  and e.status='completed'
                  and (e.certificate_expires_at is null or e.certificate_expires_at>=now())
              )
            """
        ),
        {"tenant": tenant_id, "profile": profile_id},
    )
    if required_training.scalar_one() > 0:
        raise HTTPException(
            status_code=409,
            detail="Training wajib untuk eligibility belum selesai atau sudah kedaluwarsa.",
        )


async def assert_offboarding_ready(
    connection: AsyncConnection, tenant_id: UUID, profile_id: UUID
) -> None:
    active_assignments = await connection.execute(
        text(
            """
            select count(*) from public.workforce_assignments
            where tenant_id=:tenant and workforce_profile_id=:profile
              and status in ('scheduled','active')
            """
        ),
        {"tenant": tenant_id, "profile": profile_id},
    )
    active_engagements = await connection.execute(
        text(
            """
            select count(*) from public.workforce_engagements
            where tenant_id=:tenant and workforce_profile_id=:profile
              and status in ('active','suspended','pending')
            """
        ),
        {"tenant": tenant_id, "profile": profile_id},
    )
    if active_assignments.scalar_one() > 0 or active_engagements.scalar_one() > 0:
        raise HTTPException(
            status_code=409,
            detail="Offboarding readiness gagal: assignment dan engagement harus ditutup terlebih dahulu.",
        )
