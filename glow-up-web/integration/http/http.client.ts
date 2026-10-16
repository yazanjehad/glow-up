import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { attachInterceptors } from "./interceptor";

// Axios instance
const http: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT),
  withCredentials: true,
});

// attach interceptor
attachInterceptors(http);

// HTTP methods
export const get = <T>(url: string, config?: AxiosRequestConfig) =>
  http.get<T>(url, config);

export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  http.post<T>(url, data, config);

export const put = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  http.put<T>(url, data, config);

export const patch = <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
) => http.patch<T>(url, data, config);

export const del = <T>(url: string, config?: AxiosRequestConfig) =>
  http.delete<T>(url, config);
