import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/constants/config";

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Lazy accessor to break circular dependency with auth-store
// (auth-store imports api, api needs auth-store for tokens)
type AuthState = {
  token: string | null;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
};

function getAuthState(): AuthState {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require("@/stores/auth-store");
  return useAuthStore.getState();
}

// Track if a token refresh is already in progress to avoid parallel refreshes
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Request interceptor - attach Firebase ID token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = getAuthState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor - handle auth errors with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Skip retry for login endpoint (token is in body, not header)
    // Skip if already retried to prevent infinite loops
    const isLoginRequest = originalRequest?.url?.includes("/auth/login");
    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      !originalRequest?._retry
    ) {
      if (isRefreshing) {
        // Another refresh is in progress, queue this request
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = getAuthState();
        await refreshToken();
        const newToken = getAuthState().token;
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (error) {
        if (__DEV__) console.warn("Token refresh failed, logging out:", error);
        isRefreshing = false;
        refreshSubscribers = [];
        // Refresh failed - logout (auth guard will redirect to login)
        getAuthState().logout();
      }
    }
    return Promise.reject(error);
  },
);
