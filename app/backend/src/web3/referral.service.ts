import {randomBytes} from 'crypto';

import {Contract, formatEther, getAddress} from 'ethers';

import {env} from '../config';
import {logger} from '../lib/logger';
import UserModel from '../models/user.model';

import {OWNABLE_ABI, REFERRALS_ABI} from './abis';
import {readEvents} from './indexer.service';
import {provider} from './provider';

const referrals = new Contract(env.web3.referrals, REFERRALS_ABI, provider) as unknown as {
  statsOf(address: string): Promise<[bigint, bigint, bigint]>;
  referrerOf(address: string): Promise<string>;
};

const artifacts = new Contract(env.web3.artifacts, OWNABLE_ABI, provider) as unknown as {
  owner(): Promise<string>;
};

let treasury: {address: string; readAt: number} | null = null;
const TREASURY_TTL_MS = 60_000;

export const getTreasuryAddress = async (): Promise<string | null> => {
  if (treasury && Date.now() - treasury.readAt < TREASURY_TTL_MS) {
    return treasury.address;
  }

  try {
    const address = getAddress(await artifacts.owner());

    treasury = {address, readAt: Date.now()};

    return address;
  } catch (err) {
    logger.warn({err}, 'could not read the treasury owner from chain');

    return treasury?.address ?? null;
  }
};

export const isFounder = async (wallet: string | null): Promise<boolean> => {
  if (!wallet) {
    return false;
  }

  const owner = await getTreasuryAddress();

  return owner !== null && owner.toLowerCase() === wallet.toLowerCase();
};

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const newCode = (): string => {
  const bytes = randomBytes(6);

  return `EW3-${[...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join('')}`;
};

export const ensureReferralCode = async (userId: number): Promise<string | null> => {
  const user = await UserModel.findByPk(userId);

  if (!user) {
    return null;
  }

  if (user.referral_code) {
    return user.referral_code;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = newCode();

    try {
      await user.update({referral_code: code});

      return code;
    } catch {
      logger.debug({attempt}, 'referral code collided; retrying');
    }
  }

  return null;
};

export const findByCode = async (code: string) =>
  UserModel.findOne({where: {referral_code: code.trim().toUpperCase()}});

export interface IReferralStats {
  code: string | null;
  address: string | null;
  pendingEth: string;
  lifetimeEth: string;
  invited: number;
  referredBy: string | null;
  referredByAddress: string | null;
}

export const getReferralStats = async (userId: number): Promise<IReferralStats> => {
  const user = await UserModel.findByPk(userId);

  if (!user) {
    return {
      code: null,
      address: null,
      pendingEth: '0',
      lifetimeEth: '0',
      invited: 0,
      referredBy: null,
      referredByAddress: null,
    };
  }

  const code = await ensureReferralCode(userId);

  const inviter = user.referred_by ? await UserModel.findByPk(user.referred_by) : null;

  if (!user.wallet_address) {
    return {
      code,
      address: null,
      pendingEth: '0',
      lifetimeEth: '0',
      invited: 0,
      referredBy: inviter?.referral_code ?? null,
      referredByAddress: inviter?.wallet_address ?? null,
    };
  }

  const [pending, lifetime, invited] = await referrals.statsOf(user.wallet_address);

  return {
    code,
    address: getAddress(user.wallet_address),
    pendingEth: formatEther(pending),
    lifetimeEth: formatEther(lifetime),
    invited: Number(invited),
    referredBy: inviter?.referral_code ?? null,
    referredByAddress: inviter?.wallet_address ? getAddress(inviter.wallet_address) : null,
  };
};

export interface IInviterEntry {
  rank: number;
  address: string;
  invited: number;
  earnedEth: string;
}

export const getInviters = async (limit = 20): Promise<IInviterEntry[]> => {
  const [referred, credited] = await Promise.all([
    readEvents(env.web3.referrals, 'Referred'),
    readEvents(env.web3.referrals, 'Credited'),
  ]);

  const totals = new Map<string, {invited: number; earned: bigint}>();

  const entry = (address: string) => totals.get(address) ?? {invited: 0, earned: 0n};

  for (const {args} of referred) {
    const key = (args.referrer ?? '').toLowerCase();
    const current = entry(key);

    totals.set(key, {...current, invited: current.invited + 1});
  }

  for (const {args} of credited) {
    const key = (args.referrer ?? '').toLowerCase();
    const current = entry(key);

    totals.set(key, {...current, earned: current.earned + BigInt(args.amount ?? '0')});
  }

  return [...totals.entries()]
    .sort(([, a], [, b]) => (b.earned === a.earned ? b.invited - a.invited : b.earned > a.earned ? 1 : -1))
    .slice(0, limit)
    .map(([address, value], index) => ({
      rank: index + 1,
      address: getAddress(address),
      invited: value.invited,
      earnedEth: formatEther(value.earned),
    }));
};
