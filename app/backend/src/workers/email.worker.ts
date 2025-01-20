import {Worker} from 'bullmq';
import nodemailer from 'nodemailer';

import {env} from '../config';
import {logger} from '../lib/logger';

import {EMAIL_QUEUE_NAME, queueConnection, type IEmailJob} from './email.queue';

const transport = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: env.mail.port === 465,
  auth: env.mail.user ? {user: env.mail.user, pass: env.mail.password} : undefined,
});

const render = (job: IEmailJob) => ({
  subject: 'Reset your password',
  text:
    `We received a request to reset your password.\n\n` +
    `Open this link to choose a new one:\n${job.resetUrl}\n\n` +
    `If you did not ask for this, you can ignore this email.`,
});

export const emailWorker = new Worker<IEmailJob>(
  EMAIL_QUEUE_NAME,
  async ({data}) => {
    const {subject, text} = render(data);

    await transport.sendMail({from: env.mail.from, to: data.email, subject, text});

    logger.info({job: data.name, to: data.email}, 'email sent');
  },
  {connection: queueConnection, concurrency: 5},
);

emailWorker.on('failed', (job, err) => {
  logger.error({err, jobId: job?.id, attempts: job?.attemptsMade}, 'email job failed');
});
