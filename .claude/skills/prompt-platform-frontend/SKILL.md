---
name: prompt-platform-frontend
description: >
  Prompt 工程化平台的前端开发规范。包含目录结构、组件分层、API 封装、SSE 流式处理、状态管理和路由设计。
  当在 web/ 目录下创建页面、编写 React 组件、封装 API 请求、处理 SSE 流式输出时触发。
paths:
  - web/src/**
  - web/**
allowed-tools: Read, Write, Edit, Grep
---

# 前端开发规范

## 技术栈

React 18 + TypeScript 5.x + Vite + Ant Design 5.x + Zustand + React Router 6

## TypeScript 强制要求

- **必须使用 TypeScript**，禁止 `.js` / `.jsx` 文件，所有代码文件为 `.ts` / `.tsx`
- **TS 严格模式**：`tsconfig.json` 中 `"strict": true`，并启用以下选项：
  - `"noUnusedLocals": true` — 禁止未使用的局部变量
  - `"noUnusedParameters": true` — 禁止未使用的函数参数
  - `"noImplicitReturns": true` — 禁止函数路径缺少返回值
  - `"noFallthroughCasesInSwitch": true` — 禁止 switch 穿透
- **TS 报错即阻断构建**：`vite.config.ts` 中配置 `vite-plugin-checker` 启用 `typescript` 检查，TS 有任何错误时 `npm run dev` 和 `npm run build` 都会失败报错，不允许跳过
- 禁止使用 `any`，如需放宽类型用 `unknown` + 类型守卫
- 禁止使用 `@ts-ignore` / `@ts-nocheck`，如遇第三方类型缺失，编写 `.d.ts` 声明文件

不使用 axios，用自定义 `fetch` 封装统一请求层，普通请求和 SSE 流式请求共用同一封装。

## 目录结构

```
web/src/
├── api/            # API 请求层（fetch 封装，每资源一个文件）
│   ├── request.ts  #   统一 fetch 封装（拦截器、超时、解包、错误处理）
│   ├── sse.ts      #   SSE 流式 fetch 封装（基于 ReadableStream）
│   ├── template.ts #   模板资源 API
│   ├── execute.ts  #   执行资源 API
│   └── types.ts    #   API 层类型定义
├── components/     # 通用组件（跨页面复用，不含业务逻辑）
├── pages/          # 页面组件（负责数据获取和布局）
├── hooks/          # 自定义 Hooks（useSSE / useTemplate / usePagination）
├── store/          # Zustand 全局状态
├── types/          # TypeScript 类型定义
└── utils/          # 工具函数
```

## 组件分层

```
Page → 业务组件(pages/xxx/components/) → 通用组件(components/) → Ant Design
```

- Page：数据获取 + 页面布局 + 路由跳转
- 业务组件：特定业务逻辑，不跨页面复用
- 通用组件：跨页面复用，不含业务逻辑

## API 请求层

基于原生 `fetch` 自定义封装，不使用 axios，原因：
- SSE 流式请求和普通请求共用同一封装层
- 减少第三方依赖
- `fetch` 原生支持 `ReadableStream`，SSE 消费零额外成本

- `src/api/request.ts`：统一 fetch 封装（baseURL、超时、请求/响应拦截、统一解包 `{ code, data, message }`、错误处理）
- `src/api/sse.ts`：SSE 流式 fetch 封装（基于 `ReadableStream`，返回 AsyncIterator）
- 每个资源一个文件，导出函数式 API 对象
- 详见 references/api-conventions.md

## SSE 流式处理

`src/api/sse.ts` 封装流式 fetch，`src/hooks/useSSE.ts` 在此基础上封装为 React Hook。
返回 `{ data, isStreaming, error, start, stop }`。
详见 references/sse-streaming.md

## 状态管理

- 全局共享状态 → Zustand（模型列表、当前选中模板等）
- 页面局部状态 → useState / useReducer
- 不跨页面共享的状态不放全局 store

## 路由设计

```
/templates              → 模板列表
/templates/new          → 新建模板
/templates/:id/edit     → 编辑模板
/debug                  → 调试执行页
/experiments            → 对比实验 (Phase 2)
/evaluation             → 评估面板 (Phase 2)
/test-center            → 测试中心 (Phase 3)
/usage                  → 用量看板 (Phase 2)
```

## 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `TemplateEditor.tsx` |
| 普通文件 | camelCase | `templateApi.ts` |
| 变量/函数 | camelCase | `fetchTemplateList` |
| 类型/接口 | PascalCase | `TemplateVO` |
| 路由路径 | kebab-case | `/debug-wizard` |

## 参考资料

- API 封装规范和示例：references/api-conventions.md
- SSE 流式处理实现细节：references/sse-streaming.md