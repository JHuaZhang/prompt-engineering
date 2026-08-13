# 各模型 API 差异与适配器实现

## 差异对照表

| 维度 | OpenAI | Claude | 通义千问 | 文心一言 | DeepSeek/Moonshot |
|------|--------|--------|---------|---------|-------------------|
| 端点 | /v1/chat/completions | /v1/messages | DashScope API | /rpc/4.0/chat/completions | /v1/chat/completions |
| 认证 | Authorization: Bearer | x-api-key | Authorization: Bearer | access_token 换取 | Authorization: Bearer |
| system | messages[] 角色 | 顶级 system 字段 | messages[] 角色 | messages[] 角色 | messages[] 角色 |
| 流式 | stream: true | stream: true | stream: true | stream: true | stream: true |
| SSE 事件 | data: {json} | data: {json} | data: {_dashscope} | data: {json} | data: {json} |
| max_tokens | max_tokens | max_tokens | parameters.max_tokens | max_output_tokens | max_tokens |
| 兼容 OpenAI | — | 否 | 部分 | 否 | 是 |

## OpenAI Adapter

适用于 OpenAI 及兼容系（DeepSeek / Moonshot / 智谱），只需改 `base_url`。

```python
class OpenAIAdapter(LLMAdapter):
    def __init__(self, api_key: str, base_url: str = "https://api.openai.com/v1"):
        self.client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=120.0,
        )

    async def chat(self, request: ChatRequest) -> ChatResult:
        resp = await self.client.post("/chat/completions", json={
            "model": request.model,
            "messages": [{"role": m.role, "content": m.content} for m in request.messages],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "stream": False,
        })
        data = resp.json()
        return ChatResult(
            content=data["choices"][0]["message"]["content"],
            prompt_tokens=data["usage"]["prompt_tokens"],
            completion_tokens=data["usage"]["completion_tokens"],
            total_tokens=data["usage"]["total_tokens"],
            model=request.model,
            latency_ms=int(data.get("latency_ms", 0)),
        )

    async def stream_chat(self, request: ChatRequest) -> AsyncIterator[ChatChunk]:
        async with self.client.stream("POST", "/chat/completions", json={
            **request.model_dump(),
            "stream": True,
        }) as resp:
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data = json.loads(line[6:])
                if data.get("choices"):
                    delta = data["choices"][0]["delta"]
                    yield ChatChunk(content=delta.get("content", ""))
```

## Claude Adapter

注意：system 是顶级字段，不在 messages[] 中。

```python
class ClaudeAdapter(LLMAdapter):
    def __init__(self, api_key: str):
        self.client = httpx.AsyncClient(
            base_url="https://api.anthropic.com",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
            },
            timeout=120.0,
        )

    async def chat(self, request: ChatRequest) -> ChatResult:
        # 提取 system 消息
        system_msg = next((m for m in request.messages if m.role == "system"), None)
        chat_msgs = [m for m in request.messages if m.role != "system"]

        resp = await self.client.post("/v1/messages", json={
            "model": request.model,
            "system": system_msg.content if system_msg else None,
            "messages": [{"role": m.role, "content": m.content} for m in chat_msgs],
            "max_tokens": request.max_tokens or 4096,
            "temperature": request.temperature,
        })
        data = resp.json()
        return ChatResult(
            content=data["content"][0]["text"],
            prompt_tokens=data["usage"]["input_tokens"],
            completion_tokens=data["usage"]["output_tokens"],
            total_tokens=data["usage"]["input_tokens"] + data["usage"]["output_tokens"],
            model=request.model,
            latency_ms=0,
        )
```

## 通义千问 Adapter

注意：消息嵌套在 `input.messages` 中，参数在 `parameters` 中。

```python
class QwenAdapter(LLMAdapter):
    def __init__(self, api_key: str):
        self.client = httpx.AsyncClient(
            base_url="https://dashscope.aliyuncs.com",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=120.0,
        )

    async def chat(self, request: ChatRequest) -> ChatResult:
        resp = await self.client.post(
            "/api/v1/services/aigc/text-generation/generation",
            json={
                "model": request.model,
                "input": {
                    "messages": [{"role": m.role, "content": m.content} for m in request.messages]
                },
                "parameters": {
                    "temperature": request.temperature,
                    "max_tokens": request.max_tokens,
                },
            },
        )
        data = resp.json()
        return ChatResult(
            content=data["output"]["text"],
            prompt_tokens=data["usage"]["input_tokens"],
            completion_tokens=data["usage"]["output_tokens"],
            total_tokens=data["usage"]["total_tokens"],
            model=request.model,
            latency_ms=0,
        )
```

## 文心一言 Adapter

注意：需要先用 api_key + secret_key 换取 access_token。

```python
class ErnieAdapter(LLMAdapter):
    def __init__(self, api_key: str, secret_key: str):
        self.client = httpx.AsyncClient(timeout=120.0)
        self._access_token = None
        self._token_url = (
            f"https://aip.baidubce.com/oauth/2.0/token"
            f"?grant_type=client_credentials&client_id={api_key}&client_secret={secret_key}"
        )

    async def _get_access_token(self) -> str:
        if self._access_token:
            return self._access_token
        resp = await self.client.get(self._token_url)
        self._access_token = resp.json()["access_token"]
        return self._access_token

    async def chat(self, request: ChatRequest) -> ChatResult:
        token = await self._get_access_token()
        resp = await self.client.post(
            f"https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token={token}",
            json={
                "messages": [{"role": m.role, "content": m.content} for m in request.messages],
                "temperature": request.temperature,
                "max_output_tokens": request.max_tokens,
            },
        )
        data = resp.json()
        return ChatResult(
            content=data["result"],
            prompt_tokens=data["usage"]["prompt_tokens"],
            completion_tokens=data["usage"]["completion_tokens"],
            total_tokens=data["usage"]["total_tokens"],
            model=request.model,
            latency_ms=0,
        )
```