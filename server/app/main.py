from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Prompt Engineering Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
from app.routers.auth import router as auth_router  # noqa: E402
from app.routers.users import router as users_router  # noqa: E402

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")


# Unified error response helper
class BizError(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message


@app.exception_handler(BizError)
async def biz_error_handler(request: Request, exc: BizError):
    return JSONResponse(
        status_code=200,
        content={"code": exc.code, "data": None, "message": exc.message},
    )


@app.get("/api/v1/health")
async def health():
    return {"code": 0, "data": "ok", "message": "success"}
