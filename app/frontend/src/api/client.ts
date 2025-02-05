import type {AxiosError} from 'axios';
import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig} from 'axios';

/**
 * The access token lives in memory, never in localStorage: anything an injected
 * script can read, it can exfiltrate. The refresh token is an httpOnly cookie
 * the browser attaches on its own — which is why `withCredentials` is not
 * optional here.
 */
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

/** A refresh already in flight — concurrent 401s wait on it instead of racing. */
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

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as IRetriableConfig | undefined;

    // 401 means the access token expired but the session is alive: refresh once
    // and replay. 403 means the session itself is gone — retrying would only
    // produce another 403.
    if (error.response?.status === 401 && config && !config._retry) {
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

/**
 * Axios reports a network failure with `response === undefined`. Reading
 * `e.response.data` without checking — as every saga used to — throws a
 * TypeError *inside* the catch block, which killed the saga watcher outright.
 */
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
