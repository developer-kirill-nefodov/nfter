import {generateNonce, SiweMessage} from 'siwe';

import {env} from '../config';
import {LIFETIME_NONCE_SEC} from '../constants';
import {redis} from '../db';
import {AppError} from '../errors/app-error';

const nonceKey = (nonce: string) => `siwe:nonce:${nonce}`;

const expectedDomain = new URL(env.frontendUrl).host;

export const issueNonce = async (): Promise<string> => {
  const nonce = generateNonce();

  await redis.setEx(nonceKey(nonce), LIFETIME_NONCE_SEC, '1');

  return nonce;
};

export const verifySiweMessage = async (
  message: string,
  signature: string,
): Promise<string> => {
  let siwe: SiweMessage;

  try {
    siwe = new SiweMessage(message);
  } catch {
    throw AppError.badRequest('Malformed sign-in message');
  }

  if (siwe.domain !== expectedDomain) {
    throw AppError.badRequest('Sign-in message was issued for a different domain');
  }

  if (siwe.chainId !== env.web3.chainId) {
    throw AppError.badRequest(`Wrong network — expected chain ${env.web3.chainId}`);
  }

  const consumed = await redis.del(nonceKey(siwe.nonce));

  if (consumed === 0) {
    throw AppError.badRequest('Sign-in request has expired — please try again');
  }

  try {
    const {data} = await siwe.verify({
      signature,
      domain: expectedDomain,
      nonce: siwe.nonce,
    });

    return data.address.toLowerCase();
  } catch {
    throw AppError.unauthorized('Signature does not match the connected wallet');
  }
};
