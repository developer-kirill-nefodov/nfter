import type {AxiosError} from 'axios';
import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig} from 'axios';

let accessToken: string | null = null;

const SESSION_FLAG = 'nfter:session';

const rememberSession = (exists: boolean) => {
  try {
    if (exists) {
      window.localStorage.setItem(SESSION_FLAG, '1');
    } else {
      window.localStorage.removeItem(SESSION_FLAG);
    }
  } catch {
    return;
  }
};

export const hasSession = (): boolean => {
  try {
    return window.localStorage.getItem(SESSION_FLAG) === '1';
  } catch {
    return false;
  }
};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  rememberSession(token !== null);
};

export const SESSION_ENDED = 'nfter:session-ended';

// `notify` distinguishes an involuntary expiry (the server refused our refresh) from a deliberate
// sign-out. Only the former should raise the "your session has ended" warning; a user who clicked
// Log out did not lose anything and should not be told they did.
export const endSession = ({notify = true} = {}) => {
  const had = hasSession();

  accessToken = null;
  rememberSession(false);

  if (had && notify) {
    window.dispatchEvent(new CustomEvent(SESSION_ENDED));
  }
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

const spendRefreshCookie = async (): Promise<string | null> => {
  if (!hasSession()) {
    return null;
  }

  try {
    const {data} = await axios.post<{token: string}>(
      `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
      {},
      {withCredentials: true},
    );

    setAccessToken(data.token);
    return data.token;
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const refused = status === 401 || status === 403;

    if (refused) {
      endSession();
    } else {
      accessToken = null;
    }

    return null;
  }
};

const REFRESH_LOCK = 'nfter:auth-refresh';

const refresh = async (): Promise<string | null> => {
  if (!('locks' in navigator)) {
    return spendRefreshCookie();
  }

  return navigator.locks.request(REFRESH_LOCK, spendRefreshCookie);
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

export const restoreSession = async (): Promise<string | null> => {
  if (!hasSession() || accessToken) {
    return accessToken;
  }

  refreshing ??= refresh().finally(() => {
    refreshing = null;
  });

  return refreshing;
};

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
