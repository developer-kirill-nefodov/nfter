import type {Server} from 'http';

import {WebSocketServer, type WebSocket} from 'ws';

import {env} from '../config';
import {redis} from '../db';
import {logger} from '../lib/logger';

import {LIVE_CHANNEL, type ILiveEvent} from './channel';

const PATH = '/api/live';
const HEARTBEAT_MS = 25_000;

// The HTTP rate limiter and CORS do not apply to the WebSocket upgrade. Without a cap, one host can
// open unbounded connections and exhaust sockets/heap; without an origin check, any site can open a
// cross-site socket. The payload is only public chain data, so the origin check is defence in depth,
// but the connection cap is a real DoS guard.
const MAX_CLIENTS = 1_000;

interface ILiveSocket extends WebSocket {
  alive: boolean;
}

const send = (socket: WebSocket, payload: unknown) => {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const originAllowed = (origin: string | undefined): boolean => {
  // Non-browser clients (no Origin header) are allowed; browsers must match the configured frontend.
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).host === new URL(env.frontendUrl).host;
  } catch {
    return false;
  }
};

export const attachLiveServer = async (server: Server): Promise<() => Promise<void>> => {
  const wss = new WebSocketServer({
    server,
    path: PATH,
    verifyClient: ({origin, req}, done) => {
      if (!originAllowed(origin)) {
        logger.warn({origin}, 'live socket rejected: origin not allowed');
        done(false, 403, 'Forbidden origin');
        return;
      }

      if (wss.clients.size >= MAX_CLIENTS) {
        logger.warn({clients: wss.clients.size, ip: req.socket.remoteAddress}, 'live socket rejected: at capacity');
        done(false, 503, 'Too many connections');
        return;
      }

      done(true);
    },
  });

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
