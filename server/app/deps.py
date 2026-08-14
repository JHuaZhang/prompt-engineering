from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token, is_token_blacklisted
from app.database import get_db
from app.main import BizError
from app.models.user import User


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise BizError(401, "未登录")

    token = authorization.removeprefix("Bearer ").strip()

    if is_token_blacklisted(token):
        raise BizError(401, "token 已失效")

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise BizError(401, "token 无效或已过期")

    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise BizError(401, "用户不存在")

    return user


async def require_active_token(
    user: User = Depends(get_current_user),
) -> User:
    """Reject temp tokens — only allow fully authenticated active users."""
    if user.status != "active":
        raise BizError(403, "请先完成密码设置")
    return user


async def require_temp_token(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Only allow temp tokens (for setup / reset-password)."""
    if not authorization.startswith("Bearer "):
        raise BizError(401, "未登录")

    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_token(token)

    if not payload or "scope" not in payload:
        raise BizError(401, "token 无效或已过期")

    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise BizError(401, "用户不存在")

    return user
