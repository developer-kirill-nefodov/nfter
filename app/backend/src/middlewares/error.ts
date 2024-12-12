import type {NextFunction, Request, Response} from 'express';
import {ValidationError as JoiValidationError} from 'joi';
import {BaseError as SequelizeError} from 'sequelize';

import {AppError} from '../errors/app-error';
import {logger} from '../lib/logger';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
};

// Express 5 forwards rejected promises from async handlers here automatically.
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(err.status).json({message: err.message});
    return;
  }

  if (err instanceof JoiValidationError) {
    res.status(422).json({
      message: 'Validation failed',
      details: err.details.map(({path, message}) => ({field: path.join('.'), message})),
    });
    return;
  }

  // Anything below is unexpected: log the real cause, tell the client nothing about it.
  if (err instanceof SequelizeError) {
    logger.error({err}, 'database error');
  } else {
    logger.error({err}, 'unhandled error');
  }

  res.status(500).json({message: 'Internal server error'});
};
