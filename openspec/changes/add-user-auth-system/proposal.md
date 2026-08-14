## Why

平台需要一个完整的用户认证与权限体系，才能支撑后续的模板管理、多模型对比等核心功能。当前前端登录页面已搭建，但后端服务尚未启动，需要首次搭建 FastAPI 后端骨架并实现用户认证全流程。

## What Changes

- **新建 FastAPI 后端骨架**：三层架构（routers → services → models），包含配置管理、数据库连接、Alembic 迁移体系
- **新建 users 数据库表**：原计划在 Phase 4，现提前到 Phase 1，支持 email、username、password_hash、role、status 字段
- **实现登录认证流程**：
  - 邮箱+密码登录，JWT token 鉴权
  - `pending_setup` 状态：新建用户首次登录需设置用户名和密码
  - `password_reset` 状态：被重置密码后用户需重新设置密码
  - `active` 状态：正常登录
- **实现用户管理**：
  - root 超级管理员通过脚本手动创建（CLI 脚本生成 bcrypt hash）
  - root/admin 通过邮箱创建新用户，初始密码为 123456
  - root/admin 重置用户密码，重置后密码为 123456，用户状态变为 `password_reset`
  - 三级角色体系：root > admin > user
- **前端新增页面**：
  - 首次设置页（Setup）：设置用户名和密码
  - 重置密码页（ResetPassword）：设置新密码
  - 用户管理页（UserManagement）：用户列表、创建、重置密码、角色管理
- **更新前端路由守卫**：增加权限路由守卫（PermissionRoute），根据角色控制页面访问

## Capabilities

### New Capabilities

- `user-auth`: 用户认证体系 —— 登录、登出、首次设置、重置密码、Token 鉴权
- `user-management`: 用户管理 —— 用户 CRUD、角色管理、密码重置（root/admin 权限）

### Modified Capabilities

（无 —— 当前项目无已有 spec）

## Impact

### 影响范围

**数据库表：**
- 新增 `users` 表（从 Phase 4 提前）

**API 接口：**
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/login | 登录 |
| POST | /api/v1/auth/setup | 首次设置用户名+密码 |
| POST | /api/v1/auth/reset-password | 重置后设置新密码 |
| POST | /api/v1/auth/logout | 登出 |
| GET | /api/v1/auth/profile | 获取当前用户信息 |
| GET | /api/v1/users | 用户列表 |
| POST | /api/v1/users | 创建用户（邮箱） |
| PUT | /api/v1/users/{id}/role | 修改用户角色 |
| POST | /api/v1/users/{id}/reset-password | 重置用户密码 |
| DELETE | /api/v1/users/{id} | 删除用户 |

**受影响代码：**
- `server/` — 全新创建，FastAPI 后端骨架 + 认证模块 + 用户管理模块
- `web/src/pages/Setup/` — 新增首次设置页
- `web/src/pages/ResetPassword/` — 新增重置密码页
- `web/src/pages/UserManagement/` — 新增用户管理页
- `web/src/router/` — 新增 PermissionRoute，更新路由配置
- `web/src/api/` — 新增 user API 层，更新 auth API
- `web/src/types/` — 扩展 auth 类型定义
- `web/src/store/` — 扩展 auth store，新增 user store
- `docs/database.sql` — 新增 users 表 DDL

**Phase 归属：** Phase 1（提前到 Phase 1）

**LLM 供应商影响：** 无
