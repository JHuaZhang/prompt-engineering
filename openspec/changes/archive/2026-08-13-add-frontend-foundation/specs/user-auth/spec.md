## Purpose

用户认证功能规范，定义邮箱密码登录、登出、token 管理和登录守卫的行为，确保未登录用户无法访问后台页面。

## ADDED Requirements

### Requirement: 邮箱密码登录

系统 SHALL 提供邮箱 + 密码的登录表单。用户输入邮箱和密码后，系统调用 `POST /api/v1/auth/login` 进行认证。认证成功后返回 token 和用户信息，token 持久化到 `localStorage`，用户信息存入 Zustand store。

#### Scenario: 登录成功

- **WHEN** 用户输入正确邮箱（如 `admin@prompt.dev`）和密码（如 `123456`）并点击登录
- **THEN** 系统调用登录 API，收到 `{ token, user }` 后将 token 存入 `localStorage`，用户信息存入 Zustand，跳转到 `/dashboard`

#### Scenario: 登录失败

- **WHEN** 用户输入错误邮箱或密码并点击登录
- **THEN** 表单展示错误提示"邮箱或密码错误"，不跳转页面，token 不被存储

#### Scenario: 表单校验

- **WHEN** 用户未输入邮箱或密码格式不正确（不含 `@`）就点击登录
- **THEN** 表单校验失败，对应输入框下方展示校验错误信息，不发起 API 请求

### Requirement: 登出

系统 SHALL 提供登出功能。用户点击登出后，系统调用 `POST /api/v1/auth/logout`，清除 `localStorage` 中的 token 和 Zustand 中的用户信息，跳转到 `/login`。

#### Scenario: 用户登出

- **WHEN** 已登录用户点击顶栏的退出按钮
- **THEN** 系统清除 token 和用户信息，跳转到 `/login` 页面

### Requirement: 登录守卫

系统 SHALL 对所有需要认证的路由实施登录守卫。未携带有效 token 的访问 MUST 重定向到 `/login`，登录成功后回跳到原目标页面。

#### Scenario: 未登录访问受保护页面

- **WHEN** 用户未登录（`localStorage` 中无 token）并访问 `/dashboard`
- **THEN** 系统重定向到 `/login`，并在 URL 中记录原始目标路径

#### Scenario: 登录后回跳

- **WHEN** 用户从 `/login` 登录成功，且之前有记录的目标路径
- **THEN** 系统跳转到记录的目标路径而非默认的 `/dashboard`

### Requirement: Token 持久化

系统 SHALL 将认证 token 存储在 `localStorage` 中，key 为 `prompt_token`。页面刷新后 token 不丢失，Zustand store 在初始化时从 `localStorage` 恢复 token。

#### Scenario: 页面刷新保持登录

- **WHEN** 已登录用户刷新浏览器
- **THEN** Zustand store 从 `localStorage` 恢复 token，用户保持登录状态，不需要重新登录