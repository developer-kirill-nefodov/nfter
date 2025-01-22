import {vi} from 'vitest';

/**
 * An in-memory stand-in for the two Redis commands the session and SIWE layers
 * actually use. TTLs are recorded but not expired — no test depends on wall
 * clock, and a fake timer would only make them slower and flakier.
 */
export const createRedisMock = () => {
  const store = new Map<string, string>();

  return {
    store,
    setEx: vi.fn(async (key: string, _ttl: number, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    del: vi.fn(async (keys: string | string[]) => {
      const list = Array.isArray(keys) ? keys : [keys];
      return list.filter((key) => store.delete(key)).length;
    }),
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
