# API 请求层规范

不使用 axios，基于原生 `fetch` 自定义封装统一请求层。普通请求和 SSE 流式请求共用同一封装基础。

## 统一 fetch 封装 (`src/api/request.ts`)

```typescript
const BASE_URL = '/api/v1';
const DEFAULT_TIMEOUT = 30000;

/** 统一响应结构 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/** 请求配置 */
interface RequestOptions extends Omit<RequestInit, 'body'> {
  timeout?: number;
  body?: unknown; // 自动 JSON.stringify
}

/** 自定义错误 */
class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

/** 核心 fetch 封装 */
async function request<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, body, headers, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP ${response.status}`);
    }

    const json: ApiResponse<T> = await response.json();

    if (json.code !== 0) {
      throw new ApiError(json.code, json.message);
    }

    return json.data;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 快捷方法 */
export const http = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'POST', body }),

  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'PUT', body }),

  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};

export { ApiError, type ApiResponse };
```

## SSE 流式 fetch 封装 (`src/api/sse.ts`)

与 `request.ts` 共用 `BASE_URL`，但返回 `AsyncIterator` 而非 `Promise`：

```typescript
const BASE_URL = '/api/v1';

interface SSEOptions {
  url: string;
  body: unknown;
  signal?: AbortSignal;
}

interface SSEEvent {
  content?: string;
  done?: boolean;
  error?: string;
  meta?: Record<string, unknown>;
}

async function* streamSSE(options: SSEOptions): AsyncIterator<SSEEvent> {
  const response = await fetch(`${BASE_URL}${options.url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options.body),
    signal: options.signal,
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No readable stream');

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      yield JSON.parse(line.slice(6)) as SSEEvent;
    }
  }
}

export { streamSSE, type SSEEvent };
```

## API 文件示例 (`src/api/template.ts`)

```typescript
import { http } from './request';
import type { Template, TemplateListParams, CreateTemplateDTO } from './types';

export const templateApi = {
  list: (params: TemplateListParams) =>
    http.get<Template[]>('/templates', { params }),
  detail: (id: number) =>
    http.get<Template>(`/templates/${id}`),
  create: (data: CreateTemplateDTO) =>
    http.post<Template>('/templates', data),
  update: (id: number, data: Partial<CreateTemplateDTO>) =>
    http.put<Template>(`/templates/${id}`, data),
  delete: (id: number) =>
    http.delete(`/templates/${id}`),
  render: (id: number, variables: Record<string, unknown>) =>
    http.post(`/templates/${id}/render`, { variables }),
};
```

## 统一响应类型 (`src/api/types.ts`)

```typescript
interface PaginationVO<T> {
  total: number;
  page: number;
  page_size: number;
  list: T[];
}
```

## 分页参数

统一使用 `page`（default 1）+ `page_size`（default 20），后端返回 `PaginationVO<T>`。

## 设计要点

| 关注点 | 实现方式 |
|--------|---------|
| 超时控制 | `AbortController` + `setTimeout` |
| 统一解包 | 解析 `{ code, data, message }`，code !== 0 抛 `ApiError` |
| 请求/响应拦截 | `request()` 函数内统一处理（可在此加 token 等逻辑） |
| SSE 流式 | 独立 `streamSSE()` 函数，返回 `AsyncIterator`，与普通请求共用 `BASE_URL` |
| 错误类型 | 自定义 `ApiError`（含 code 字段），调用方可按 code 分流处理 |
| 依赖 | 零第三方依赖，纯原生 `fetch` |