import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES, ERROR_MESSAGES } from '@learning/shared';

export class AppError extends Error {
  constructor(
    public code: string,
    message?: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message || ERROR_MESSAGES[code] || 'Unknown error');
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Unhandled errors
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: ERROR_CODES.INTERNAL_ERROR,
    timestamp: new Date().toISOString(),
  });
}

// 404 handler
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: 'Not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
}
