import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { authService } from '../services/AuthService';
import { AppError } from '../middleware/error-handler';

export class AuthController {
  async register(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Missing required fields: email, password, name',
          400
        );
      }

      const result = await authService.register({ email, password, name });

      res.status(201).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async login(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Missing required fields: email, password',
          400
        );
      }

      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async me(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          'AUTH_MISSING_TOKEN',
          'Missing authentication token',
          401
        );
      }

      const user = await authService.getUserById(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profile: user.profile,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
