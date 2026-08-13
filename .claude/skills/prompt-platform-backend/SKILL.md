---
name: prompt-platform-backend
description: >
  Prompt 工程化平台的后端开发规范。包含 FastAPI 三层架构、SQLAlchemy 异步 ORM 建模、
  Alembic 迁移、SSE 流式响应和配置管理。当在 server/ 目录下创建 API 路由、
  编写 Service 逻辑、设计数据模型、执行数据库迁移时触发。
paths:
  - server/app/**
  - server/**
allowed-tools: Read, Write, Edit, Grep, Bash
---

# 后端开发规范

## 技术栈

Python 3.12.13 + FastAPI + SQLAlchemy 2.x (async) + Alembic + aiomysql + Pydantic 2.x + Jinja2 + httpx

## 三层架构

```
Router (app/api/v1/)  →  Service (app/services/)  →  Model (app/models/)
  路由 + 参数校验        业务逻辑 + 事务管理         ORM 映射 + 表结构
```

- Router 只做参数接收和 Service 调用，不写业务逻辑
- Service 管理事务（commit / rollback），不直接操作 request / response
- Model 只定义表结构，不含业务逻辑

## Router 层规范

```python
@router.post("", response_model=TemplateVO)
async def create_template(
    data: TemplateCreate,
    session: AsyncSession = Depends(get_session),
):
    service = TemplateService(session)
    return await service.create(data)
```

- 用 `Depends` 注入 Session
- `response_model` 声明响应类型
- `tags` 按模块分组

## Service 层规范

```python
class TemplateService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: TemplateCreate) -> Template:
        template = Template(**data.model_dump())
        self.session.add(template)
        await self.session.commit()
        await self.session.refresh(template)
        return template
```

## 数据模型规范

- 公共 Mixin：`TimestampMixin`（created_at / updated_at）+ `CreatedByMixin`
- 主键：`BigInteger, primary_key=True, autoincrement=True`
- JSON 字段：`JSON` 类型
- 表名：snake_case 复数，字段名：snake_case
- Phase 1 核心表结构详见 references/data-models.md

## API 响应格式

```python
class ApiResponse(BaseModel, Generic[T]):
    code: int = 0
    data: Optional[T] = None
    message: str = "success"
```

## SSE 流式响应

```python
@router.post("/execute")
async def execute_template(data: ExecuteRequest):
    async def event_stream():
        async for chunk in execute_service.stream_execute(data):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
    )
```

事件格式：`data: {json}\n\n`，增量在 `content` 字段，结束发送 `{"done": true}`。详见 references/sse-response.md

## Alembic 迁移

```bash
alembic revision --autogenerate -m "create prompt_templates table"
alembic upgrade head
alembic downgrade -1
```

规范：
- 迁移消息用英文
- 新增列必须有默认值或允许 NULL
- 详见 references/migration-guide.md

## 异步编程

- 所有 DB 操作用 `async/await`
- LLM 调用用 `httpx.AsyncClient`
- 并发调用用 `asyncio.gather(return_exceptions=True)`
- 不用 `time.sleep()`，用 `asyncio.sleep()`

## 参考资料

- Phase 1 核心表结构 + 公共 Mixin：references/data-models.md
- SSE 流式响应完整实现：references/sse-response.md
- Alembic 迁移规范：references/migration-guide.md