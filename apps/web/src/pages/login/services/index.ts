import { get, post } from "../../../api";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthenticatedAdmin {
  id: number;
  username: string;
  displayName: string;
}

export interface LoginResponse {
  message: string;
  data: {
    user: AuthenticatedAdmin;
  };
}

export interface CurrentAdminResponse {
  data: {
    user: AuthenticatedAdmin;
  };
}

/** 使用 HttpOnly Cookie 建立管理员登录会话。 */
export function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return post<LoginResponse, LoginCredentials>("/auth/login", credentials);
}

/** 获取当前 Cookie 会话对应的管理员。 */
export function getCurrentAdmin(): Promise<CurrentAdminResponse> {
  return get<CurrentAdminResponse>("/auth/me");
}

/** 清除当前管理员的登录 Cookie。 */
export function logout(): Promise<void> {
  return post<void>("/auth/logout");
}
