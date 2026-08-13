## Purpose

工作台首页规范，定义首页概览统计卡片、最近执行记录列表和快捷入口的内容与数据来源，为用户提供项目整体状态的快速概览。

## ADDED Requirements

### Requirement: 概览统计卡片

工作台首页 SHALL 展示四个概览统计卡片：模板总数、本月执行次数、活跃模型数、平均耗时。卡片数据通过 `GET /api/v1/dashboard/stats` 获取。

#### Scenario: 加载统计数据

- **WHEN** 用户进入 `/dashboard` 页面
- **THEN** 页面调用 dashboard stats API，展示四个统计卡片，每个卡片含图标、数字和标题

#### Scenario: 统计数据加载中

- **WHEN** API 请求尚未返回
- **THEN** 卡片区域展示 Ant Design `Skeleton` 骨架屏

#### Scenario: 统计数据加载失败

- **WHEN** API 请求失败
- **THEN** 卡片区域展示错误提示"数据加载失败"，并提供重试按钮

### Requirement: 最近执行记录

工作台首页 SHALL 展示最近 10 条执行记录列表，通过 `GET /api/v1/dashboard/recent-executions` 获取。列表展示字段：模板名称、模型名称、状态、耗时、Token 消耗、执行时间。

#### Scenario: 加载执行记录

- **WHEN** 用户进入 `/dashboard` 页面
- **THEN** 页面调用 recent-executions API，展示最近执行记录表格

#### Scenario: 无执行记录

- **WHEN** API 返回空列表
- **THEN** 表格区域展示 Ant Design `Empty` 空状态提示"暂无执行记录"

### Requirement: 快捷入口卡片

工作台首页 SHALL 展示快捷入口区域，包含"新建模板"和"去调试"两个快捷按钮，点击后跳转到对应路由。

#### Scenario: 点击新建模板

- **WHEN** 用户点击"新建模板"快捷按钮
- **THEN** 系统跳转到 `/templates/new`

#### Scenario: 点击去调试

- **WHEN** 用户点击"去调试"快捷按钮
- **THEN** 系统跳转到 `/debug`