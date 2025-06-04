import type {AxiosError} from 'axios';
import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig} from 'axios';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return config;
});

type IRetriableConfig = AxiosRequestConfig & {_retry?: boolean};

let refreshing: Promise<string | null> | null = null;

const refresh = async (): Promise<string | null> => {
  try {
    const {data} = await axios.post<{token: string}>(
      `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
      {},
      {withCredentials: true},
    );

    setAccessToken(data.token);
    return data.token;
  } catch {
    setAccessToken(null);
    return null;
  }
};

const worthRetrying = (status: number | undefined, config: IRetriableConfig | undefined): boolean => {
  if (!config || config._retry) {
    return false;
  }

  if (status === 401) {
    return true;
  }

  return status === 403 && accessToken === null;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as IRetriableConfig | undefined;

    if (worthRetrying(error.response?.status, config) && config) {
      config._retry = true;

      refreshing ??= refresh().finally(() => {
        refreshing = null;
      });

      const token = await refreshing;

      if (token) {
        return api(config);
      }
    }

    return Promise.reject(error);
  },
);

export const errorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (!error.response) {
    return 'Cannot reach the server. Check your connection and try again.';
  }

  const data = error.response.data as {message?: string} | string | undefined;

  if (typeof data === 'string' && data) {
    return data;
  }

  if (data && typeof data === 'object' && typeof data.message === 'string') {
    return data.message;
  }

  return fallback;
};
