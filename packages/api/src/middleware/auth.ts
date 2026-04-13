import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken, TokenPayload } from './jwt';
import { ERROR_CODES, ERROR_MESSAGES } from '@learning/shared';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: ERROR_MESSAGES[ERROR_CODES.AUTH_MISSING_TOKEN],
        code: ERROR_CODES.AUTH_MISSING_TOKEN,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    const code =
      error instanceof Error && error.message.includes('expired')
        ? ERROR_CODES.AUTH_TOKEN_EXPIRED
        : ERROR_CODES.AUTH_INVALID_TOKEN;

    res.status(401).json({
      success: false,
      error: ERROR_MESSAGES[code],
      code,
      timestamp: new Date().toISOString(),
    });
  }
}

// Optional: Extract user without throwing error (for public routes that can be authenticated)
export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req.headers.authorization);
    if (token) {
      const payload = verifyToken(token);
      req.user = payload;
    }
  } catch {
    // Ignore auth errors for optional routes
  }
  next();
}
