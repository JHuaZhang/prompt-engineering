## 1. 后端骨架搭建

- [x] 1.1 创建 server/ 目录结构及 Python 包初始化文件（`__init__.py`）（后端）
  - `server/app/__init__.py`, `server/app/models/__init__.py`, `server/app/schemas/__init__.py`, `server/app/services/__init__.py`, `server/app/routers/__init__.py`, `server/app/core/__init__.py`
- [x] 1.2 创建 requirements.txt，包含 fastapi、uvicorn、sqlalchemy[asyncio]、aiomysql、alembic、passlib[bcrypt]、python-jose[cryptography]、pydantic-settings、python-multipart（后端）
- [x] 1.3 创建配置模块 `server/app/config.py`，使用 Pydantic Settings 读取 .env（DATABASE_URL、JWT_SECRET_KEY、JWT_ALGORITHM、JWT_EXPIRE_MINUTES、TEMP_TOKEN_EXPIRE_MINUTES）（后端）
  - 创建 `.env.example` 作为配置模板
- [x] 1.4 创建数据库连接模块 `server/app/database.py`，初始化 async SQLAlchemy engine 和 AsyncSession 工厂（后端）
- [x] 1.5 创建 FastAPI 应用入口 `server/app/main.py`，注册 /api/v1 前缀路由、CORS 中间件、异常处理器（后端）
- [x] 1.6 初始化 Alembic 迁移体系：创建 `alembic.ini`、`server/alembic/env.py`（async 配置）、`server/alembic/versions/` 目录（后端）

## 2. 用户数据模型与迁移

- [x] 2.1 创建 SQLAlchemy ORM 模型 `server/app/models/user.py`，定义 User 模型（id、email、username、password_hash、role、status、created_by、created_at、updated_at）（后端）
- [x] 2.2 创建 Alembic 迁移脚本：`alembic revision --autogenerate -m "create users table"`，生成 users 表 DDL（后端，数据库迁移步骤）
  - 迁移内容：CREATE TABLE users（含唯一索引 uk_email、uk_username）
  - 运行 `alembic upgrade head` 执行迁移
  - 运行 `alembic check` 验证迁移一致性
- [x] 2.3 同步更新 `docs/database.sql`，在 Phase 1 表结构区域新增 users 表 DDL，并更新表变更历史（后端）

## 3. 安全核心模块

- [x] 3.1 创建 `server/app/core/security.py`，实现 bcrypt 密码哈希/验证（hash_password、verify_password）和 JWT 编码/解码（create_token、create_temp_token、decode_token）（后端）
  - 完整 token payload: `{sub, role, status: "active"}`
  - temp_token payload: `{sub, status, scope: "setup"|"reset_password"}`，短时效 30min
- [x] 3.2 创建 `server/app/core/permissions.py`，定义角色等级常量和权限校验依赖注入函数（require_role、require_not_self、require_lower_privilege）（后端）
  - RoleLevel: ROOT=3, ADMIN=2, USER=1
- [x] 3.3 创建 `server/app/deps.py`，实现 get_db（数据库会话注入）、get_current_user（JWT 解析 + 用户查询）、require_active_token（拒绝 temp_token 访问）、require_temp_token（仅允许 temp_token）（后端）

## 4. 认证 API（后端）

- [x] 4.1 创建 Pydantic schemas `server/app/schemas/auth.py`（LoginRequest、LoginResponse、SetupRequest、ResetPasswordRequest、UserVO、TokenVO）（后端）
- [x] 4.2 创建 auth_service `server/app/services/auth_service.py`，实现：
  - `authenticate(email, password)` → 校验邮箱密码，返回用户或 None
  - `login(email, password)` → 根据 status 返回不同结果（完整token / temp_token / 认证失败）
  - `setup_account(user_id, username, password)` → 设置用户名和新密码，status → active
  - `reset_password(user_id, new_password)` → 设置新密码，status → active
  - `get_profile(user_id)` → 返回用户信息
  - `logout(token)` → token 加入黑名单（后端）
- [x] 4.3 创建 `server/app/routers/auth.py`，注册以下路由（后端）：
  - `POST /auth/login` — 公开接口
  - `POST /auth/setup` — 需要 temp_token (scope=setup)
  - `POST /auth/reset-password` — 需要 temp_token (scope=reset_password)
  - `GET /auth/profile` — 需要完整 token
  - `POST /auth/logout` — 需要完整 token
- [x] 4.4 在 main.py 中注册 auth router（后端）
  - 启动服务验证：`uvicorn server.app.main:app --reload`，测试 /docs Swagger UI

## 5. 用户管理 API（后端）

- [x] 5.1 创建 Pydantic schemas `server/app/schemas/user.py`（CreateUserRequest、UpdateRoleRequest、UserListItemVO）（后端）
- [x] 5.2 创建 user_service `server/app/services/user_service.py`，实现：
  - `list_users()` → 返回所有用户列表
  - `create_user(email, created_by)` → 创建用户（role=user, status=pending_setup, password=123456 的 bcrypt hash）
  - `update_role(target_id, new_role, current_user)` → 修改角色（含权限校验逻辑）
  - `reset_user_password(target_id, current_user)` → 重置密码为 123456，status → password_reset
  - `delete_user(target_id, current_user)` → 删除用户（含权限校验逻辑）（后端）
