// ─── AppError ─────────────────────────────────────────────────────────────────
// A typed HTTP error that controllers throw and the global error handler catches.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

// ─── Common Error Factories ───────────────────────────────────────────────────

export const notFound = (entity: string): AppError =>
  new AppError(`${entity} not found.`, 404);

export const badRequest = (message: string): AppError =>
  new AppError(message, 400);

export const conflict = (message: string): AppError =>
  new AppError(message, 409);
