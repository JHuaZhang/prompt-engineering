# 存档文档格式模板

## database.sql 格式

```sql
-- 文件头
# 数据库 SQL 存档
# > 本文件记录项目所有数据库表的 DDL 语句和变更历史。每次表结构变更时必须同步更新此文件。

-- 表变更历史表格（Markdown 表格）

-- ---
-- Phase 分隔

-- 每张表一个 ### 标题 + 完整 CREATE TABLE
-- DDL 格式：
--   * 反引号包裹表名和字段名
--   * 含 ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
--   * 含索引（KEY idx_xxx）和外键（CONSTRAINT fk_xxx）
--   * NOT NULL / DEFAULT 明确标注
```

## api.md 格式

```markdown
# API 接口存档

## 接口变更历史
| 日期 | 变更内容 | 关联 Phase |

## Phase X 接口

### 资源名 — /api/v1/xxx

| 方法 | 路径 | 说明 | 请求体 | 响应 |

-- 复杂请求体单独用 JSON 代码块展示
-- SSE 接口标注 "SSE Stream" 并展示事件格式
```

## pages.md 格式

```markdown
# 页面架构存档

## 页面变更历史
| 日期 | 变更内容 | 关联 Phase |

## 路由总表
| 路由 | 页面 | Phase | 说明 |

## Phase X 页面组件树

### PageName（中文名）
用 ASCII 树展示组件层级：
Page (Page)
├── ComponentA
│   └── SubComponent
└── ComponentB
```

## 变更历史记录模板

每次变更在文档头部的变更历史表格追加一行：

```
| 2026-08-13 | 新增 prompt_templates 表 | Phase 1 | alembic/versions/001_create_templates.py |
```

字段说明：
- 日期：YYYY-MM-DD 格式
- 变更内容：简短描述（新增了什么 / 修改了什么 / 删除了什么）
- 关联 Phase：Phase 1-4
- 迁移脚本：仅 database.sql 需要，填 Alembic 迁移文件名