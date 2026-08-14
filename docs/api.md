# API 接口存档

> 本文件记录项目所有 API 接口定义。每次新增或修改 API 时必须同步更新此文件。

## 接口变更历史

| 日期 | 变更内容 | 关联 Phase |
|------|---------|-----------|
| 2026-08-13 | 新增 auth 和 dashboard 共 5 个接口 | Phase 1 |
| 2026-08-13 | UserVO.avatar 改为可选字段（头像改用用户名首字母） | Phase 1 |
| 2026-08-13 | request.ts 新增重试机制（默认 3 次，指数退避，仅 5xx/网络错误重试） | Phase 1 |
| 2026-08-13 | 新增认证增强（setup、reset-password）及用户管理接口 | Phase 1 |

---

## Phase 1 接口

### 认证 — /api/v1/auth

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/auth/login` | 邮箱密码登录 | `LoginDTO` | `LoginResultVO` / `TempTokenVO` |
| POST | `/auth/setup` | 首次设置用户名和密码 | `SetupDTO` | `LoginResultVO` |
| POST | `/auth/reset-password` | 重置后设置新密码 | `ResetPasswordDTO` | `LoginResultVO` |
| POST | `/auth/logout` | 登出 | — | `null` |
| GET | `/auth/profile` | 获取当前用户信息 | — | `UserVO` |

#### LoginDTO

```json
{
  "email": "admin@prompt.dev",
  "password": "123456"
}
```

#### 登录响应（正常 active）

```json
{
  "code": 0,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": 1,
      "email": "admin@prompt.dev",
      "username": "Admin",
      "role": "root",
      "status": "active"
    }
  },
  "message": "success"
}
```

#### 登录响应（pending_setup，code=1001）

```json
{
  "code": 1001,
  "data": { "temp_token": "temp-jwt-token" },
  "message": "首次登录，请设置用户名和密码"
}
```

#### 登录响应（password_reset，code=1002）

```json
{
  "code": 1002,
  "data": { "temp_token": "temp-jwt-token" },
  "message": "密码已被重置，请设置新密码"
}
```

#### SetupDTO

```json
{
  "username": "张三",
  "password": "newpassword"
}
```

#### ResetPasswordDTO

```json
{
  "new_password": "newpassword"
}
```

#### UserVO

```json
{
  "id": 1,
  "email": "admin@prompt.dev",
  "username": "Admin",
  "role": "root",
  "status": "active"
}
```

> 认证请求头：除 `/auth/login` 外，所有接口需要 `Authorization: Bearer <token>` 头。
> `/auth/setup` 和 `/auth/reset-password` 需要使用 temp_token（登录时 code=1001/1002 返回的受限 token）。

### 用户管理 — /api/v1/users

| 方法 | 路径 | 说明 | 请求体 | 响应 | 权限 |
|------|------|------|--------|------|------|
| GET | `/users` | 用户列表 | — | `UserManageVO[]` | root/admin |
| POST | `/users` | 创建用户（邮箱） | `CreateUserDTO` | `UserManageVO` | root/admin |
| PUT | `/users/{id}/role` | 修改用户角色 | `UpdateRoleDTO` | `UserManageVO` | root/admin |
| POST | `/users/{id}/reset-password` | 重置用户密码 | — | `null` | root/admin |
| DELETE | `/users/{id}` | 删除用户 | — | `null` | root/admin |

#### CreateUserDTO

```json
{ "email": "newuser@prompt.dev" }
```

#### UpdateRoleDTO

```json
{ "role": "admin" }
```

#### UserManageVO

```json
{
  "id": 2,
  "email": "user@prompt.dev",
  "username": "用户名",
  "role": "user",
  "status": "active",
  "created_at": "2026-08-13T12:00:00"
}
```

> 创建用户后初始密码为 123456，用户状态为 pending_setup。
> 重置密码后密码为 123456，用户状态为 password_reset。
> admin 不能操作 root 用户和同级 admin 用户。

### 请求封装 — `src/api/request.ts`

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `BASE_URL` | `/api/v1` | API 前缀 |
| `DEFAULT_TIMEOUT` | `30000` (30s) | 单次请求超时 |
| `DEFAULT_RETRY` | `3` | 最大重试次数 |
| `RETRY_DELAY` | `1000` (1s) | 退避基数，实际延迟 = `1000 * 2^attempt` |

**重试策略**：仅网络错误（TypeError / AbortError）和 HTTP 5xx 触发重试；4xx 和业务错误（code != 0）不重试。

### 工作台 — /api/v1/dashboard

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/dashboard/stats` | 工作台统计数据 | — | `DashboardStatsVO` |
| GET | `/dashboard/recent-executions` | 最近执行记录 | — | `ExecutionRecordVO[]` |

