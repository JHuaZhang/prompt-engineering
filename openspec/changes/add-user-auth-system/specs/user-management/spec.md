## Purpose

用户管理提供用户列表查看、创建用户、修改角色、重置密码和删除用户能力，由 root 和 admin 角色使用，支撑平台的权限分级管理。

## ADDED Requirements

### Requirement: 用户列表

root 和 admin 角色 SHALL 通过 /api/v1/users 查看用户列表。

#### Scenario: 成功获取列表

- **WHEN** root 或 admin 用户请求 /api/v1/users
- **THEN** 系统返回所有用户列表（id、email、username、role、status、created_at）

#### Scenario: 普通用户访问

- **WHEN** role=user 的用户请求 /api/v1/users
- **THEN** 系统返回 code=403，message 为"无权限"

### Requirement: 创建用户

root 和 admin 角色 SHALL 通过 /api/v1/users 创建新用户。创建时仅需提供邮箱，初始密码为 123456，用户状态为 pending_setup。

#### Scenario: root 创建用户

- **WHEN** root 用户提供有效邮箱调用 /api/v1/users
- **THEN** 系统创建一条新用户记录，role=user，status=pending_setup，password_hash 为 123456 的 bcrypt 哈希，返回用户信息

#### Scenario: admin 创建用户

- **WHEN** admin 用户提供有效邮箱调用 /api/v1/users
- **THEN** 系统创建一条新用户记录，role=user，status=pending_setup，password_hash 为 123456 的 bcrypt 哈希，返回用户信息

#### Scenario: 邮箱已存在

- **WHEN** 提供的邮箱已被使用
- **THEN** 系统返回 code=409，message 为"邮箱已存在"

#### Scenario: 普通用户创建

- **WHEN** role=user 的用户调用 /api/v1/users
- **THEN** 系统返回 code=403，message 为"无权限"

### Requirement: 重置用户密码

root 和 admin 角色 SHALL 通过 /api/v1/users/{id}/reset-password 重置其他用户的密码。重置后密码为 123456，用户状态变为 password_reset。

#### Scenario: root 重置普通用户密码

- **WHEN** root 用户请求重置某个 user 角色用户的密码
- **THEN** 系统将该用户密码重置为 123456（bcrypt 哈希），状态改为 password_reset

#### Scenario: admin 重置普通用户密码

- **WHEN** admin 用户请求重置某个 user 角色用户的密码
- **THEN** 系统将该用户密码重置为 123456（bcrypt 哈希），状态改为 password_reset

#### Scenario: admin 重置其他 admin 密码

- **WHEN** admin 用户请求重置另一个 admin 用户的密码
- **THEN** 系统返回 code=403，message 为"无法操作同级或更高权限用户"

#### Scenario: admin 重置 root 密码

- **WHEN** admin 用户请求重置 root 用户的密码
- **THEN** 系统返回 code=403，message 为"无法操作同级或更高权限用户"

#### Scenario: 重置自己密码

- **WHEN** root 或 admin 用户请求重置自己的密码
- **THEN** 系统返回 code=400，message 为"无法重置自己的密码，请使用修改密码功能"

### Requirement: 修改用户角色

root 角色 SHALL 通过 /api/v1/users/{id}/role 修改其他用户的角色。admin 可以在 user 和 admin 之间切换角色。

#### Scenario: root 修改用户角色

- **WHEN** root 用户将某个用户的角色修改为 admin 或 user
- **THEN** 系统更新该用户的角色字段

#### Scenario: admin 提升用户为 admin

- **WHEN** admin 用户将某个 user 角色用户提升为 admin
- **THEN** 系统更新该用户的角色为 admin

#### Scenario: admin 降级 admin 为 user

- **WHEN** admin 用户将某个 admin 角色用户降级为 user
- **THEN** 系统更新该用户的角色为 user

#### Scenario: admin 修改 root 角色

- **WHEN** admin 用户尝试修改 root 用户的角色
- **THEN** 系统返回 code=403，message 为"无法操作 root 用户"

#### Scenario: 任何人修改 root 角色

- **WHEN** 任何用户尝试将 root 用户的角色改为其他角色
- **THEN** 系统返回 code=403，message 为"root 角色不可变更"

#### Scenario: admin 尝试授予 root 角色

- **WHEN** admin 用户尝试将某个用户的角色修改为 root
- **THEN** 系统返回 code=403，message 为"无权授予 root 角色"

### Requirement: 删除用户

root 角色 SHALL 通过 /api/v1/users/{id} 删除用户。admin 只能删除 user 角色用户。

#### Scenario: root 删除用户

- **WHEN** root 用户删除某个非 root 用户
- **THEN** 系统删除该用户记录

#### Scenario: admin 删除普通用户

- **WHEN** admin 用户删除某个 user 角色用户
- **THEN** 系统删除该用户记录

#### Scenario: admin 删除其他 admin

- **WHEN** admin 用户删除另一个 admin 用户
- **THEN** 系统返回 code=403，message 为"无法操作同级或更高权限用户"

#### Scenario: 删除 root 用户

- **WHEN** 任何用户尝试删除 root 用户
- **THEN** 系统返回 code=403，message 为"root 用户不可删除"

#### Scenario: 删除自己

- **WHEN** 任何用户尝试删除自己
- **THEN** 系统返回 code=400，message 为"无法删除自己的账户"
