from fastapi import APIRouter, Body, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.database import get_db
from app.deps import get_current_user, require_temp_token
from app.main import BizError
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    ResetPasswordRequest,
    SetupRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(tags=["auth"])


@router.post("/auth/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.login(data.email, data.password)


@router.post("/auth/setup")
async def setup(
    data: SetupRequest,
    user: User = Depends(require_temp_token),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    result = await service.setup_account(user.id, data.username, data.password)
    return {"code": 0, "data": result, "message": "success"}


@router.post("/auth/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    user: User = Depends(require_temp_token),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    result = await service.reset_password(user.id, data.new_password)
    return {"code": 0, "data": result, "message": "success"}


@router.get("/auth/profile")
async def profile(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.get_profile(user.id)
    return {"code": 0, "data": result, "message": "success"}


@router.post("/auth/logout")
async def logout(
    user: User = Depends(get_current_user),
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    token = authorization.removeprefix("Bearer ").strip()
    service = AuthService(db)
    await service.logout(token)
    return {"code": 0, "data": None, "message": "success"}
