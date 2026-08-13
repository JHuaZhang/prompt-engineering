## 1. 项目脚手架 [前端]

- [x] 1.1 创建 `web/` 目录，初始化 `package.json`（name: `prompt-engineering-web`, type: `module`, engines.node `>=18`），配置 scripts: `dev` / `mock` / `build` / `preview`
  - 组件层级：无
  - 依赖：react@18, react-dom@18, antd@5, @ant-design/icons, zustand, react-router-dom@6
  - devDeps: typescript@5, vite@5, @vitejs/plugin-react, vite-plugin-checker, vite-plugin-mock, mockjs, cross-env, @types/react, @types/react-dom, @types/node

- [x] 1.2 创建 `tsconfig.json`：`strict: true` + `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns` + `noFallthroughCasesInSwitch`，配置 `paths` 别名 `@/*` → `./src/*`

- [x] 1.3 创建 `tsconfig.node.json`（Vite 配置文件的 TS 配置），`vite.config.ts` 集成 `@vitejs/plugin-react` + `vite-plugin-checker`（typescript: true）+ `vite-plugin-mock`（devEnabled 读 `VITE_USE_MOCK`，prodEnabled: false）+ 路径别名解析

- [x] 1.4 创建 `index.html`（Vite 入口 HTML），创建 `src/main.tsx`（React 入口）和 `src/App.tsx`（根组件）

## 2. API 请求层 [前端]

- [x] 2.1 创建 `src/api/request.ts`：fetch 封装（BASE_URL `/api/v1`、AbortController 超时 30s、统一解包 `{ code, data, message }`、token 注入 `Authorization` header、ApiError 自定义错误类、`http.get/post/put/delete` 快捷方法）
  - 组件层级：无（纯函数模块）

- [x] 2.2 创建 `src/types/auth.ts`：定义 `UserVO`（id, email, name, avatar）、`LoginDTO`（email, password）、`LoginResultVO`（token, user）

- [x] 2.3 创建 `src/types/dashboard.ts`：定义 `DashboardStatsVO`（template_count, execution_count_month, active_model_count, avg_latency_ms）、`ExecutionRecordVO`（id, template_name, model_name, status, latency_ms, total_tokens, created_at）

- [x] 2.4 创建 `src/api/auth.ts`：`authApi.login(LoginDTO) → LoginResultVO`、`authApi.logout() → null`、`authApi.profile() → UserVO`
  - 组件层级：无（纯函数模块）

- [x] 2.5 创建 `src/api/dashboard.ts`：`dashboardApi.stats() → DashboardStatsVO`、`dashboardApi.recentExecutions() → ExecutionRecordVO[]`
  - 组件层级：无（纯函数模块）

## 3. 认证状态管理 [前端]

- [x] 3.1 创建 `src/utils/token.ts`：`getToken()` / `setToken(token)` / `removeToken()`，localStorage key = `prompt_token`
  - 组件层级：无（纯函数模块）

- [x] 3.2 创建 `src/store/auth.ts`：Zustand store，state `{ token, user }`，actions `{ login(LoginDTO), logout(), restoreSession() }`。login 调用 authApi.login 成功后存 token + user；logout 调用 authApi.logout 后清除；restoreSession 从 localStorage 恢复 token 后调 authApi.profile 恢复 user
  - 组件层级：无（状态管理模块）

## 4. Mock 数据 [前端]

- [x] 4.1 创建 `web/mock/auth.ts`：Mock `POST /api/v1/auth/login`（校验 `admin@prompt.dev` / `123456`，返回 mock token + user）、`POST /api/v1/auth/logout`（返回成功）、`GET /api/v1/auth/profile`（返回 mock user）。使用 mockjs 生成数据
  - 组件层级：无（Mock 拦截模块）

- [x] 4.2 创建 `web/mock/dashboard.ts`：Mock `GET /api/v1/dashboard/stats`（返回 mockjs 随机统计数据）、`GET /api/v1/dashboard/recent-executions`（返回 10 条 mockjs 生成的执行记录）
  - 组件层级：无（Mock 拦截模块）

## 5. 布局组件 [前端]

- [x] 5.1 创建 `src/components/Layout/BreadcrumbNav.tsx`：根据当前路由路径动态生成面包屑，使用 Ant Design `Breadcrumb`。路由映射表：`/dashboard` → "工作台"，`/templates` → "工作台 / 模板管理"，`/debug` → "工作台 / 调试执行"
  - 组件层级：Breadcrumb > Breadcrumb.Item

- [x] 5.2 创建 `src/components/Layout/HeaderBar.tsx`：顶部栏，左侧渲染 `BreadcrumbNav`，右侧渲染用户邮箱 `Dropdown`（含退出菜单项），退出调用 `store/auth.logout()`
  - 组件层级：Header > [BreadcrumbNav, Dropdown > Menu > (用户邮箱, 退出)]

