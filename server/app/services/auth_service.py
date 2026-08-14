from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    blacklist_token,
    create_temp_token,
    create_token,
    hash_password,
    verify_password,
)
from app.main import BizError
from app.models.user import User


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def login(self, email: str, password: str) -> dict:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if user is None or not verify_password(password, user.password_hash):
            raise BizError(401, "邮箱或密码错误")

        if user.status == "pending_setup":
            temp_token = create_temp_token(
                user.id, "pending_setup", "setup"
            )
            return {
                "code": 1001,
                "data": {"temp_token": temp_token},
                "message": "首次登录，请设置用户名和密码",
            }

        if user.status == "password_reset":
            temp_token = create_temp_token(
                user.id, "password_reset", "reset_password"
            )
            return {
                "code": 1002,
                "data": {"temp_token": temp_token},
                "message": "密码已被重置，请设置新密码",
            }

        # status == "active"
        token = create_token(user.id, user.role, user.status)
        return {
            "code": 0,
            "data": {
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "role": user.role,
                    "status": user.status,
                },
            },
            "message": "success",
        }

    async def setup_account(self, user_id: int, username: str, password: str) -> dict:
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise BizError(404, "用户不存在")

        if user.status != "pending_setup":
            raise BizError(400, "当前状态不允许设置用户名")

        # Check username uniqueness
        existing = await self.session.execute(
            select(User).where(User.username == username)
        )
        if existing.scalar_one_or_none() is not None:
            raise BizError(409, "用户名已存在")

        user.username = username
        user.password_hash = hash_password(password)
        user.status = "active"
        await self.session.commit()
        await self.session.refresh(user)

        token = create_token(user.id, user.role, user.status)
        return {
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "status": user.status,
            },
        }

    async def reset_password(self, user_id: int, new_password: str) -> dict:
        from app.config import settings

        if new_password == settings.DEFAULT_PASSWORD:
            raise BizError(400, "新密码不能与默认密码相同")

        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise BizError(404, "用户不存在")

        if user.status != "password_reset":
            raise BizError(400, "当前状态不允许重置密码")

        user.password_hash = hash_password(new_password)
        user.status = "active"
        await self.session.commit()
        await self.session.refresh(user)

        token = create_token(user.id, user.role, user.status)
        return {
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "status": user.status,
            },
        }

    async def get_profile(self, user_id: int) -> dict:
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise BizError(404, "用户不存在")

        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "status": user.status,
        }

    async def logout(self, token: str) -> None:
        blacklist_token(token)
