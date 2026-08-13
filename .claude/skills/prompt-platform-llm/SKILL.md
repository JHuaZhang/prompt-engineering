---
name: prompt-platform-llm
description: >
  Prompt 工程化平台的 LLM 适配与集成规范。包含多模型统一适配层设计（Strategy 模式）、
  流式调用、统一错误处理、token 计数与费用估算。
  当涉及调用 LLM API、新增模型适配器、处理流式响应、计算 token 用量、设计多模型并发对比时触发。
  关键词：LLM、模型调用、OpenAI、Claude、通义千问、文心一言、DeepSeek、流式、SSE、适配器、adapter。
allowed-tools: Read, Write, Edit, Grep
---

# LLM 适配与集成规范

## 适配层架构

```
Service 层 → AdapterRegistry.get(provider) → 具体 Adapter → LLM API
```

统一的抽象基类 `LLMAdapter`，每个模型供应商一个实现类。Service 层只传 `ChatRequest`，Adapter 内部完成消息格式转换。

## 核心接口 (`app/adapters/base.py`)

```python
class LLMAdapter(ABC):
    @abstractmethod
    async def chat(self, request: ChatRequest) -> ChatResult: ...

    @abstractmethod
    async def stream_chat(self, request: ChatRequest) -> AsyncIterator[ChatChunk]: ...

    @abstractmethod
    def count_tokens(self, messages: list[ChatMessage], model: str) -> int: ...
```

统一数据结构：`ChatMessage` / `ChatRequest` / `ChatChunk` / `ChatResult`。详见 references/adapter-contracts.md

## 适配器注册表 (`app/adapters/registry.py`)

应用启动时初始化所有 Adapter，Service 层通过 `AdapterRegistry.get(provider_name)` 获取实例。

## 模型差异速查

| 维度 | OpenAI | Claude | 通义千问 | 文心一言 |
|------|--------|--------|---------|---------|
| 认证 | Bearer Token | x-api-key | Bearer Token | access_token 换取 |
| system 角色 | messages[] 中 | 顶级字段 | messages[] 中 | messages[] 中 |
| max_tokens | max_tokens | max_tokens | parameters 内 | max_output_tokens |

OpenAI 兼容系（DeepSeek / Moonshot / 智谱）可复用 `OpenAIAdapter`，只需改 `base_url`。

详见 references/model-differences.md

## 统一错误处理

| 异常类 | 触发条件 | 是否重试 |
|--------|---------|---------|
| `RateLimitError` | HTTP 429 | 是（指数退避） |
| `TimeoutError` | 请求超时 | 是（指数退避） |
| `ContentFilterError` | 内容审核拦截 | 否 |
| `InsufficientQuotaError` | 余额不足 | 否 |

## Token 计数与费用

- 粗估：英文 ~1 token/4 chars，中文 ~1 token/1.5 chars
- 定价数据存 `model_providers.pricing` JSON 字段
- 详见 references/token-and-pricing.md

## 多模型并发调用

```python
results = await asyncio.gather(
    *[execute_single(template, variables, config) for config in model_configs],
    return_exceptions=True,
)
```

每个模型独立记录到 `execution_records`，一个失败不影响其他。

## 参考资料

- 适配器核心接口和数据结构：references/adapter-contract.md
- 各模型 API 差异与适配器实现：references/model-differences.md
- Token 计数与费用估算：references/token-and-pricing.md