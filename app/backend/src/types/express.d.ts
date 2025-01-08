import type {ISession} from '../helpers/token/token';

// The guards attach the verified session to the request. Declaring it here
// rather than casting inside every controller keeps the handlers plain Express.
declare global {
  namespace Express {
    interface Request {
      session?: ISession;
    }
  }
}

export {};