#### DashboardStatsVO

```json
{
  "template_count": 15,
  "execution_count_month": 233,
  "active_model_count": 5,
  "avg_latency_ms": 1800
}
```

#### ExecutionRecordVO

```json
{
  "id": 1,
  "template_name": "客服回复模板",
  "model_name": "gpt-4o",
  "status": "success",
  "latency_ms": 1200,
  "total_tokens": 850,
  "created_at": "2026-08-13 12:00:00"
}
```

### 模板管理 — /api/v1/templates

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/templates` | 模板列表 | Query: page, page_size, category_id, status, keyword | `PaginationVO<TemplateVO>` |
| GET | `/templates/{id}` | 模板详情 | — | `TemplateVO` |
| POST | `/templates` | 创建模板 | `CreateTemplateDTO` | `TemplateVO` |
| PUT | `/templates/{id}` | 更新模板 | `UpdateTemplateDTO` | `TemplateVO` |
| DELETE | `/templates/{id}` | 删除模板 | — | `null` |
| POST | `/templates/{id}/render` | 渲染模板 | `{ variables: Record<string, unknown> }` | `{ rendered_prompt: string }` |

> 模板管理接口待 Phase 1 后续变更实现

### 模型供应商 — /api/v1/providers

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/providers` | 供应商列表 | — | `ProviderVO[]` |
| GET | `/providers/{id}` | 供应商详情 | — | `ProviderVO` |
| POST | `/providers` | 创建供应商 | `CreateProviderDTO` | `ProviderVO` |
| PUT | `/providers/{id}` | 更新供应商 | `UpdateProviderDTO` | `ProviderVO` |
| DELETE | `/providers/{id}` | 删除供应商 | — | `null` |

> 模型供应商接口待 Phase 1 后续变更实现

### 执行调用 — /api/v1/execute

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/execute` | 执行 Prompt（SSE 流式） | `ExecuteRequest` | SSE Stream |
| GET | `/execute/{id}` | 获取执行记录 | — | `ExecutionRecordVO` |
| GET | `/execute` | 执行记录列表 | Query: template_id, provider_id, page, page_size | `PaginationVO<ExecutionRecordVO>` |

### 执行请求体 (ExecuteRequest)

```json
{
  "template_id": 1,
  "provider_id": 1,
  "model_name": "gpt-4o",
  "variables": { "user_input": "你好" },
  "model_params": { "temperature": 0.7, "max_tokens": 2000 }
}
```

### SSE 事件格式

```
data: {"content": "增量文本"}\n\n
data: {"done": true, "meta": {"prompt_tokens": 100, "completion_tokens": 50, "latency_ms": 1200}}\n\n
data: {"error": "错误信息"}\n\n
```

> 执行调用接口待 Phase 1 后续变更实现

---

## Phase 2 接口

> 待 Phase 2 启动时补充：experiments、evaluations、statistics

---

## Phase 3 接口

> 待 Phase 3 启动时补充：versions、debug、optimize、test-runs

---

## Phase 4 接口

> 待 Phase 4 启动时补充：conversations、chains、auth 增强