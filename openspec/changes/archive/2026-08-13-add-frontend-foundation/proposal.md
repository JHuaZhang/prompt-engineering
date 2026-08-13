## Why

项目当前只有配置和规划文档，没有可运行的前端代码。作为 Phase 1 的第一步，需要搭建前端基础架构，让开发者可以从登录进入系统、看到工作台首页，并在 Mock 模式下完整跑通交互流程，为后续模板管理、调试执行等功能模块提供地基。

## What Changes

- 新建 Vite + React 18 + TypeScript (strict) 前端项目脚手架（`web/` 目录）
- 配置 TypeScript 强制检查：`strict: true` + `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns` + `noFallthroughCasesInSwitch`，通过 `vite-plugin-checker` 在 dev 和 build 时阻断 TS 错误
- 封装基于原生 `fetch` 的统一请求层（`src/api/request.ts`），支持超时、AbortController、统一解包 `{ code, data, message }`
- 集成 `vite-plugin-mock` + MockJS，Mock 文件独立放在 `web/mock/` 目录，build 时不打包
- 设计 `pnpm dev`（连后端 API）和 `pnpm mock`（走 Mock 数据）双模式切换，通过 `VITE_USE_MOCK` 环境变量控制
- 实现邮箱 + 密码登录页（`/login`），Mock 账号返回 token 和用户信息
- 实现侧边栏 + 顶栏 + 面包屑的后台管理布局（`MainLayout`），使用 Ant Design ProLayout 风格
- 实现 Dashboard 工作台首页（`/dashboard`），展示概览卡片 + 最近执行记录 + 快捷入口
- 实现登录守卫路由（`AuthRoute`），未登录跳转 `/login`
- 使用 Zustand 管理认证状态（token、用户信息），token 持久化到 localStorage
- 侧边栏按 Phase 路线图展示菜单，未实现的 Phase 菜单项标灰禁用

## Capabilities

### New Capabilities

- `frontend-foundation`: 前端基础架构搭建，包含项目脚手架、TS 严格配置、fetch 封装、Mock 集成、环境变量双模式
- `user-auth`: 用户认证功能，包含邮箱密码登录、登出、token 管理、登录守卫
- `app-layout`: 后台管理布局，包含侧边栏导航、顶栏用户信息、面包屑导航、路由Outlet
- `dashboard`: 工作台首页，包含概览统计卡片、最近执行记录列表、快捷入口

### Modified Capabilities

（无，全部为新增能力）

## Impact

### 影响范围

**新增代码**：
- `web/` 整个前端项目目录（脚手架 + 源码 + Mock）
- `web/mock/` Mock 数据文件（auth、dashboard）
- `web/src/api/request.ts` fetch 封装
- `web/src/api/auth.ts` 认证 API
- `web/src/api/dashboard.ts` 工作台 API
- `web/src/components/Layout/` 布局组件群
- `web/src/pages/Login/` 登录页
- `web/src/pages/Dashboard/` 工作台页
- `web/src/store/auth.ts` 认证状态管理
- `web/src/router/` 路由配置 + 守卫

**新增依赖**：
- dependencies: `react`, `react-dom`, `antd`, `@ant-design/icons`, `zustand`, `react-router-dom`
- devDependencies: `typescript`, `vite`, `@vitejs/plugin-react`, `vite-plugin-checker`, `vite-plugin-mock`, `mockjs`, `cross-env`, `@types/react`, `@types/react-dom`, `@types/node`

**受影响的 API**（Mock 层定义）：
- `POST /api/v1/auth/login` — 邮箱密码登录
- `POST /api/v1/auth/logout` — 登出
- `GET /api/v1/auth/profile` — 获取当前用户信息
- `GET /api/v1/dashboard/stats` — 工作台统计数据
- `GET /api/v1/dashboard/recent-executions` — 最近执行记录

**受影响的数据库表**：无（本变更不涉及数据库，全部走 Mock）

**所属 Phase**: Phase 1（前端基础架构 + 登录 + 首页）