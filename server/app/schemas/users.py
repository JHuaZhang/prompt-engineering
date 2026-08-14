from datetime import datetime

from pydantic import BaseModel, EmailStr


class CreateUserRequest(BaseModel):
    email: EmailStr


class UpdateRoleRequest(BaseModel):
    role: str  # "user" | "admin" | "root"


class UserListItemVO(BaseModel):
    id: int
    email: str
    username: str | None = None
    role: str
    status: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
