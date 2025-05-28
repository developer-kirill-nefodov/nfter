import {redis} from '../db';
import {logger} from '../lib/logger';

export const LIVE_CHANNEL = 'live:events';

export type ILiveEvent =
  | {type: 'chain'; written: number; head: number}
  | {type: 'market'}
  | {type: 'tip'};

export const publishLive = async (event: ILiveEvent): Promise<void> => {
  try {
    await redis.publish(LIVE_CHANNEL, JSON.stringify(event));
  } catch (err) {
    logger.warn({err, event}, 'could not publish a live event');
  }
};
