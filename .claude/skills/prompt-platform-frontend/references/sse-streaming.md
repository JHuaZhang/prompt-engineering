# SSE 流式处理实现

## 分层设计

```
src/api/sse.ts          → 底层封装：fetch + ReadableStream → AsyncIterator<SSEEvent>
src/hooks/useSSE.ts     → 上层封装：React Hook，管理状态 + 生命周期
```

底层 `streamSSE()` 已在 references/api-conventions.md 中定义，此处只写 Hook 层。

## useSSE Hook (`src/hooks/useSSE.ts`)

```typescript
import { useState, useCallback, useRef } from 'react';
import { streamSSE } from '@/api/sse';

interface UseSSEOptions {
  url: string;
  body: unknown;
  onChunk?: (text: string) => void;
  onDone?: (meta: Record<string, unknown>) => void;
  onError?: (msg: string) => void;
}

function useSSE() {
  const [data, setData] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async ({ url, body, onChunk, onDone, onError }: UseSSEOptions) => {
    setData('');
    setError(null);
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      for await (const event of streamSSE({ url, body, signal: abortRef.current.signal })) {
        if (event.error) {
          setError(event.error);
          onError?.(event.error);
          break;
        }
        if (event.done) {
          onDone?.(event.meta || {});
          break;
        }
        if (event.content) {
          setData(prev => prev + event.content!);
          onChunk?.(event.content);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      onError?.(msg);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { data, isStreaming, error, start, stop };
}

export { useSSE };
```

## StreamOutput 组件

接收流式数据，实时 Markdown 渲染：
- 使用 `react-markdown` 渲染
- 完成后显示 token 用量、耗时、费用
- 可选打字机效果

## 多模型并排流式 (Phase 2)

对比实验时，多个模型同时流式输出。为每个模型调用独立的 `useSSE` 实例：

```typescript
function useMultiSSE(models: string[]) {
  const [results, setResults] = useState<Record<string, string>>({});
  // 为每个模型创建独立的 useSSE 实例
  // 或封装一个管理多个 streamSSE 的聚合 Hook
}
```

## 关键注意点

- SSE 事件格式：`data: {json}\n\n`（两个换行结尾）
- 后端结束事件：`{"done": true, "meta": {...}}`
- 后端错误事件：`{"error": "message"}`
- 增量内容在 `json.content` 字段，前端做增量拼接
- `AbortController` 用于手动停止流，组件卸载时应在 useEffect cleanup 中调用 `stop()`