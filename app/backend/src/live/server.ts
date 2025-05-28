import type {Server} from 'http';

import {WebSocketServer, type WebSocket} from 'ws';

import {redis} from '../db';
import {logger} from '../lib/logger';

import {LIVE_CHANNEL, type ILiveEvent} from './channel';

const PATH = '/api/live';
const HEARTBEAT_MS = 25_000;

interface ILiveSocket extends WebSocket {
  alive: boolean;
}

const send = (socket: WebSocket, payload: unknown) => {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

export const attachLiveServer = async (server: Server): Promise<() => Promise<void>> => {
  const wss = new WebSocketServer({server, path: PATH});

  wss.on('connection', (raw: WebSocket) => {
    const socket = raw as ILiveSocket;
    socket.alive = true;

    socket.on('pong', () => {
      socket.alive = true;
    });

    socket.on('error', (err) => logger.warn({err}, 'live socket error'));

    send(socket, {type: 'hello', heartbeatMs: HEARTBEAT_MS});
  });

  const heartbeat = setInterval(() => {
    for (const raw of wss.clients) {
      const socket = raw as ILiveSocket;

      if (!socket.alive) {
        socket.terminate();
        continue;
      }

      socket.alive = false;
      socket.ping();
    }
  }, HEARTBEAT_MS);

  const subscriber = redis.duplicate();

  subscriber.on('error', (err: unknown) => logger.warn({err}, 'live subscriber error'));

  await subscriber.connect();
  await subscriber.subscribe(LIVE_CHANNEL, (message: string) => {
    let event: ILiveEvent;

    try {
      event = JSON.parse(message) as ILiveEvent;
    } catch (err) {
      logger.warn({err, message}, 'unreadable live event');
      return;
    }

    for (const socket of wss.clients) {
      send(socket, event);
    }
  });

  logger.info({path: PATH}, 'live socket ready');

  return async () => {
    clearInterval(heartbeat);

    for (const socket of wss.clients) {
      socket.close(1001, 'server shutting down');
    }

    wss.close();
    await subscriber.quit();
  };
};
