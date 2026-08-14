# Prompt Engineering Platform - Backend

FastAPI + SQLAlchemy(async) + MySQL 后端服务。

## 技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| FastAPI | 0.111.0 | Web 框架 |
| Uvicorn | 0.30.1 | ASGI 服务器 |
| SQLAlchemy | 2.0.30 | ORM (async) |
| aiomysql | 0.2.0 | MySQL 异步驱动 |
| Alembic | 1.13.1 | 数据库迁移 |
| passlib[bcrypt] | 1.7.4 | 密码哈希 |
| python-jose | 3.3.0 | JWT Token |
| pydantic-settings | 2.2.1 | 配置管理 |

## 环境要求

- Python >= 3.11
- MySQL >= 8.0

## 快速启动

### 1. 安装依赖

```bash
cd server
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，按需修改：

```env
# 数据库连接
DATABASE_URL=mysql+aiomysql://root:root@localhost:3306/prompt_platform?charset=utf8mb4

# JWT 密钥（生产环境务必修改）
JWT_SECRET_KEY=change-me-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# 临时 Token 有效期（用于首次设置/重置密码流程）
TEMP_TOKEN_EXPIRE_MINUTES=30

# 新用户初始密码 & 重置密码默认值
DEFAULT_PASSWORD=123456

# CORS 允许的前端地址
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. 创建数据库

在 MySQL 中创建数据库：

```sql
CREATE DATABASE prompt_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 执行数据库迁移

```bash
alembic upgrade head
```

这会创建 `users` 表，包含以下字段：
- `id` BIGINT 主键
- `email` VARCHAR(128) 唯一索引
- `username` VARCHAR(64) 唯一索引，可为 NULL
- `password_hash` VARCHAR(255)
- `role` ENUM('root', 'admin', 'user')
- `status` ENUM('pending_setup', 'active', 'password_reset')
- `created_by` VARCHAR(64)
- `created_at` / `updated_at` DATETIME

### 5. 创建超级管理员 (root)

系统没有默认管理员，需要手动创建 root 用户：

```bash
python -m scripts.create_root --email root@prompt.dev --username root --password your_secure_password
```

创建完成后即可用该账号登录系统。

### 6. 启动服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

服务启动后：
- API 地址：http://localhost:8000
- API 文档 (Swagger)：http://localhost:8000/docs
- 健康检查：http://localhost:8000/api/v1/health

## 目录结构

```
server/
├── .env.example          # 环境变量模板
├── alembic.ini            # Alembic 配置
├── requirements.txt       # Python 依赖
├── README.md
├── alembic/
│   ├── env.py             # Alembic 迁移环境
│   └── versions/
│       └── 0001_create_users_table.py   # 初始迁移
├── app/
│   ├── __init__.py
│   ├── main.py            # FastAPI 应用入口
│   ├── config.py           # 配置 (pydantic-settings)
│   ├── database.py         # 异步数据库引擎 & Session
│   ├── deps.py             # 依赖注入 (当前用户、DB Session)
│   ├── core/
│   │   ├── security.py     # 密码哈希、JWT 签发与验证
│   │   └── permissions.py  # 角色权限校验
│   ├── models/
│   │   └── user.py         # User ORM 模型
│   ├── schemas/
│   │   ├── auth.py         # 认证相关 Pydantic 模型
│   │   └── user.py         # 用户管理相关 Pydantic 模型
│   ├── services/
│   │   ├── auth_service.py # 认证业务逻辑
│   │   └── user_service.py # 用户管理业务逻辑
│   └── routers/
│       ├── auth.py         # /api/v1/auth/*
│       └── users.py        # /api/v1/users/*
└── scripts/
    └── create_root.py       # 创建 root 用户 CLI
```

## API 接口

### 认证接口 (/api/v1/auth)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/login` | 登录 | 无 |
| POST | `/auth/setup` | 首次设置用户名和密码 | Temp Token |
| POST | `/auth/reset-password` | 重置密码后设置新密码 | Temp Token |
| GET  | `/auth/profile` | 获取当前用户信息 | JWT |
| POST | `/auth/logout` | 登出 | JWT |

