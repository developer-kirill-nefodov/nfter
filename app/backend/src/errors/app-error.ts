export class AppError extends Error {
  public readonly status: number;
  public readonly expose: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.expose = true;
    Error.captureStackTrace(this, AppError);
  }

  static badRequest(message = 'Bad request') {
    return new AppError(400, message);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(403, message);
  }

  static notFound(message = 'Not found') {
    return new AppError(404, message);
  }

  static conflict(message = 'Conflict') {
    return new AppError(409, message);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new AppError(429, message);
  }

  static badGateway(message = 'Upstream unavailable') {
    return new AppError(502, message);
  }
}
