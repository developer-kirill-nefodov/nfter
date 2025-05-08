import type {ISession} from '../helpers/token/token';

declare global {
  namespace Express {
    interface Request {
      session?: ISession;
    }
  }
}

export {};
