import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export function adminGuard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: admin access required',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  next();
}
