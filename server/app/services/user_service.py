from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.permissions import ROLE_MAP, RoleLevel, check_can_operate_target, check_not_self
from app.core.security import hash_password
from app.main import BizError
from app.models.user import User


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_users(self) -> list[dict]:
        result = await self.session.execute(
            select(User).order_by(User.created_at.desc())
        )
        users = result.scalars().all()
        return [
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "role": u.role,
                "status": u.status,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]

    async def create_user(self, email: str, created_by: str) -> dict:
        existing = await self.session.execute(
            select(User).where(User.email == email)
        )
        if existing.scalar_one_or_none() is not None:
            raise BizError(409, "邮箱已存在")

        user = User(
            email=email,
            username=None,
            password_hash=hash_password(settings.DEFAULT_PASSWORD),
            role="user",
            status="pending_setup",
            created_by=created_by,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)

        return {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "status": user.status,
        }

    async def update_role(
        self, target_id: int, new_role: str, current_user: User
    ) -> dict:
        if new_role not in ("root", "admin", "user"):
            raise BizError(400, "无效的角色")

        result = await self.session.execute(
            select(User).where(User.id == target_id)
        )
        target = result.scalar_one_or_none()
        if target is None:
            raise BizError(404, "用户不存在")

        current_level = ROLE_MAP.get(current_user.role, 0)

        # Nobody can change root's role
        if target.role == "root":
            raise BizError(403, "root 角色不可变更")

        # Only root can grant root role
        if new_role == "root" and current_user.role != "root":
            raise BizError(403, "无权授予 root 角色")

        # Admin can only switch between user and admin
        if current_user.role == "admin" and new_role == "admin":
            # admin promoting user to admin — allowed
            if target.role == "root":
                raise BizError(403, "无法操作 root 用户")
        elif current_user.role == "admin" and new_role == "user":
            # admin demoting admin to user — allowed
            if target.role == "root":
                raise BizError(403, "无法操作 root 用户")
            if target.role == "admin":
                raise BizError(403, "无法操作同级或更高权限用户")

        target.role = new_role
        await self.session.commit()
        await self.session.refresh(target)

        return {
            "id": target.id,
            "email": target.email,
            "username": target.username,
            "role": target.role,
        }

    async def reset_user_password(
        self, target_id: int, current_user: User
    ) -> None:
        check_not_self(current_user, target_id)

        result = await self.session.execute(
            select(User).where(User.id == target_id)
        )
        target = result.scalar_one_or_none()
        if target is None:
            raise BizError(404, "用户不存在")

        check_can_operate_target(current_user, target)

        target.password_hash = hash_password(settings.DEFAULT_PASSWORD)
        target.status = "password_reset"
        await self.session.commit()

    async def delete_user(self, target_id: int, current_user: User) -> None:
        check_not_self(current_user, target_id)

        result = await self.session.execute(
            select(User).where(User.id == target_id)
        )
        target = result.scalar_one_or_none()
        if target is None:
            raise BizError(404, "用户不存在")

        check_can_operate_target(current_user, target)

        await self.session.delete(target)
        await self.session.commit()
