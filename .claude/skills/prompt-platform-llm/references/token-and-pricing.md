# Token 计数与费用估算

## Token 粗估方案

无 tokenizer 时使用粗估：

```python
def estimate_tokens(text: str) -> int:
    """英文 ~1 token/4 chars，中文 ~1 token/1.5 chars"""
    chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
    other_chars = len(text) - chinese_chars
    return int(chinese_chars / 1.5 + other_chars / 4)
```

## 精确方案（可选）

使用 tiktoken 获取精确 token 数：

```python
import tiktoken

def count_tokens_openai(text: str, model: str = "gpt-4o") -> int:
    enc = tiktoken.encoding_for_model(model)
    return len(enc.encode(text))
```

## 费用计算

定价数据存储在 `model_providers.pricing` JSON 字段：

```json
{
  "gpt-4o": { "input": 0.0025, "output": 0.01 },
  "gpt-4o-mini": { "input": 0.00015, "output": 0.0006 },
  "claude-sonnet-4-20250514": { "input": 0.003, "output": 0.015 },
  "deepseek-chat": { "input": 0.00014, "output": 0.00028 }
}
```

单位：美元 / 1K tokens

```python
def estimate_cost(model: str, prompt_tokens: int, completion_tokens: int, pricing: dict) -> float:
    price = pricing.get(model, {})
    input_cost = prompt_tokens * price.get("input", 0) / 1000
    output_cost = completion_tokens * price.get("output", 0) / 1000
    return round(input_cost + output_cost, 6)
```

## 执行记录中的费用

每次调用完成后，将 `estimated_cost` 写入 `execution_records` 表。费用统一用美元存储，前端展示时自行转换。