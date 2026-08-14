from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mysql+aiomysql://root:root@localhost:3306/prompt_platform?charset=utf8mb4"

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24h

    # Temp token (for setup / reset-password)
    TEMP_TOKEN_EXPIRE_MINUTES: int = 30

    # Default password for new users and password reset
    DEFAULT_PASSWORD: str = "123456"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