- [x] 5.3 创建 `server/app/routers/users.py`，注册以下路由（后端）：
  - `GET /users` — 需要 root/admin 角色
  - `POST /users` — 需要 root/admin 角色
  - `PUT /users/{id}/role` — 需要 root（任意角色）或 admin（仅 user↔admin）
  - `POST /users/{id}/reset-password` — 需要 root/admin，不可操作自己
  - `DELETE /users/{id}` — 需要 root（非root）或 admin（仅user），不可操作自己
- [x] 5.4 在 main.py 中注册 users router（后端）
  - 验证：创建 root 用户后测试完整 CRUD 流程

## 6. root 用户创建脚本

- [x] 6.1 创建 `server/scripts/create_root.py` CLI 脚本，接收 --email、--username、--password 参数，使用 bcrypt 生成 hash，直接写入数据库（role=root, status=active）（后端）
  - 验证：执行脚本创建 root 用户，用该账号登录验证

## 7. 前端类型与 API 层更新

- [x] 7.1 扩展 `web/src/types/auth.ts`：新增 status 字段、temp_token 字段、SetupDTO、ResetPasswordDTO、UserManageVO（含 role、status、created_at）（前端）
  - 组件层级：types → api → store → pages
- [x] 7.2 更新 `web/src/api/auth.ts`：新增 setup()、resetPassword() 接口；更新 login() 返回类型以支持 code=1001/1002；新增 user API（`web/src/api/user.ts`）：list、create、updateRole、resetPassword、remove（前端）
  - 组件层级：types → api
- [x] 7.3 更新 `web/src/store/auth.ts`：login 方法根据 code 分流处理（0 → 正常登录、1001 → 跳转 setup、1002 → 跳转 reset-password）；新增临时 token 存取方法（前端）
  - 组件层级：api → store

## 8. 前端路由更新

- [x] 8.1 创建 `web/src/router/PermissionRoute.tsx`：基于 user.role 控制路由访问（root/admin 可访问 /users）（前端）
  - 组件层级：router → pages
- [x] 8.2 更新 `web/src/router/index.tsx`：新增 /setup、/reset-password、/users 路由；/setup 和 /reset-password 使用 temp_token 守卫；/users 使用 PermissionRoute 守卫（前端）
  - 组件层级：router → pages

## 9. 前端页面 —— 首次设置

- [x] 9.1 创建 `web/src/pages/Setup/index.tsx`：表单（用户名 + 密码 + 确认密码），调用 /auth/setup 接口，成功后跳转 /dashboard（前端）
  - 组件层级：pages/Setup → api/auth → store/auth
  - 验证：使用 pending_setup 用户登录 → 跳转此页面 → 设置用户名密码 → 跳转 dashboard

## 10. 前端页面 —— 重置密码

- [x] 10.1 创建 `web/src/pages/ResetPassword/index.tsx`：表单（新密码 + 确认密码），调用 /auth/reset-password 接口，成功后跳转 /dashboard（前端）
  - 组件层级：pages/ResetPassword → api/auth → store/auth
  - 验证：使用 password_reset 用户登录 → 跳转此页面 → 设置新密码 → 跳转 dashboard

## 11. 前端页面 —— 用户管理

- [x] 11.1 创建 `web/src/pages/UserManagement/index.tsx`：Ant Design Table 展示用户列表（分页），列：邮箱、用户名、角色、状态、创建时间、操作（前端）
  - 组件层级：pages/UserManagement → api/user
- [x] 11.2 在 UserManagement 页面添加"创建用户"Modal：仅邮箱输入框，调用 POST /users（前端）
  - 组件层级：pages/UserManagement/Modal → api/user
- [x] 11.3 在 UserManagement 页面添加"修改角色"功能：Popconfirm 确认后调用 PUT /users/{id}/role，角色下拉根据当前用户权限渲染选项（前端）
  - 组件层级：pages/UserManagement → api/user
- [x] 11.4 在 UserManagement 页面添加"重置密码"和"删除用户"功能：Popconfirm 确认后调用对应接口，根据权限显示/隐藏操作按钮（前端）
  - 组件层级：pages/UserManagement → api/user
  - 验证：root 登录后可对所有用户操作；admin 登录后只能对 user 角色用户操作

## 12. 前端布局与导航更新

- [x] 12.1 更新 `web/src/components/Layout/HeaderBar.tsx`：顶部导航新增"用户管理"菜单项，仅 root/admin 角色可见（前端）
  - 组件层级：components/Layout → store/auth
  - 验证：`tsc --noEmit` 通过

## 13. 集成验证

- [ ] 13.1 后端验证：使用 create_root 脚本创建 root → root 登录 → 创建新用户 → 新用户首次登录设置 → root 重置该用户密码 → 该用户重新设置密码 → root 修改角色 → root 删除用户（全栈）
- [ ] 13.2 前端验证：关闭 Mock，指向后端 API，完整走一遍上述流程的 UI 交互（全栈）
  - 验证：`tsc --noEmit` 通过，无 console error

## 14. 文档同步

- [x] 14.1 更新 `docs/database.sql`：确认 users 表 DDL 已在 Phase 1 区域，更新表变更历史（后端）
- [x] 14.2 更新 `docs/api.md`：新增认证和用户管理接口文档（后端）
- [x] 14.3 更新 `docs/pages.md`：新增 Setup、ResetPassword、UserManagement 页面说明（前端）
