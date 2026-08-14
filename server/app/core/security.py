from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_token(user_id: int, role: str, status: str = "active") -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "role": role,
        "status": status,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_temp_token(
    user_id: int, status: str, scope: str
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.TEMP_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "status": status,
        "scope": scope,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return {}


# In-memory token blacklist for logout
_blacklist: set[str] = set()


def blacklist_token(token: str) -> None:
    _blacklist.add(token)


def is_token_blacklisted(token: str) -> bool:
    return token in _blacklist
