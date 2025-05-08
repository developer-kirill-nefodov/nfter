import {api, setAccessToken} from './client';
import type {IUser} from '../types/user';

export interface IForgotResult {
  message: string;
  retryAfter: number;
}

interface ISessionResponse {
  token: string;
  user: IUser;
  message: string;
}

const startSession = ({token, user}: ISessionResponse): IUser => {
  setAccessToken(token);
  return user;
};

export const authApi = {
  me: async (): Promise<IUser> => {
    const {data} = await api.get<IUser>('/auth/me');
    return data;
  },

  login: async (payload: {email: string; password: string}): Promise<IUser> => {
    const {data} = await api.post<ISessionResponse>('/auth/login', payload);
    return startSession(data);
  },

  register: async (payload: {
    email: string;
    password: string;
    inviteCode?: string;
  }): Promise<IUser> => {
    const {data} = await api.post<ISessionResponse>('/auth/register', payload);
    return startSession(data);
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    setAccessToken(null);
  },

  forgotPassword: async (payload: {email: string}): Promise<IForgotResult> => {
    const {data} = await api.post<IForgotResult>('/auth/forgot-password', payload);
    return data;
  },

  resetPassword: async (payload: {token: string; password: string}): Promise<string> => {
    const {data} = await api.post<{message: string}>('/auth/reset-password', payload);
    return data.message;
  },

  nonce: async (): Promise<string> => {
    const {data} = await api.get<{nonce: string}>('/auth/nonce');
    return data.nonce;
  },

  walletLink: async (payload: {message: string; signature: string}): Promise<IUser> => {
    const {data} = await api.post<ISessionResponse>('/auth/wallet-link', payload);
    return startSession(data);
  },

  walletUnlink: async (): Promise<IUser> => {
    const {data} = await api.post<ISessionResponse>('/auth/wallet-unlink');
    return startSession(data);
  },
};
