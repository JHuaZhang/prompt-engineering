# Prompt Engineering Platform

## 项目概述

Prompt 工程化平台：支持调试不同提示词模板、多模型对比生成效果、五维度评估、版本管理与沉淀。基于系统化的 Prompt 工程知识体系，将理论方法转化为可工程化的后台管理系统。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | React + TypeScript (strict) + Vite + Ant Design | React 18 / TS 5.x / AntD 5.x |
| 后端 | Python + FastAPI + SQLAlchemy (async) + Alembic | Python 3.12.13 |
| 数据库 | MySQL | utf8mb4 |

## 目录结构

```
prompt-engineering/
├── web/                        # 前端 React 18
│   └── src/
│       ├── api/                # API 请求层（fetch 自定义封装）
│       ├── components/         # 通用组件
│       ├── pages/              # 页面组件
│       ├── hooks/              # 自定义 Hooks
│       ├── store/              # Zustand 全局状态
│       ├── types/              # TypeScript 类型
│       └── utils/              # 工具函数
├── server/                     # 后端 FastAPI
│   └── app/
│       ├── api/v1/             # 路由层（Router）
│       ├── core/               # 配置/安全/异常
│       ├── models/             # ORM 数据模型
│       ├── schemas/            # Pydantic 请求/响应
│       ├── services/           # 业务逻辑层
│       └── adapters/           # LLM 适配层
├── docs/                       # 存档文档（表结构/API/页面架构）
│   ├── database.sql            #   所有表的 DDL + 变更历史
│   ├── api.md                  #   所有 API 接口定义
│   └── pages.md                #   所有页面组件树和路由
├── openspec/                   # OpenSpec 规范管理
│   ├── specs/                  # 系统行为规格
│   ├── changes/                # 变更提案
│   └── config.yaml
└── .claude/
    ├── skills/                 # 项目级 Skill（按需加载）
    └── commands/               # OpenSpec 斜杠命令
```

## 编码规范

### 全局约定
- API 统一前缀 `/api/v1/`，RESTful 风格 + SSE 流式
- 统一响应结构 `{ code: 0, data: T, message: string }`
- 数据库所有表含 `id` / `created_at` / `updated_at`，Phase 1-3 含 `created_by`（默认 "system"）
- JSON 字段使用 MySQL `JSON` 类型

### 后端
- 严格三层结构：Router → Service → Model，不可跨层调用
- 异步优先（`async/await`），LLM 调用通过 AdapterRegistry 获取适配器

### 前端
- **强制 TypeScript**：所有文件 `.ts` / `.tsx`，`tsconfig.json` 启用 `strict: true` + `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns` + `noFallthroughCasesInSwitch`
- **TS 报错阻断构建**：通过 `vite-plugin-checker` 在 dev 和 build 时做 TS 检查，有错误即失败，不允许跳过
- **禁止 `any` / `@ts-ignore` / `@ts-nocheck`**，类型不足用 `unknown` + 类型守卫，第三方类型缺失写 `.d.ts`
- 路径别名 `@/` → `./src/`
- 组件命名 PascalCase，API 请求统一走 `src/api/` 层
- 全局状态用 Zustand，页面局部状态用 useState

## 四阶段路线图

| Phase | 目标 | 核心模块 |
|-------|------|---------|
| Phase 1 | Prompt 调试工作台 (MVP) | 模板管理 + 模型执行 + 流式输出 |
| Phase 2 | 多模型对比与效果分析 | 多模型适配 + 对比实验 + 五维度评估 |
| Phase 3 | 版本管理与测试体系 | 版本管理 + 调试向导 + 测试中心 |
| Phase 4 | 高级能力与沉淀 | 多轮对话 + 链式 Prompt + 团队协作 |

## Skill 索引

以下 Skill 放在 `.claude/skills/`，AI 会根据任务场景按需加载：

| Skill | 触发场景 | 位置 |
|-------|---------|------|
| prompt-platform-frontend | 操作 `web/src/**` 下文件时自动触发 | `.claude/skills/prompt-platform-frontend/SKILL.md` |
| prompt-platform-backend | 操作 `server/app/**` 下文件时自动触发 | `.claude/skills/prompt-platform-backend/SKILL.md` |
| prompt-platform-llm | 涉及 LLM 适配器、模型调用、流式处理时语义触发 | `.claude/skills/prompt-platform-llm/SKILL.md` |
| prompt-platform-doc-sync | 操作 `server/app/models/**`、`server/app/api/**`、`web/src/pages/**` 后触发，同步 docs/ 存档文档 | `.claude/skills/prompt-platform-doc-sync/SKILL.md` |

## 禁区

- 不要直接调用 httpx 请求 LLM API，必须通过 AdapterRegistry
- 不要在 Router 层写业务逻辑
- 不要在 api/ 层直接操作数据库
- 不要跳过 Alembic 手动改表结构
- **不要在变更表结构/API/页面后遗漏 docs/ 存档文档同步** — 见 doc-sync Skill

## 运行命令

```bash
# 前端
cd web && npm install && npm run dev

# 后端
cd server && pip install -r requirements.txt && uvicorn app.main:app --reload

# 数据库迁移
cd server && alembic upgrade head

# OpenSpec
openspec list          # 查看活跃变更
openspec validate <id> # 验证规范格式
```