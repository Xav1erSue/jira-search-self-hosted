import { PresentableError } from "./exception";

export interface PreferenceValue {
  /** 域名 */
  baseURL: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

export type StatusErrors = Record<number, PresentableError>;

export interface JiraFetchOptions {
  /** 请求方法 */
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** 请求参数 */
  params?: Record<string, string>;
  /** 请求体 */
  body?: Record<string, string>;
  /** 状态码错误 */
  statusErrors?: StatusErrors;
}
