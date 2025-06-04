import {vi} from 'vitest';

export const createRedisMock = () => {
  const store = new Map<string, string>();

  return {
    store,
    setEx: vi.fn(async (key: string, _ttl: number, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    set: vi.fn(async (key: string, value: string, options?: {NX?: boolean}) => {
      if (options?.NX && store.has(key)) {
        return null;
      }

      store.set(key, value);
      return 'OK';
    }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    del: vi.fn(async (keys: string | string[]) => {
      const list = Array.isArray(keys) ? keys : [keys];
      return list.filter((key) => store.delete(key)).length;
    }),
    expire: vi.fn(async (key: string, _seconds: number) => (store.has(key) ? 1 : 0)),
    scanIterator: vi.fn(async function* ({MATCH}: {MATCH: string}) {
      const pattern = new RegExp(`^${MATCH.replace(/\*/g, '[^:]*')}$`);

      for (const key of [...store.keys()]) {
        if (pattern.test(key)) {
          yield key;
        }
      }
    }),
  };
};
