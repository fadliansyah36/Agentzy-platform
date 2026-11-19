"""Persistence boundary for authenticated identity and session records."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.db.session import engine


async def list_user_session_records(user_id):
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select s.id,s.created_at,s.updated_at,s.refreshed_at,s.not_after,s.aal,
                       left(regexp_replace(coalesce(s.user_agent,''),'[[:cntrl:]]','','g'),180)
                         as user_agent,
                       r.revoked_at
                from auth.sessions s
                left join public.revoked_sessions r on r.session_id=s.id
                where s.user_id=:user_id
                  and (s.not_after is null or s.not_after > now())
                order by s.updated_at desc nulls last,s.created_at desc
            """),
            {"user_id": user_id},
        )
        return [dict(row) for row in result.mappings().all()]


async def lock_user_session(connection: AsyncConnection, user_id, session_id):
    result = await connection.execute(
        text("""
            select id,not_after from auth.sessions
            where id=:session_id and user_id=:user_id
            for update
        """),
        {"session_id": session_id, "user_id": user_id},
    )
    return result.mappings().first()


async def revoke_session_record(
    connection: AsyncConnection,
    *,
    user_id,
    session_id,
    not_after,
    request_id: str | None,
) -> None:
    await connection.execute(
        text("""
            insert into public.revoked_sessions(
              session_id,user_id,revoked_at,expires_at,reason,request_id
            ) values(
              :session_id,:user_id,now(),
              coalesce(:not_after,'infinity'::timestamptz),
              'user_requested_session_revocation',:request_id
            )
            on conflict(session_id) do update
              set revoked_at=excluded.revoked_at,
                  expires_at=excluded.expires_at,
                  reason=excluded.reason,
                  request_id=excluded.request_id
        """),
        {
            "session_id": session_id,
            "user_id": user_id,
            "not_after": not_after,
            "request_id": request_id,
        },
    )


async def write_session_revocation_audit(
    connection: AsyncConnection,
    *,
    user_id,
    session_id,
    request_id: str | None,
) -> None:
    await connection.execute(
        text("""
            insert into public.audit_logs(
              actor_user_id,action,resource_type,resource_id,request_id,metadata
            ) values(
              :actor,'auth.session.revoked','auth_session',:session_id,:request_id,
              jsonb_build_object('scope','single_session')
            )
        """),
        {
            "actor": user_id,
            "session_id": str(session_id),
            "request_id": request_id,
        },
    )
