## Context

项目当前无任何前端代码。本变更是 Phase 1 的第一个实施步骤，需要从零搭建 `web/` 目录下的完整前端项目。技术栈已由 SKILL.md 和 CLAUDE.md 约定：React 18 + TypeScript (strict) + Vite + Ant Design 5.x + Zustand + React Router 6。后端尚未搭建，因此所有 API 调用走 Mock。

## Goals / Non-Goals

**Goals:**
- 搭建可运行的 Vite + React 18 + TS 前端项目，`pnpm dev` 和 `pnpm mock` 均可启动
- 实现邮箱密码登录 → 工作台首页的完整交互闭环
- Mock 数据独立于 `src/`，build 时不打包
- TS 严格模式 + `vite-plugin-checker` 阻断构建

**Non-Goals:**
- 不实现模板管理、调试执行等业务页面（后续变更）
- 不搭建后端 API
- 不涉及真实数据库操作
- 不做权限管理（当前只有一个 mock 角色）
- 不做 UI 精细设计稿还原

## Decisions

### D1: 使用 vite-plugin-mock 而非 MSW / 独立 Mock Server

**选择**: `vite-plugin-mock` + `mockjs`
**理由**:
- 与 Vite 深度集成，通过中间件拦截请求，零额外端口
- `prodEnabled: false` 确保 build 不打包
- `mockjs` 提供数据生成能力，`vite-plugin-mock` 提供路由拦截
- Mock 文件放 `web/mock/` 独立目录，与 `src/` 完全隔离
**替代方案**:
- MSW：需配置 Service Worker，dev 模式下与 Vite 集成存在坑
- 独立 json-server：需额外端口，`pnpm dev` 和 `pnpm mock` 切换不方便

### D2: fetch 封装而非 axios

**选择**: 原生 `fetch` 自定义封装
**理由**: SKILL.md 已约定，SSE 流式和普通请求共用 `BASE_URL`，`fetch` 原生支持 `ReadableStream`
**设计**:
- `src/api/request.ts` — 普通 HTTP 请求，返回 `Promise<T>`（已解包 `data` 字段）
- `src/api/sse.ts` — 流式请求，返回 `AsyncIterator<SSEEvent>`（本次暂不创建，后续 Phase 1 调试页面时实现）
- token 注入：在 `request()` 内部从 `localStorage` 读取 token，附加到 `Authorization` header

### D3: 认证状态管理 — Zustand + localStorage

**选择**: Zustand store 管理运行时状态，localStorage 持久化 token
**理由**: Zustand 不需要 Provider 包裹，且 SKILL.md 已约定全局状态用 Zustand
**设计**:
```
store/auth.ts
  state: { token: string | null, user: UserVO | null }
  actions: { login, logout, restoreSession }
  token 存 localStorage key="prompt_token"
  user 信息不持久化，每次刷新通过 /auth/profile 重新获取
```

### D4: 路由守卫 — AuthRoute 组件包装

**选择**: 自定义 `<AuthRoute>` 组件包裹受保护路由
**设计**:
```
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<AuthRoute><MainLayout /></AuthRoute>}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/templates" element={<TemplateList />} />  // Phase 1 后续
      ...
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" />} />
  </Routes>
</BrowserRouter>
```
AuthRoute 检查 localStorage token，无则 `<Navigate to="/login" state={{ from: location }} />`

### D5: 布局 — 侧边栏 + 顶栏 + 面包屑

**选择**: Ant Design `Layout` + `Menu` + `Breadcrumb` 自组建
**理由**: 不引入 `@ant-design/pro-components`，保持依赖最小化，布局灵活可控
**设计**:
```
MainLayout (Ant Design Layout)
├── Sider (固定左侧)
│   └── Menu (按 Phase 分组菜单)
├── Layout (右侧主体)
│   ├── Header
│   │   ├── Breadcrumb (动态面包屑)
│   │   └── Dropdown (用户邮箱 + 退出)
│   └── Content
│       └── <Outlet /> (子路由渲染)
```

### D6: package.json scripts

```json
{
  "dev": "vite",
  "mock": "cross-env VITE_USE_MOCK=true vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

### D7: Mock API 接口定义

| 方法 | 路径 | 说明 | Mock 返回 |
|------|------|------|----------|
| POST | `/api/v1/auth/login` | 邮箱密码登录 | `{ token: "mock-jwt-token", user: { id, email, name, avatar } }` |
| POST | `/api/v1/auth/logout` | 登出 | `{ code: 0, data: null }` |
| GET | `/api/v1/auth/profile` | 获取用户信息 | `{ id, email, name, avatar }` |
| GET | `/api/v1/dashboard/stats` | 工作台统计 | `{ template_count, execution_count_month, active_model_count, avg_latency_ms }` |
| GET | `/api/v1/dashboard/recent-executions` | 最近执行记录 | `ExecutionRecordVO[10]` |

Mock 账号: `admin@prompt.dev` / `123456`

## Risks / Trade-offs

- **[Mock 与真实 API 行为差异]** → Mock 返回结构严格遵循统一响应 `{ code, data, message }`，未来对接后端时只需去掉 mock 中间件，API 调用层无需改动
- **[vite-plugin-mock 版本兼容]** → 需确认 `vite-plugin-mock` 与 Vite 5.x 的兼容性，若不兼容回退到 MSW
- **[Token 存 localStorage 的 XSS 风险]** → 当前 MVP 阶段可接受，后续 Phase 4 引入真实认证时改为 httpOnly cookie