from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.database import get_db
from app.deps import require_active_token
from app.models.user import User
from app.schemas.user import CreateUserRequest, UpdateRoleRequest
from app.services.user_service import UserService

router = APIRouter(tags=["users"])


@router.get("/users")
async def list_users(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    users = await service.list_users()
    return {"code": 0, "data": users, "message": "success"}


@router.post("/users")
async def create_user(
    data: CreateUserRequest,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    result = await service.create_user(data.email, current_user.email)
    return {"code": 0, "data": result, "message": "success"}


@router.put("/users/{user_id}/role")
async def update_role(
    user_id: int,
    data: UpdateRoleRequest,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    result = await service.update_role(user_id, data.role, current_user)
    return {"code": 0, "data": result, "message": "success"}


@router.post("/users/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    await service.reset_user_password(user_id, current_user)
    return {"code": 0, "data": None, "message": "密码已重置为 123456"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    await service.delete_user(user_id, current_user)
    return {"code": 0, "data": None, "message": "删除成功"}
