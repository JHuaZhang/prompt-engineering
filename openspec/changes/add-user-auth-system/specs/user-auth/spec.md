## Purpose

用户认证体系提供登录、登出、首次设置、密码重置和 Token 鉴权能力，支撑平台所有需要身份验证的功能模块。

## ADDED Requirements

### Requirement: 邮箱密码登录

用户 SHALL 使用邮箱和密码进行登录。系统 MUST 验证邮箱和密码的正确性，登录成功后返回 JWT token 和用户信息。

#### Scenario: 正常登录

- **WHEN** 用户输入正确的邮箱和密码，且用户状态为 active
- **THEN** 系统返回 JWT token（包含 user_id、role、status）和用户信息（id、email、username、role、status）

#### Scenario: 待设置用户首次登录

- **WHEN** 用户输入邮箱和密码（初始密码 123456），且用户状态为 pending_setup
- **THEN** 系统返回 code=1001 和一个受限 temp_token（仅可调用 /auth/setup 接口），message 为"首次登录，请设置用户名和密码"

#### Scenario: 被重置密码用户登录

- **WHEN** 用户输入邮箱和密码（重置密码 123456），且用户状态为 password_reset
- **THEN** 系统返回 code=1002 和一个受限 temp_token（仅可调用 /auth/reset-password 接口），message 为"密码已被重置，请设置新密码"

#### Scenario: 邮箱不存在

- **WHEN** 用户输入的邮箱在系统中不存在
- **THEN** 系统返回 code=401，message 为"邮箱或密码错误"

#### Scenario: 密码错误

- **WHEN** 用户输入的邮箱存在但密码不正确
- **THEN** 系统返回 code=401，message 为"邮箱或密码错误"

### Requirement: 首次设置用户名和密码

处于 pending_setup 状态的用户 SHALL 通过 /auth/setup 接口设置用户名和密码。设置成功后用户状态变为 active。

#### Scenario: 成功设置

- **WHEN** 用户使用 temp_token 调用 /auth/setup，提供有效的用户名（2-64 字符）和密码（6-128 字符）
- **THEN** 系统将用户状态更新为 active，设置用户名和密码哈希，返回新的完整 JWT token 和用户信息

#### Scenario: 用户名已存在

- **WHEN** 用户提供的用户名已被其他用户使用
- **THEN** 系统返回 code=409，message 为"用户名已存在"

#### Scenario: 无效 temp_token

- **WHEN** 用户使用无效或过期的 temp_token 调用 /auth/setup
- **THEN** 系统返回 code=401，message 为"token 无效或已过期"

### Requirement: 重置后设置新密码

处于 password_reset 状态的用户 SHALL 通过 /auth/reset-password 接口设置新密码。设置成功后用户状态变为 active。

#### Scenario: 成功重设密码

- **WHEN** 用户使用 temp_token 调用 /auth/reset-password，提供有效的新密码（6-128 字符，不能为 123456）
- **THEN** 系统将用户状态更新为 active，更新密码哈希，返回新的完整 JWT token 和用户信息

#### Scenario: 新密码为默认密码

- **WHEN** 用户提供的密码为 123456
- **THEN** 系统返回 code=400，message 为"新密码不能与默认密码相同"

#### Scenario: 无效 temp_token

- **WHEN** 用户使用无效或过期的 temp_token 调用 /auth/reset-password
- **THEN** 系统返回 code=401，message 为"token 无效或已过期"

### Requirement: Token 鉴权

系统 MUST 通过 JWT token 进行 API 鉴权。token 分为完整 token 和受限 temp_token 两种。

#### Scenario: 完整 token 访问

- **WHEN** 请求携带有效完整 token（用户状态为 active）
- **THEN** 系统允许访问该用户角色权限范围内的所有 API

#### Scenario: 受限 token 访问受限接口

- **WHEN** 请求携带有效 temp_token（用户状态为 pending_setup 或 password_reset）访问 /auth/setup 或 /auth/reset-password
- **THEN** 系统允许访问

#### Scenario: 受限 token 访问其他接口

- **WHEN** 请求携带有效 temp_token 访问 /auth/setup 和 /auth/reset-password 以外的任何 API
- **THEN** 系统返回 code=403，message 为"请先完成密码设置"

#### Scenario: 无 token 访问受保护接口

- **WHEN** 请求未携带 token 访问受保护接口
- **THEN** 系统返回 code=401，message 为"未登录"

### Requirement: 获取当前用户信息

已登录用户 SHALL 通过 /auth/profile 获取自己的用户信息。

#### Scenario: 成功获取

- **WHEN** 用户使用有效完整 token 调用 /auth/profile
- **THEN** 系统返回用户信息（id、email、username、role、status）

### Requirement: 登出

用户 SHALL 通过 /auth/logout 登出。登出后 token 失效。

#### Scenario: 成功登出

- **WHEN** 用户使用有效 token 调用 /auth/logout
- **THEN** 系统使当前 token 失效（加入黑名单），返回成功

### Requirement: root 用户手动创建

root 超级管理员 SHALL 通过 CLI 脚本手动创建。CLI 脚本 MUST 使用 bcrypt 算法生成密码哈希并写入数据库。

#### Scenario: 成功创建 root

- **WHEN** 管理员执行 CLI 命令，提供邮箱、用户名和密码
- **THEN** 系统使用 bcrypt 生成密码哈希，在 users 表中创建一条 role=root、status=active 的记录

#### Scenario: 邮箱已存在

- **WHEN** 提供的邮箱已存在于 users 表中
- **THEN** 系统返回错误"邮箱已存在"，不创建记录
