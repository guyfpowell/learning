import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { userService } from '../services/UserService';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

export class UserController {
  async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const { goal, preferredTime, timezone, learningStyle } = req.body;

      const profile = await userService.updateProfile(req.user.id, {
        goal,
        preferredTime,
        timezone,
        learningStyle,
      });

      res.status(200).json({
        success: true,
        data: profile,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getProgress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const progress = await userService.getUserProgress(req.user.id);

      res.status(200).json({
        success: true,
        data: progress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
