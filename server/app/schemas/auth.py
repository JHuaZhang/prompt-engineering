from datetime import datetime

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SetupRequest(BaseModel):
    username: str
    password: str


class ResetPasswordRequest(BaseModel):
    new_password: str


class UserVO(BaseModel):
    id: int
    email: str
    username: str | None = None
    role: str
    status: str
    avatar: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ApiResponse(BaseModel):
    code: int = 0
    data: dict | list | None = None
    message: str = "success"
