from enum import IntEnum

from fastapi import Depends

from app.deps import get_current_user
from app.main import BizError
from app.models.user import User


class RoleLevel(IntEnum):
    ROOT = 3
    ADMIN = 2
    USER = 1


ROLE_MAP = {
    "root": RoleLevel.ROOT,
    "admin": RoleLevel.ADMIN,
    "user": RoleLevel.USER,
}


def require_role(min_role: str):
    """Dependency: ensure current user has at least min_role level."""

    async def _check(user: User = Depends(get_current_user)) -> User:
        user_level = ROLE_MAP.get(user.role, 0)
        required_level = ROLE_MAP[min_role]
        if user_level < required_level:
            raise BizError(403, "无权限")
        return user

    return _check


def check_not_self(current_user: User, target_user_id: int) -> None:
    if current_user.id == target_user_id:
        raise BizError(400, "无法操作自己的账户")


def check_can_operate_target(current_user: User, target_user: User) -> None:
    """Ensure current user can operate on target user based on role hierarchy."""
    current_level = ROLE_MAP.get(current_user.role, 0)
    target_level = ROLE_MAP.get(target_user.role, 0)

    # Nobody can operate on root except root themselves (and not on self for reset/delete)
    if target_user.role == "root":
        raise BizError(403, "无法操作 root 用户")

    # Admin can only operate on users with lower privilege
    if current_level <= target_level:
        raise BizError(403, "无法操作同级或更高权限用户")
