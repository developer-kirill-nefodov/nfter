import type {Request} from 'express';

/**
 * cookie-parser types `req.cookies` as `any`, and Express types `req.body` the
 * same way. Both are attacker-controlled, so they are narrowed here — once —
 * instead of being cast at each of the dozen places that read them.
 */
export const readCookie = (req: Request, name: string): string | undefined => {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[name];

  return typeof value === 'string' ? value : undefined;
};

/** Safe only because every route that calls it runs `validate(schema)` first. */
export const readBody = <T>(req: Request): T => req.body as T;
