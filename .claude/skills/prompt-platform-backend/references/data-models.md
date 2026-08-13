# 数据模型规范

## 公共 Mixin (`app/models/base.py`)

```python
from datetime import datetime
from sqlalchemy import BigInteger, DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

class CreatedByMixin:
    created_by: Mapped[str] = mapped_column(
        String(64), default="system"
    )
```

## Phase 1 核心表

### prompt_templates

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| name | VARCHAR(128) | 模板名称 |
| description | TEXT | 描述 |
| category_id | BIGINT FK | 分类 ID |
| tags | JSON | 标签数组 |
| formula_type | ENUM | 'RTF','CRAFT','C_C_A','Custom' |
| system_prompt_components | JSON | 系统 Prompt 五大组件 |
| user_prompt_content | TEXT | 用户 Prompt（支持 {{var}}） |
| variables | JSON | 变量定义数组 |
| few_shot_examples | JSON | Few-shot 示例 |
| output_format | JSON | 输出格式约束 |
| model_params | JSON | temperature/top_p/max_tokens |
| status | ENUM | 'draft','active','archived' |
| created_by | VARCHAR(64) | 默认 "system" |
| created_at | DATETIME | 自动 |
| updated_at | DATETIME | 自动 |

### system_prompt_components JSON 结构

```json
{
  "identity_setting": { "background": "", "credentials": "", "expertise": "" },
  "capability_scope": { "can_do": [], "cannot_do": [] },
  "behavior_guidelines": { "must_do": [], "must_not_do": [] },
  "knowledge_scope": { "cutoff_date": "", "limitations": [], "uncertainty_policy": "" },
  "safety_constraints": { "absolute_prohibitions": [], "trigger_mechanisms": [] }
}
```

### variables JSON 结构

```json
[
  {
    "name": "user_input",
    "type": "string",
    "required": true,
    "default": "",
    "description": "用户输入内容"
  }
]
```

### model_providers

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| name | VARCHAR(64) | 供应商名称 |
| base_url | VARCHAR(256) | API 基地址 |
| auth_type | VARCHAR(32) | 认证类型 |
| supported_models | JSON | 支持的模型列表 |
| pricing | JSON | 各模型 token 单价 |
| created_at | DATETIME | 自动 |
| updated_at | DATETIME | 自动 |

### execution_records

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| prompt_template_id | BIGINT FK | 模板 ID |
| model_provider_id | BIGINT FK | 供应商 ID |
| model_name | VARCHAR(64) | 模型名称 |
| rendered_prompt | TEXT | 渲染后的完整 Prompt |
| input_variables | JSON | 本次传入的变量值 |
| response_content | TEXT | 模型返回内容 |
| prompt_tokens | INT | 输入 token 数 |
| completion_tokens | INT | 输出 token 数 |
| total_tokens | INT | 总 token 数 |
| latency_ms | INT | 耗时(毫秒) |
| estimated_cost | DECIMAL(10,4) | 估算费用 |
| status | ENUM | 'success','error','timeout' |
| error_message | TEXT | 错误信息 |
| created_at | DATETIME | 自动 |

## ORM 模型示例

```python
from sqlalchemy import BigInteger, String, Text, JSON, Enum, DECIMAL, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, CreatedByMixin

class PromptTemplate(Base, TimestampMixin, CreatedByMixin):
    __tablename__ = "prompt_templates"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(Text)
    category_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("prompt_categories.id"))
    tags: Mapped[dict] = mapped_column(JSON, default=list)
    formula_type: Mapped[str] = mapped_column(Enum("RTF", "CRAFT", "C_C_A", "Custom"))
    system_prompt_components: Mapped[dict] = mapped_column(JSON, default=dict)
    user_prompt_content: Mapped[str] = mapped_column(Text)
    variables: Mapped[dict] = mapped_column(JSON, default=list)
    few_shot_examples: Mapped[dict] = mapped_column(JSON, default=list)
    output_format: Mapped[dict] = mapped_column(JSON, default=dict)
    model_params: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(Enum("draft", "active", "archived"), default="draft")
```