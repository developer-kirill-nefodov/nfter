import {Router, type RequestHandler} from 'express';

import AuthRouters from './auth.router';
import CountryRouter from './country.router';
import NftRouter from './nft.router';
import TipRouter from './tip.router';
import TranslationRouter from './translation.router';

export type IHttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface IRoute {
  method: IHttpMethod;
  path: string;
  /** Runs in order: rate limit → guard → body validation → handler. */
  middleware?: RequestHandler[];
  handler: RequestHandler;
}

export interface IAnyRouter {
  prefix: string;
  routeData: IRoute[];
}

export const routers = (): Router => {
  const router = Router();

  for (const {prefix, routeData} of [
    AuthRouters,
    CountryRouter,
    TranslationRouter,
    NftRouter,
    TipRouter,
  ]) {
    for (const {method, path, middleware = [], handler} of routeData) {
      router[method](`/${prefix}/${path}`, ...middleware, handler);
    }
  }

  return router;
};