- [x] 5.3 创建 `src/components/Layout/SideBar.tsx`：左侧导航栏，使用 Ant Design `Menu`，菜单项按 Phase 分组。Phase 1：工作台（`/dashboard`）、模板管理（`/templates`）、调试执行（`/debug`）。Phase 2-4：对比实验、评估面板、用量看板、版本管理、测试中心、调试向导 — 全部 `disabled` + tooltip "尚未开放"
  - 组件层级：Sider > Menu > [Menu.Item (Phase1, enabled), Menu.Item (Phase2-4, disabled)]

- [x] 5.4 创建 `src/components/Layout/MainLayout.tsx`：组合 `Sider` + `Header` + `Content`，Content 内渲染 `<Outlet />`。使用 Ant Design `Layout` 组件
  - 组件层级：Layout > [Sider > SideBar, Layout > [Header > HeaderBar, Content > Outlet]]

## 6. 登录页 [前端]

- [x] 6.1 创建 `src/pages/Login/index.tsx`：邮箱 + 密码登录表单。Ant Design `Form` + `Input`（email 规则校验含 `@`）+ `Input.Password` + `Button`。提交调用 `store/auth.login()`，成功后 `navigate` 到目标路由或 `/dashboard`。失败展示 `message.error`
  - 组件层级：Page(Login) > [Card > Form > [Form.Item > Input(email), Form.Item > Input.Password, Form.Item > Button(submit)]]

## 7. 工作台首页 [前端]

- [x] 7.1 创建 `src/pages/Dashboard/StatCards.tsx`：四个统计卡片（`Row` + `Col` + `Card` + `Statistic`）。数据通过 props 传入，加载中显示 `Skeleton`，加载失败显示 `Result` + 重试按钮
  - 组件层级：Row > [Col > Card > [Statistic, icon]] ×4

- [x] 7.2 创建 `src/pages/Dashboard/RecentExecutions.tsx`：最近执行记录表格。Ant Design `Table`，列：模板名称、模型名称、状态（`Tag`）、耗时（ms）、Token 消耗、执行时间。空数据显示 `Empty`
  - 组件层级：Card > Table > [Column ×6]

- [x] 7.3 创建 `src/pages/Dashboard/QuickActions.tsx`：快捷入口区域，两个 `Button`（"新建模板" → `/templates/new`，"去调试" → `/debug`），使用 `useNavigate` 跳转
  - 组件层级：Card > [Space > Button ×2]

- [x] 7.4 创建 `src/pages/Dashboard/index.tsx`：组合 `StatCards` + `RecentExecutions` + `QuickActions`。通过 `useEffect` 调用 `dashboardApi.stats()` 和 `dashboardApi.recentExecutions()`，管理 loading / error 状态
  - 组件层级：Page(Dashboard) > [StatCards, RecentExecutions, QuickActions]

## 8. 路由配置 [前端]

- [x] 8.1 创建 `src/router/AuthRoute.tsx`：登录守卫组件。检查 `localStorage` token，无则 `<Navigate to="/login" state={{ from: location }} />`，有则渲染 `<Outlet />`
  - 组件层级：AuthRoute > Outlet

- [x] 8.2 创建 `src/router/index.tsx`：配置 `BrowserRouter` + `Routes`。`/login` → `Login`（无需认证）。`AuthRoute` 包裹的 `MainLayout` 下含 `/dashboard` → `Dashboard`。根路径 `/` → `<Navigate to="/dashboard" />`。404 → `<Navigate to="/dashboard" />`
  - 组件层级：BrowserRouter > Routes > [Route(/login → Login), Route(AuthRoute > MainLayout > [Route(/dashboard → Dashboard), ...])]

- [x] 8.3 更新 `src/App.tsx`：渲染 `RouterProvider` 或直接使用 `BrowserRouter`，包裹 Ant Design `ConfigProvider`（中文 locale `zhCN`）

## 9. 验证与收尾 [前端]

- [x] 9.1 验证 `pnpm mock` 启动正常：登录页可访问、登录成功跳转 Dashboard、Dashboard 统计数据和执行记录正确展示、退出按钮正常登出

- [x] 9.2 验证 `pnpm build` 在无 TS 错误时构建成功，故意制造一个 TS 错误验证 `pnpm mock` 和 `pnpm build` 是否会被阻断，验证通过后移除测试错误

- [x] 9.3 同步更新 `docs/pages.md`：追加 Login 和 Dashboard 页面组件树，新增 MainLayout 布局说明，在页面变更历史表格追加记录

- [x] 9.4 同步更新 `docs/api.md`：追加 `/auth/login`、`/auth/logout`、`/auth/profile`、`/dashboard/stats`、`/dashboard/recent-executions` 五个接口定义，在接口变更历史表格追加记录