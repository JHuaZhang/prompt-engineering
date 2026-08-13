## Purpose

前端项目脚手架与基础设施规范，定义 TypeScript 强制检查、fetch 封装、Mock 双模式切换等工程化基线，为所有前端功能模块提供统一的地基。

## ADDED Requirements

### Requirement: TypeScript 严格模式强制启用

前端项目 SHALL 使用 TypeScript 作为唯一开发语言。`tsconfig.json` MUST 开启 `strict: true` 并同时启用 `noUnusedLocals`、`noUnusedParameters`、`noImplicitReturns`、`noFallthroughCasesInSwitch` 四个选项。禁止使用 `any` 类型、`@ts-ignore`、`@ts-nocheck`。

#### Scenario: TS 编译错误阻断 dev 启动

- **WHEN** 开发者编写了包含类型错误的代码并执行 `pnpm dev`
- **THEN** Vite 通过 `vite-plugin-checker` 检测到 TypeScript 错误，dev 服务报错并阻止启动

#### Scenario: TS 编译错误阻断 build

- **WHEN** 开发者执行 `pnpm build` 且代码中存在类型错误
- **THEN** 构建过程报错终止，不产出任何构建产物

### Requirement: 统一 fetch 请求封装

前端项目 SHALL 使用原生 `fetch` 自定义封装统一请求层，禁止使用 axios。封装 MUST 支持：超时控制（`AbortController`）、统一响应解包（`{ code, data, message }`，`code !== 0` 抛出异常）、JSON body 自动序列化。

#### Scenario: 正常请求解包

- **WHEN** 调用 `http.get<T>('/templates')` 且后端返回 `{ code: 0, data: [...], message: "success" }`
- **THEN** 返回 `data` 字段的内容，类型为 `T`

#### Scenario: 业务错误抛出异常

- **WHEN** 后端返回 `{ code: 401, data: null, message: "unauthorized" }`
- **THEN** 抛出 `ApiError` 实例，`code` 为 `401`，`message` 为 `"unauthorized"`

#### Scenario: 请求超时

- **WHEN** 请求超过 30 秒未响应
- **THEN** `AbortController` 触发 abort，请求被终止

### Requirement: Mock 双模式切换

前端项目 SHALL 支持 `pnpm dev`（连后端 API）和 `pnpm mock`（走 Mock 数据）两种开发模式。模式切换通过环境变量 `VITE_USE_MOCK` 控制。Mock 文件 MUST 独立存放在 `web/mock/` 目录，构建产物中 MUST NOT 包含任何 Mock 代码或数据。

#### Scenario: Mock 模式启动

- **WHEN** 执行 `pnpm mock`（即 `cross-env VITE_USE_MOCK=true vite`）
- **THEN** Vite 加载 `vite-plugin-mock` 中间件，所有 `/api/v1/` 请求被 Mock 文件拦截并返回 Mock 数据

#### Scenario: Dev 模式不加载 Mock

- **WHEN** 执行 `pnpm dev`（即 `vite`，`VITE_USE_MOCK` 为 false 或未设置）
- **THEN** Vite 不启用 Mock 中间件，所有请求直连后端 API 地址

#### Scenario: 构建产物不含 Mock

- **WHEN** 执行 `pnpm build`
- **THEN** `vite-plugin-mock` 的 `prodEnabled` 为 `false`，Mock 文件不进入构建产物

### Requirement: 路径别名

前端项目 SHALL 配置路径别名 `@/` 指向 `./src/`，在 TypeScript 和 Vite 中同步生效。

#### Scenario: 使用别名导入

- **WHEN** 代码中写 `import { http } from '@/api/request'`
- **THEN** TypeScript 编译和 Vite 解析都正确解析为 `./src/api/request.ts`