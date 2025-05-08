import type {NextFunction, Request, Response} from 'express';
import type {ObjectSchema} from 'joi';

export const validate =
  (schema: ObjectSchema) => async (req: Request, _res: Response, next: NextFunction) => {
    const value: unknown = await schema.validateAsync(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    req.body = value;
    next();
  };
