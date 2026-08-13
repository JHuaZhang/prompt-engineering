# 适配器核心接口与数据结构

## 数据结构 (`app/adapters/base.py`)

```python
from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str  # "system" | "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str
    temperature: float = 0.7
    top_p: float = 1.0
    max_tokens: Optional[int] = None
    stream: bool = False

class ChatChunk(BaseModel):
    content: str
    finish_reason: Optional[str] = None

class ChatResult(BaseModel):
    content: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    model: str
    latency_ms: int

class LLMAdapter(ABC):
    @abstractmethod
    async def chat(self, request: ChatRequest) -> ChatResult: ...

    @abstractmethod
    async def stream_chat(self, request: ChatRequest) -> AsyncIterator[ChatChunk]: ...

    @abstractmethod
    def count_tokens(self, messages: list[ChatMessage], model: str) -> int: ...
```

## 注册表 (`app/adapters/registry.py`)

```python
class AdapterRegistry:
    _adapters: dict[str, LLMAdapter] = {}

    @classmethod
    def init(cls):
        cls._adapters["openai"] = OpenAIAdapter(settings.OPENAI_API_KEY)
        cls._adapters["claude"] = ClaudeAdapter(settings.CLAUDE_API_KEY)
        cls._adapters["qwen"] = QwenAdapter(settings.QWEN_API_KEY)
        cls._adapters["ernie"] = ErnieAdapter(settings.ERNIE_API_KEY, settings.ERNIE_SECRET_KEY)
        cls._adapters["deepseek"] = OpenAIAdapter(settings.DEEPSEEK_API_KEY, "https://api.deepseek.com/v1")
        cls._adapters["moonshot"] = OpenAIAdapter(settings.MOONSHOT_API_KEY, "https://api.moonshot.cn/v1")

    @classmethod
    def get(cls, provider: str) -> LLMAdapter:
        adapter = cls._adapters.get(provider)
        if not adapter:
            raise ValueError(f"Unknown provider: {provider}")
        return adapter
```

## 统一异常 (`app/adapters/base.py`)

```python
class LLMError(Exception): pass
class RateLimitError(LLMError): pass
class TimeoutError(LLMError): pass
class ContentFilterError(LLMError): pass
class InsufficientQuotaError(LLMError): pass
```

## 重试策略

```python
MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]

async def call_with_retry(adapter, request):
    for attempt in range(MAX_RETRIES):
        try:
            return await adapter.chat(request)
        except (RateLimitError, TimeoutError):
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAYS[attempt])
            else:
                raise
        except (ContentFilterError, InsufficientQuotaError, LLMError):
            raise  # 不重试
```

## 消息构建流程

```
1. Jinja2 渲染模板 → system_prompt + user_prompt
2. 组装 ChatMessage 列表（Adapter 内部做格式转换）
3. Few-shot 示例注入到 user message 前
4. 参数从 model_params 取，传入 ChatRequest
```