import type {Request} from 'express';

export const readCookie = (req: Request, name: string): string | undefined => {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[name];

  return typeof value === 'string' ? value : undefined;
};

export const readBody = <T>(req: Request): T => req.body as T;
