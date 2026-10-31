import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";

interface ErrorResponse {
  message?: string;
}

/** 统一的 HTTP 请求错误。 */
export class HttpError extends Error {
  readonly status?: number;
  readonly data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

/** Axios 客户端实例，供需要直接使用拦截器或高级配置的场景调用。 */
export const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    const message =
      error.response?.data?.message ??
      (error.code === "ECONNABORTED" ? "请求超时，请稍后重试" : error.message);

    return Promise.reject(new HttpError(message, error.response?.status, error.response?.data));
  },
);

/**
 * 发起 HTTP 请求并直接返回响应数据。
 *
 * @typeParam TResponse 接口响应数据类型。
 * @param config Axios 请求配置。
 */
export async function request<TResponse>(config: AxiosRequestConfig): Promise<TResponse> {
  const response = await httpClient.request<TResponse>(config);
  return response.data;
}

/** 发起 GET 请求。 */
export function get<TResponse>(url: string, config?: AxiosRequestConfig): Promise<TResponse> {
  return request<TResponse>({ ...config, method: "GET", url });
}

/** 发起 POST 请求。 */
export function post<TResponse, TData = unknown>(
  url: string,
  data?: TData,
  config?: AxiosRequestConfig<TData>,
): Promise<TResponse> {
  return request<TResponse>({ ...config, method: "POST", url, data });
}

/** 发起 PUT 请求。 */
export function put<TResponse, TData = unknown>(
  url: string,
  data?: TData,
  config?: AxiosRequestConfig<TData>,
): Promise<TResponse> {
  return request<TResponse>({ ...config, method: "PUT", url, data });
}

/** 发起 DELETE 请求。 */
export function del<TResponse>(url: string, config?: AxiosRequestConfig): Promise<TResponse> {
  return request<TResponse>({ ...config, method: "DELETE", url });
}
