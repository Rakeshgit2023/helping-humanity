import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

import { env } from '@/config/env';
import { STORAGE_KEYS } from '@/constants/config';
import { secureStorage } from '@/services/storage/secureStorage';
import { ENDPOINTS } from '@/services/api/endpoints';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await secureStorage.getItem(STORAGE_KEYS.refreshToken);
  if (!refreshToken) return null;

  try {
    const response = await axios.get<{
      message: string;
      data: { accessToken: string; refreshToken?: string };
    }>(`${env.apiUrl}${ENDPOINTS.auth.refresh}`, { params: { refreshToken } });

    const { accessToken, refreshToken: nextRefreshToken } = response.data.data;
    await secureStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    if (nextRefreshToken) {
      await secureStorage.setItem(STORAGE_KEYS.refreshToken, nextRefreshToken);
    }
    return accessToken;
  } catch {
    await secureStorage.removeItem(STORAGE_KEYS.accessToken);
    await secureStorage.removeItem(STORAGE_KEYS.refreshToken);
    await secureStorage.removeItem(STORAGE_KEYS.user);
    return null;
  }
}

export function attachInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await secureStorage.getItem(STORAGE_KEYS.accessToken);
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    if (__DEV__) {
      console.log(`[api] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      if (config.data) {
        console.log('[api] → payload:', JSON.stringify(config.data, null, 2));
      }
      if (config.params) {
        console.log('[api] → params:', JSON.stringify(config.params, null, 2));
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      if (__DEV__) {
        console.log(`[api] ← ${response.status} ${response.config.url}`);
        console.log('[api] ← body:', JSON.stringify(response.data, null, 2));
      }
      return response;
    },
    async (error) => {
      if (__DEV__) {
        console.log(
          `[api] ✗ ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url} — ${error.message}`,
        );
        if (error.response?.data) {
          console.log('[api] ✗ body:', JSON.stringify(error.response.data, null, 2));
        }
      }
      const originalRequest = error.config as RetriableRequestConfig | undefined;

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        refreshPromise = refreshPromise ?? refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;

        if (newToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
          return instance(originalRequest as AxiosRequestConfig);
        }
      }

      return Promise.reject(error);
    },
  );
}
