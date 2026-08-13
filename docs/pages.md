# 页面架构存档

> 本文件记录项目所有页面的组件树和路由设计。每次新增或调整页面时必须同步更新此文件。

## 页面变更历史

| 日期 | 变更内容 | 关联 Phase |
|------|---------|-----------|
| 2026-08-13 | 新增 Login、Dashboard 页面 + MainLayout 布局 | Phase 1 |
| 2026-08-13 | 布局从侧边栏改为顶部水平导航；移除 SideBar、BreadcrumbNav；菜单按功能域分组 | Phase 1 |
| 2026-08-13 | Login 页移除 AntD Card 改为自定义 div；Mock 账号提示仅 VITE_USE_MOCK 时显示 | Phase 1 |
| 2026-08-13 | HeaderBar 用户头像从图片改为用户名首字母 + 渐变色背景 | Phase 1 |

---

## 路由总表

| 路由 | 页面 | Phase | 说明 |
|------|------|-------|------|
| `/login` | Login | 1 | 登录页（无需认证） |
| `/dashboard` | Dashboard | 1 | 工作台首页（需认证） |
| `/templates` | TemplateList | 1 | 模板列表（待实现） |
| `/templates/new` | TemplateEditor | 1 | 新建模板（待实现） |
| `/templates/:id/edit` | TemplateEditor | 1 | 编辑模板（待实现） |
| `/debug` | DebugExecute | 1 | 调试执行页（待实现） |
| `/debug/:templateId` | DebugExecute | 1 | 调试指定模板（待实现） |
| `/experiments` | ExperimentList | 2 | 对比实验列表 |
| `/experiments/:id` | ExperimentDetail | 2 | 对比实验详情 |
| `/evaluation` | EvaluationPanel | 2 | 评估面板 |
| `/usage` | UsageDashboard | 2 | 用量看板 |
| `/templates/:id/versions` | VersionManage | 3 | 版本管理 |
| `/test-center` | TestCenter | 3 | 测试中心 |
| `/debug-wizard` | DebugWizard | 3 | 调试向导 |

---

## Phase 1 页面组件树

### MainLayout（主布局）

```
MainLayout (Layout)
├── HeaderBar (sticky, 顶部水平导航)
│   ├── Menu (mode: horizontal, 无 Logo, 无 icon)
│   │   ├── 工作台 (/dashboard)
│   │   ├── 模板管理 ▾
│   │   │   ├── 模板列表 (/templates)
│   │   │   └── 版本管理 (/templates/versions, disabled)
│   │   ├── 调试执行 ▾
│   │   │   ├── 即时调试 (/debug)
│   │   │   └── 调试向导 (/debug-wizard, disabled)
│   │   ├── 实验评估 ▾
│   │   │   ├── 对比实验 (/experiments, disabled)
│   │   │   ├── 评估面板 (/evaluation, disabled)
│   │   │   └── 用量看板 (/usage, disabled)
│   │   └── 测试中心 ▾
│   │       └── 测试用例 (/test-center, disabled)
│   └── Dropdown (用户首字母头像 + 名字 + 退出)
└── Content
    └── <Outlet /> (子路由渲染)
```

### Login（登录页）

```
Login (Page)
└── div.login-container (渐变背景 #667eea → #764ba2)
    └── div.login-card (padding: 40px, border-radius: 16px, box-shadow: 0 20px 60px)
        ├── div.login-header
        │   ├── span (🚀 emoji)
        │   ├── Text ("Prompt Platform", 渐变色)
        │   └── Text ("欢迎登录")
        ├── Form
        │   ├── Form.Item > Input (email, prefix: MailOutlined, size: large)
        │   ├── Form.Item > Input.Password (password, prefix: LockOutlined, size: large)
        │   └── Button (submit, "登录", height: 48px, 渐变背景)
        └── div.login-tip (仅 VITE_USE_MOCK=true 时渲染 "Mock 账号：admin@prompt.dev / 123456")
```

### Dashboard（工作台首页）

```
Dashboard (Page)
├── StatCards (四个统计卡片)
│   └── Row
│       ├── Col > Card > Statistic (模板总数, FileTextOutlined)
│       ├── Col > Card > Statistic (本月执行次数, ThunderboltOutlined)
│       ├── Col > Card > Statistic (活跃模型数, RobotOutlined)
│       └── Col > Card > Statistic (平均耗时, ClockCircleOutlined)
├── QuickActions (快捷入口)
│   └── Card > Space
│       ├── Button (新建模板 → /templates/new)
│       └── Button (去调试 → /debug)
└── RecentExecutions (最近执行记录)
    └── Card > Table
        ├── Column (模板名称)
        ├── Column (模型)
        ├── Column (状态, Tag)
        ├── Column (耗时 ms)
        ├── Column (Token 消耗)
        └── Column (执行时间)
```

---

## Phase 2 页面组件树

> 待 Phase 2 启动时补充：ExperimentDetail（多模型并排流式卡片）、EvaluationPanel（五维度雷达图 + 评分卡）、UsageDashboard

---

## Phase 3 页面组件树

> 待 Phase 3 启动时补充：VersionManage（时间轴 + diff）、DebugWizard（四步引导）、TestCenter（测试执行面板 + 报告）

---

## Phase 4 页面组件树

> 待 Phase 4 启动时补充：对话调试界面、链式编排器、登录页增强