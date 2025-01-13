import {createHash, randomBytes} from 'crypto';

import {env} from '../../config';
import {LIFETIME_RESET_TOKEN_SEC} from '../../constants';
import {redis} from '../../db';
import {addEmailJob} from '../../workers/email.queue';

const resetKey = (tokenHash: string) => `reset-password:${tokenHash}`;

/** Only the hash is stored, so a dump of Redis does not hand over live reset links. */
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

export const createResetToken = async (userId: number, email: string): Promise<void> => {
  const token = randomBytes(32).toString('base64url');

  await redis.setEx(resetKey(hash(token)), LIFETIME_RESET_TOKEN_SEC, String(userId));

  await addEmailJob({
    name: 'reset-password',
    email,
    resetUrl: `${env.frontendUrl}/reset-password?token=${token}`,
  });
};

/** Redeems the token exactly once and returns the user it belonged to. */
export const consumeResetToken = async (token: string): Promise<number | null> => {
  const key = resetKey(hash(token));

  const userId = await redis.get(key);

  if (!userId) {
    return null;
  }

  await redis.del(key);

  return Number(userId);
};
