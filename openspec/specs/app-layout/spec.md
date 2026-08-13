## Purpose

后台管理布局规范，定义侧边栏导航、顶栏用户信息和面包屑导航的结构与行为，为所有业务页面提供统一的布局外壳。

## ADDED Requirements

### Requirement: 主布局结构

系统 SHALL 提供统一的主布局组件 `MainLayout`，包含左侧侧边导航栏、顶部顶栏和主内容区。侧边栏和顶栏固定可见，主内容区通过 React Router `<Outlet />` 渲染子路由。

#### Scenario: 布局渲染

- **WHEN** 用户登录后访问任何受保护路由
- **THEN** 页面展示左侧侧边栏（含菜单项）、顶部顶栏（含用户信息和退出按钮）、主内容区（渲染当前路由对应的页面组件）

### Requirement: 侧边栏导航菜单

侧边栏 SHALL 按 Phase 路线图展示菜单项。Phase 1 菜单项可点击跳转，Phase 2-4 菜单项标灰禁用并显示 tooltip 提示"尚未开放"。

#### Scenario: 查看 Phase 1 菜单

- **WHEN** 用户展开侧边栏
- **THEN** 展示菜单项：工作台（`/dashboard`）、模板管理（`/templates`）、调试执行（`/debug`），均可点击

#### Scenario: 点击禁用菜单

- **WHEN** 用户点击 Phase 2 的"对比实验"菜单项
- **THEN** 菜单项不可点击，显示 tooltip "尚未开放"

### Requirement: 顶栏用户信息

顶栏 SHALL 展示当前登录用户的邮箱地址和退出按钮。点击退出按钮触发登出流程。

#### Scenario: 查看用户信息

- **WHEN** 用户查看顶栏右侧
- **THEN** 展示当前用户邮箱（如 `admin@prompt.dev`）和退出按钮

#### Scenario: 点击退出

- **WHEN** 用户点击顶栏的退出按钮
- **THEN** 触发登出流程，清除 token 后跳转到 `/login`

### Requirement: 面包屑导航

系统 SHALL 在主内容区顶部展示面包屑导航，根据当前路由路径动态生成。面包屑从首页"工作台"开始，逐级展示当前页面层级。

#### Scenario: 工作台页面面包屑

- **WHEN** 用户访问 `/dashboard`
- **THEN** 面包屑展示"工作台"

#### Scenario: 模板列表页面面包屑

- **WHEN** 用户访问 `/templates`
- **THEN** 面包屑展示"工作台 / 模板管理"