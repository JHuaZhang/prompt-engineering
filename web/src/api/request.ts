const BASE_URL = '/api/v1';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRY = 3;
const RETRY_DELAY = 1000;
const TOKEN_KEY = 'prompt_token';

/** 统一响应结构 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/** 请求配置 */
interface RequestOptions extends Omit<RequestInit, 'body'> {
  timeout?: number;
  retry?: number;
  body?: unknown;
}

/** 自定义错误 */
class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 读取 localStorage 中的 token */
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** 延时工具 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 判断是否可重试：仅网络错误或 5xx 才重试 */
function isRetryable(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.code >= 500;
  }
  // AbortError / TypeError(网络断开) 等可重试
  return true;
}

/** 单次 fetch 请求（不含重试逻辑） */
async function fetchOnce<T>(url: string, options: RequestOptions): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, body, headers, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const token = getToken();

    const response = await fetch(`${BASE_URL}${url}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

/** 核心 fetch 封装（含重试机制） */
async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { retry = DEFAULT_RETRY, ...rest } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      return await fetchOnce<T>(url, rest);
    } catch (error) {
      lastError = error;

      // 最后一次尝试或不可重试的错误，直接抛出
      if (attempt === retry || !isRetryable(error)) {
        throw error;
      }

      // 指数退避：1s, 2s, 4s ...
      await delay(RETRY_DELAY * 2 ** attempt);
    }
  }

  throw lastError;
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

export { ApiError, type ApiResponse, type RequestOptions };