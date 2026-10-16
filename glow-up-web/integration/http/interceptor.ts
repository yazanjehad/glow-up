import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from "axios";

import { isPublicApi } from "./public-apis";
import { TOKEN_KEY } from "@/app/models/constants";

const PUBLIC_PATHS = ["/", "/home"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => p === pathname || pathname.startsWith(p + "/"));
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    // Use raw axios with withCredentials ONLY for refresh (to send httpOnly cookie)
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const newToken = response.data?.accessToken;
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      return newToken;
    }
    return null;
  } catch (err) {
    console.error("[refreshAccessToken] Error:", err);
    return null;
  }
};

const handleLogout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("user");
  
  const pathname = window.location.pathname;
  const isLoginPage = pathname.includes("/login") || pathname.includes("/provider/provider-login");
  const isPublicPage = isPublicPath(pathname);
  if (!isLoginPage && !isPublicPage) {
    window.location.href = "/login";
  }
};

export const attachInterceptors = (http: AxiosInstance) => {
  //  Request
  http.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (typeof window === "undefined") return config;
      
      if (!config.headers) config.headers = new AxiosHeaders();
      
      // Set Accept-Language header based on selected language
      const language = localStorage.getItem("language") || "ar";
      (config.headers as AxiosHeaders).set("Accept-Language", language);
      
      if (isPublicApi(config.url)) return config;
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return config;
      // set bearer
      (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  //  Response 401 - try refresh token
  http.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      
      if (typeof window === "undefined") {
        return Promise.reject(error);
      }

      // Check if 401 and not already retried
      if (error.response?.status === 401 && !originalRequest._retry) {
        // Don't refresh for auth endpoints
        if (originalRequest.url?.includes("/auth/")) {
          handleLogout();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // Queue the request while refreshing
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (token && originalRequest.headers) {
                originalRequest.headers.set("Authorization", `Bearer ${token}`);
              }
              return http(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          
          if (newToken) {
            processQueue(null, newToken);
            if (originalRequest.headers) {
              originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
            }
            return http(originalRequest);
          } else {
            processQueue(error, null);
            handleLogout();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(error, null);
          handleLogout();
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};
