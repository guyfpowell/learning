import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { notificationPreferenceService } from '../services/NotificationPreferenceService';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

export class NotificationPreferenceController {
  async getPreferences(
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

      const preferences = await notificationPreferenceService.getPreferences(req.user.id);

      res.status(200).json({
        success: true,
        data: preferences,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(
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

      const { enableDailyReminder, reminderTime, enableStreak, enableLessonAvailable } = req.body;

      const preferences = await notificationPreferenceService.updatePreferences(req.user.id, {
        enableDailyReminder,
        reminderTime,
        enableStreak,
        enableLessonAvailable,
      });

      res.status(200).json({
        success: true,
        data: preferences,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationPreferenceController = new NotificationPreferenceController();