#### 登录响应说明

```json
// 正常登录 (code=0)
{
  "code": 0,
  "data": { "token": "jwt-xxx", "user": { ... } },
  "message": "success"
}

// 需要首次设置 (code=1001) → 前端跳转 /setup
{
  "code": 1001,
  "data": { "temp_token": "temp-jwt-xxx" },
  "message": "请设置用户名和密码"
}

// 需要重置密码 (code=1002) → 前端跳转 /reset-password
{
  "code": 1002,
  "data": { "temp_token": "temp-jwt-xxx" },
  "message": "密码已被重置，请设置新密码"
}

// 认证失败 (code=401)
{
  "code": 401,
  "data": null,
  "message": "邮箱或密码错误"
}
```

### 用户管理接口 (/api/v1/users)

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET   | `/users` | 用户列表 | admin+ |
| POST  | `/users` | 创建用户（邮箱） | admin+ |
| PUT   | `/users/{id}/role` | 修改用户角色 | admin+ |
| POST  | `/users/{id}/reset-password` | 重置用户密码 | admin+ |
| DELETE| `/users/{id}` | 删除用户 | admin+ |

### 角色权限矩阵

| 操作 | root | admin | user |
|------|------|-------|------|
| 创建用户 | 全部 | 仅 user 角色 | - |
| 删除用户 | 全部 | 仅 user 角色 | - |
| 重置密码 | 全部 | 仅 user 角色 | - |
| 修改角色 | 全部 | user <-> admin | - |
| 查看用户列表 | Y | Y | - |

> admin 不能操作 root 和其他 admin 的账户。

## 用户体系说明

### 用户状态流转

```
                ┌──────────────────────────────────┐
                │                                  │
 SQL 手动创建    ▼     登录(初始密码)    ┌──────────────────┐
 (create_root) ┌────────┐ ──────────────▶ │ pending_setup    │
               │  root  │                 │ (待设置用户名密码) │
               │ active │                 └────────┬─────────┘
               └────────┘                          │ POST /setup
                   │                               ▼
                   │                          ┌──────────┐
                   │  ◀─────────────────────  │  active   │
                   │                          │  (活跃)    │
                   │                          └────┬─────┘
                   │                               │ admin 重置密码
                   │                               ▼
                   │                          ┌──────────────────┐
                   │                          │ password_reset   │
                   │                          │ (待重设密码)       │
                   │                          └────────┬─────────┘
                   │                                   │ 登录 → POST /reset-password
                   │                                   ▼
                   └──────────────────────────── ───  active
```

### 新用户创建流程

1. 管理员通过 `/users` POST 传入邮箱创建用户
2. 系统自动设置初始密码为 `DEFAULT_PASSWORD`（默认 `123456`），状态为 `pending_setup`
3. 用户使用邮箱 + 初始密码登录 → API 返回 `code=1001` + `temp_token`
4. 前端跳转到 `/setup` 页面，用户设置用户名和新密码
5. 设置完成后状态变为 `active`，返回正式 JWT

### 密码重置流程

1. 管理员调用 `/users/{id}/reset-password`，密码重置为 `123456`，状态变为 `password_reset`
2. 用户登录 → API 返回 `code=1002` + `temp_token`
3. 前端跳转到 `/reset-password` 页面，用户设置新密码
4. 设置完成后状态恢复为 `active`

## 前端联调

前端项目位于 `../web`，默认运行在 `http://localhost:5173`。

启动前端：
```bash
cd ../web
npm install
npm run dev
```

确保 `.env` 中 `CORS_ORIGINS` 包含前端地址。

如果前端要使用 Mock 模式（不连后端）：
```bash
npm run mock
```

## 常用命令

```bash
# 启动后端（开发模式，热重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 执行数据库迁移
alembic upgrade head

# 回滚上一个迁移
alembic downgrade -1

# 查看当前迁移版本
alembic current

# 创建 root 用户
python -m scripts.create_root --email <email> --username <name> --password <pwd>

# 安装依赖
pip install -r requirements.txt
```
