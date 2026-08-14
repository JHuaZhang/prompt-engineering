## Context

前端登录页已搭建完成（`web/src/pages/Login/`），使用 Mock API 运行。后端 `server/` 目录尚未创建。`docs/database.sql` 中 users 表原计划在 Phase 4，现提前到 Phase 1。本设计覆盖 FastAPI 后端骨架搭建 + 用户认证全流程 + 用户管理功能。

## Goals / Non-Goals

**Goals:**
- 搭建 FastAPI 三层架构后端骨架（配置、数据库、迁移、路由）
- 实现 users 表及完整的用户认证流程（登录、首次设置、密码重置、Token 鉴权）
- 实现用户管理 CRUD（创建、角色修改、重置密码、删除）
- 实现前端配套页面（Setup、ResetPassword、UserManagement）

**Non-Goals:**
- 邮件发送功能（新建用户不自动发邮件，由管理员口头/其他渠道通知）
- 密码强度策略（仅限制长度 6-128，不强制大小写/特殊字符）
- OAuth/SSO 第三方登录
- 用户操作审计日志

## Decisions

### 1. 后端目录结构 —— 三层架构

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── config.py               # Pydantic Settings 配置
│   ├── database.py             # async SQLAlchemy engine + session
│   ├── deps.py                 # 依赖注入（get_db, get_current_user）
│   ├── models/                 # SQLAlchemy ORM 模型
│   │   ├── __init__.py
│   │   └── user.py
│   ├── schemas/                # Pydantic 请求/响应模型
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── user.py
│   ├── services/               # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   └── user_service.py
│   ├── routers/                # API 路由层
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── users.py
│   └── core/                   # 安全/工具
│       ├── __init__.py
│       ├── security.py         # bcrypt + JWT
│       └── permissions.py      # 角色权限校验
├── alembic/                    # 数据库迁移
│   ├── env.py
│   └── versions/
├── scripts/
│   └── create_root.py          # CLI: 创建 root 用户
├── alembic.ini
├── requirements.txt
└── .env.example
```

**为什么选三层架构**：与前端三层（api → store → pages）对应。routers 只做参数解析和调用 service，services 封装业务逻辑，models 定义数据结构。后续模块（模板管理、模型对比）可复用此架构。

### 2. users 表设计

```sql
CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(128) NOT NULL,
  `username` VARCHAR(64) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('root','admin','user') NOT NULL DEFAULT 'user',
  `status` ENUM('pending_setup','active','password_reset') NOT NULL DEFAULT 'pending_setup',
  `created_by` VARCHAR(64) NOT NULL DEFAULT 'system',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**关键决策**：
- `username` 可空（pending_setup 时未设置），设唯一索引防止重名
- `password_hash` 不可空 —— 即使 pending_setup 状态也有 123456 的 hash
- `status` 三态：pending_setup → active → (password_reset) → active

### 3. JWT Token 策略

| Token 类型 | 触发场景 | Payload | 有效期 | 权限范围 |
|-----------|---------|---------|--------|---------|
| 完整 token | active 用户正常登录 | `{sub, role, status: "active"}` | 24h | 角色权限范围内全部 API |
| temp_token (setup) | pending_setup 用户登录 | `{sub, status: "pending_setup", scope: "setup"}` | 30min | 仅 /auth/setup |
| temp_token (reset) | password_reset 用户登录 | `{sub, status: "password_reset", scope: "reset_password"}` | 30min | 仅 /auth/reset-password |

**为什么不用同一个 token + 后端拦截**：temp_token 与完整 token 的权限差异是质变不是量变。用 scope 字段在依赖注入层拦截，避免每个接口都写 status 检查。

**Alternatives considered**：
- 用同一个 token + 每个接口检查 status → 侵入性强，容易遗漏
- 不返回 token，用 session ID → 违背 RESTful 无状态原则

### 4. 密码哈希算法

使用 **bcrypt**（via `passlib[bcrypt]`），cost factor 使用默认值 12。

**为什么选 bcrypt 不选 argon2**：bcrypt 成熟稳定，FastAPI 生态文档丰富，passlib 原生支持。

### 5. 权限校验设计

```python
# server/app/core/permissions.py 伪代码示意

class RoleLevel:
    ROOT = 3
    ADMIN = 2
    USER = 1

def require_role(min_role: str):
    """FastAPI 依赖注入：校验当前用户角色 >= min_role"""

def require_not_self():
    """校验操作目标不是自己"""

def require_lower_than_self():
    """校验操作目标角色低于当前用户（admin 不能操作 admin/root）"""
```

