import {createHash, randomBytes} from 'crypto';

import {env} from '../../config';
import {LIFETIME_RESET_TOKEN_SEC, RESET_COOLDOWN_SEC} from '../../constants';
import {redis} from '../../db';
import {logger} from '../../lib/logger';
import {addEmailJob} from '../../workers/email.queue';

const resetKey = (tokenHash: string) => `reset-password:${tokenHash}`;
const cooldownKey = (emailHash: string) => `reset-cooldown:${emailHash}`;

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

const startCooldown = async (email: string): Promise<boolean> => {
  const started = await redis.set(cooldownKey(hash(email)), '1', {
    EX: RESET_COOLDOWN_SEC,
    NX: true,
  });

  return started === 'OK';
};

export const createResetToken = async (userId: number, email: string): Promise<void> => {
  if (!(await startCooldown(email))) {
    logger.info({userId}, 'reset email suppressed: still within the cooldown window');
    return;
  }

  const token = randomBytes(32).toString('base64url');

  await redis.setEx(resetKey(hash(token)), LIFETIME_RESET_TOKEN_SEC, String(userId));

  await addEmailJob({
    name: 'reset-password',
    email,
    resetUrl: `${env.frontendUrl}/reset-password?token=${token}`,
  });
};

export const consumeResetToken = async (token: string): Promise<number | null> => {
  const key = resetKey(hash(token));

  const userId = await redis.get(key);

  if (!userId) {
    return null;
  }

  await redis.del(key);

  return Number(userId);
};
