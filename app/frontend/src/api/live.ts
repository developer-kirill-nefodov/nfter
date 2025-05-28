export type ILiveStatus = 'connecting' | 'live' | 'offline';

export type ILiveEvent =
  | {type: 'hello'; heartbeatMs: number}
  | {type: 'chain'; written: number; head: number}
  | {type: 'market'}
  | {type: 'tip'};

interface ILiveOptions {
  onEvent: (event: ILiveEvent) => void;
  onStatus: (status: ILiveStatus) => void;
}

const FIRST_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
const STABLE_AFTER_MS = 5_000;
const SILENCE_LIMIT_MS = 70_000;

const endpoint = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  return `${protocol}//${window.location.host}/api/live`;
};

export const backoffFor = (attempt: number): number =>
  Math.min(MAX_DELAY_MS, FIRST_DELAY_MS * 2 ** attempt);

const jitter = (delay: number): number => delay * (0.7 + Math.random() * 0.6);

export const openLiveFeed = ({onEvent, onStatus}: ILiveOptions): (() => void) => {
  let socket: WebSocket | null = null;
  let attempt = 0;
  let reconnectTimer = 0;
  let stableTimer = 0;
  let watchdog = 0;
  let closed = false;

  const clearTimers = () => {
    window.clearTimeout(reconnectTimer);
    window.clearTimeout(stableTimer);
    window.clearTimeout(watchdog);
  };

  const armWatchdog = () => {
    window.clearTimeout(watchdog);

    watchdog = window.setTimeout(() => {
      socket?.close();
    }, SILENCE_LIMIT_MS);
  };

  const schedule = () => {
    if (closed) {
      return;
    }

    const delay = backoffFor(attempt);

    attempt += 1;
    reconnectTimer = window.setTimeout(connect, jitter(delay));
  };

  function connect() {
    if (closed) {
      return;
    }

    onStatus('connecting');

    socket = new WebSocket(endpoint());

    socket.onopen = () => {
      armWatchdog();
      onStatus('live');

      stableTimer = window.setTimeout(() => {
        attempt = 0;
      }, STABLE_AFTER_MS);
    };

    socket.onmessage = (message: MessageEvent<string>) => {
      armWatchdog();

      try {
        onEvent(JSON.parse(message.data) as ILiveEvent);
      } catch {
        return;
      }
    };

    socket.onclose = () => {
      window.clearTimeout(stableTimer);
      window.clearTimeout(watchdog);

      if (closed) {
        return;
      }

      onStatus('offline');
      schedule();
    };

    socket.onerror = () => socket?.close();
  }

  const revive = () => {
    if (closed || socket?.readyState === WebSocket.OPEN) {
      return;
    }

    window.clearTimeout(reconnectTimer);
    attempt = 0;
    connect();
  };

  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      revive();
    }
  };

  window.addEventListener('online', revive);
  document.addEventListener('visibilitychange', onVisible);

  connect();

  return () => {
    closed = true;
    clearTimers();

    window.removeEventListener('online', revive);
    document.removeEventListener('visibilitychange', onVisible);

    socket?.close();
  };
};