权限矩阵通过 FastAPI `Depends()` 在 router 层声明，不侵入 service 层。

### 6. API 接口定义

#### 认证接口

```
POST /api/v1/auth/login
  Request:  { email: string, password: string }
  Response (active):       { code: 0,   data: { token, user } }
  Response (pending_setup): { code: 1001, data: { temp_token }, message }
  Response (password_reset): { code: 1002, data: { temp_token }, message }
  Response (fail):         { code: 401, data: null, message }

POST /api/v1/auth/setup
  Header:   Authorization: Bearer <temp_token>
  Request:  { username: string, password: string }
  Response: { code: 0, data: { token, user } }

POST /api/v1/auth/reset-password
  Header:   Authorization: Bearer <temp_token>
  Request:  { new_password: string }
  Response: { code: 0, data: { token, user } }

GET /api/v1/auth/profile
  Header:   Authorization: Bearer <token>
  Response: { code: 0, data: { id, email, username, role, status } }

POST /api/v1/auth/logout
  Header:   Authorization: Bearer <token>
  Response: { code: 0, data: null }
```

#### 用户管理接口

```
GET /api/v1/users
  Header:   Authorization: Bearer <token>  (root/admin only)
  Response: { code: 0, data: [ { id, email, username, role, status, created_at } ] }

POST /api/v1/users
  Header:   Authorization: Bearer <token>  (root/admin only)
  Request:  { email: string }
  Response: { code: 0, data: { id, email, role: "user", status: "pending_setup" } }

PUT /api/v1/users/{id}/role
  Header:   Authorization: Bearer <token>  (root: any role; admin: user↔admin only)
  Request:  { role: string }
  Response: { code: 0, data: { id, email, username, role } }

POST /api/v1/users/{id}/reset-password
  Header:   Authorization: Bearer <token>  (root/admin only, not self)
  Response: { code: 0, data: null, message: "密码已重置为 123456" }

DELETE /api/v1/users/{id}
  Header:   Authorization: Bearer <token>  (root: any non-root; admin: user only, not self)
  Response: { code: 0, data: null }
```

### 7. 前端新增页面设计

```
路由配置 (router/index.tsx):
├── /login           (公开)     ── 已有
├── /setup           (temp_token) ── 新增 Setup 页
├── /reset-password  (temp_token) ── 新增 ResetPassword 页
├── /dashboard       (auth)      ── 已有
├── /users           (auth + root/admin) ── 新增 UserManagement 页
└── ...              (auth)

组件层级:
Setup/index.tsx
├── Form: 用户名 + 密码 + 确认密码
└── API: POST /auth/setup

ResetPassword/index.tsx
├── Form: 新密码 + 确认密码
└── API: POST /auth/reset-password

UserManagement/index.tsx
├── Table: 用户列表 (分页)
├── Modal: 创建用户 (邮箱)
├── Modal: 修改角色 (下拉选择)
└── Popconfirm: 重置密码 / 删除用户
```

### 8. Token 黑名单实现

登出时将 token 加入内存黑名单（字典 + 过期时间），定期清理过期条目。

**为什么不用 Redis**：当前项目无 Redis 依赖，单实例部署下内存黑名单足够。后续多实例部署时可迁移到 Redis。

**Trade-off**：重启服务后黑名单丢失，已登出 token 可能在过期前仍有效。对于此阶段可接受。

### 9. root 用户创建 CLI

```bash
# 使用方式
python -m scripts.create_root --email root@prompt.dev --username root --password <your_password>
```

CLI 脚本直接操作数据库（不经过 HTTP），使用 bcrypt 生成 hash，插入 users 表。

## Risks / Trade-offs

- **[Token 黑名单内存存储] → 服务重启丢失**：重启后已登出 token 在过期前仍可用。后续可迁移到 Redis。当前阶段可接受。
- **[初始密码 123456 安全性低] → 弱密码风险**：这是有意设计，pending_setup 用户必须设置新密码才能使用系统。且 password_reset 状态用户也必须重设密码。风险可控。
- **[无邮件通知] → 用户不知道被创建**：管理员需通过其他渠道通知用户。后续可加邮件发送功能。
- **[username 唯一索引允许 NULL] → MySQL 特性**：MySQL 中多个 NULL 值不冲突，符合预期（多个 pending_setup 用户可以都没有 username）。
