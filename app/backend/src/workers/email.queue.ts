import {Queue, type ConnectionOptions} from 'bullmq';

import {env} from '../config';

export const EMAIL_QUEUE_NAME = 'email';

export const queueConnection: ConnectionOptions = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password || undefined,
};

export interface IResetPasswordJob {
  name: 'reset-password';
  email: string;
  resetUrl: string;
}

export type IEmailJob = IResetPasswordJob;

export const emailQueue = new Queue<IEmailJob>(EMAIL_QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {type: 'exponential', delay: 2_000},
    removeOnComplete: {age: 3_600, count: 100},
    removeOnFail: {age: 24 * 3_600},
  },
});

/**
 * Sending mail inline would make the request wait on an SMTP round trip and let
 * a slow mail server leak "this address exists" through response timing. The
 * queue keeps the endpoint fast and constant-time.
 */
export const addEmailJob = (job: IEmailJob) => emailQueue.add(job.name, job);
