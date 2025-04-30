import {api} from './client';
import type {IInviterEntry, IReferralStats, ITreasury} from '../types/referral';

export const referralApi = {
  me: async (): Promise<IReferralStats> => {
    const {data} = await api.get<IReferralStats>('/referrals/me');
    return data;
  },

  inviters: async (): Promise<IInviterEntry[]> => {
    const {data} = await api.get<{entries: IInviterEntry[]}>('/referrals/inviters');
    return data.entries;
  },

  /** 403 for anyone who does not own the contracts — the check is on the server. */
  treasury: async (): Promise<ITreasury> => {
    const {data} = await api.get<ITreasury>('/referrals/treasury');
    return data;
  },
};
