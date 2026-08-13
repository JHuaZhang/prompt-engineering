# 数据库 SQL 存档

> 本文件记录项目所有数据库表的 DDL 语句和变更历史。每次表结构变更时必须同步更新此文件。

## 表变更历史

| 日期 | 变更内容 | 关联 Phase | 迁移脚本 |
|------|---------|-----------|---------|
| — | 文档初始化（Phase 1 表结构预定义） | — | — |

---

## Phase 1 表结构

> Phase 1 表结构为预定义，实际创建将在后端变更合并 Alembic 迁移时生效

### prompt_categories

```sql
CREATE TABLE `prompt_categories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL,
  `parent_id` BIGINT DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### prompt_templates

```sql
CREATE TABLE `prompt_templates` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(128) NOT NULL,
  `description` TEXT,
  `category_id` BIGINT DEFAULT NULL,
  `tags` JSON,
  `formula_type` ENUM('RTF','CRAFT','C_C_A','Custom') NOT NULL,
  `system_prompt_components` JSON,
  `user_prompt_content` TEXT NOT NULL,
  `variables` JSON,
  `few_shot_examples` JSON,
  `output_format` JSON,
  `model_params` JSON,
  `status` ENUM('draft','active','archived') NOT NULL DEFAULT 'draft',
  `created_by` VARCHAR(64) NOT NULL DEFAULT 'system',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_templates_category` FOREIGN KEY (`category_id`) REFERENCES `prompt_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### model_providers

```sql
CREATE TABLE `model_providers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL,
  `base_url` VARCHAR(256) NOT NULL,
  `auth_type` VARCHAR(32) NOT NULL DEFAULT 'bearer',
  `supported_models` JSON,
  `pricing` JSON,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### execution_records

```sql
CREATE TABLE `execution_records` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `prompt_template_id` BIGINT NOT NULL,
  `model_provider_id` BIGINT NOT NULL,
  `model_name` VARCHAR(64) NOT NULL,
  `rendered_prompt` TEXT,
  `input_variables` JSON,
  `response_content` TEXT,
  `prompt_tokens` INT DEFAULT 0,
  `completion_tokens` INT DEFAULT 0,
  `total_tokens` INT DEFAULT 0,
  `latency_ms` INT DEFAULT 0,
  `estimated_cost` DECIMAL(10,4) DEFAULT 0,
  `status` ENUM('success','error','timeout') NOT NULL DEFAULT 'success',
  `error_message` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_template_id` (`prompt_template_id`),
  KEY `idx_provider_id` (`model_provider_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_exec_template` FOREIGN KEY (`prompt_template_id`) REFERENCES `prompt_templates` (`id`),
  CONSTRAINT `fk_exec_provider` FOREIGN KEY (`model_provider_id`) REFERENCES `model_providers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Phase 2 表结构

> 待 Phase 2 启动时补充：experiments、evaluation_dimensions、evaluation_results、score_rubrics、weight_configs

---

## Phase 3 表结构

> 待 Phase 3 启动时补充：prompt_versions、debug_sessions、optimization_rounds、test_datasets、test_cases、test_runs

---

## Phase 4 表结构

> 待 Phase 4 启动时补充：users、conversation_sessions、conversation_messages、prompt_chains