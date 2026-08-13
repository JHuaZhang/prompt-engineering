# SSE 流式响应规范

## 后端实现

### 路由层

```python
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_session
from app.services.execute_service import ExecuteService
from app.schemas.execute import ExecuteRequest

router = APIRouter(prefix="/execute", tags=["执行调用"])

@router.post("")
async def execute_template(
    data: ExecuteRequest,
    session: AsyncSession = Depends(get_session),
):
    async def event_stream():
        service = ExecuteService(session)
        try:
            async for chunk in service.stream_execute(data):
                yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
```

### Service 层

```python
class ExecuteService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def stream_execute(self, data: ExecuteRequest) -> AsyncIterator[dict]:
        # 1. 渲染模板
        rendered = await self._render_template(data.template_id, data.variables)

        # 2. 获取适配器
        provider = await self._get_provider(data.provider_id)
        adapter = AdapterRegistry.get(provider.name)

        # 3. 构建 ChatRequest
        request = ChatRequest(
            messages=self._build_messages(rendered),
            model=data.model_name,
            **data.model_params,
            stream=True,
        )

        # 4. 流式调用，逐块 yield
        total_content = ""
        async for chunk in adapter.stream_chat(request):
            total_content += chunk.content
            yield {"content": chunk.content}

        # 5. 结束事件，携带元数据
        yield {
            "done": True,
            "meta": {
                "total_content": total_content,
                "model": data.model_name,
            }
        }

        # 6. 异步保存执行记录
        await self._save_record(data, rendered, total_content)
```

## 事件格式

| 事件类型 | 格式 | 说明 |
|----------|------|------|
| 增量内容 | `data: {"content": "..."}\n\n` | 流式输出文本 |
| 结束 | `data: {"done": true, "meta": {...}}\n\n` | 流结束 + 元数据 |
| 错误 | `data: {"error": "..."}\n\n` | 异常信息 |

## 关键注意点

- `ensure_ascii=False` 保证中文不被转义
- 每个事件以 `\n\n`（两个换行）结尾
- 错误捕获在 Generator 内部，避免连接断开后异常丢失
- 执行记录在流结束后异步保存，不阻塞流式输出