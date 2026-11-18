import json
from collections.abc import AsyncIterator
from typing import Any
from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import get_settings
from app.core.security import current_claims

settings = get_settings()
engine = create_async_engine(settings.database_url, pool_pre_ping=True, pool_size=5, max_overflow=10)
SessionFactory = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)
current_claims_dependency = Depends(current_claims)


async def user_session(claims: dict[str, Any] = current_claims_dependency) -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        async with session.begin():
            await session.execute(text("SET LOCAL ROLE authenticated"))
            await session.execute(text("select set_config('request.jwt.claims', :claims, true)"),
                                  {"claims": json.dumps(claims)})
            await session.execute(text("select set_config('request.jwt.claim.sub', :subject, true)"),
                                  {"subject": str(claims["sub"])})
            yield session
