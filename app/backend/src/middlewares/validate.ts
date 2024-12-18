import type {NextFunction, Request, Response} from 'express';
import type {ObjectSchema} from 'joi';

/**
 * Validation failures are thrown, not answered here: the error middleware turns
 * a Joi error into a 422 with per-field details, so every route reports them the
 * same way. Express 5 forwards the rejection for us.
 */
export const validate =
  (schema: ObjectSchema) => async (req: Request, _res: Response, next: NextFunction) => {
    const value: unknown = await schema.validateAsync(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    req.body = value;
    next();
  };
