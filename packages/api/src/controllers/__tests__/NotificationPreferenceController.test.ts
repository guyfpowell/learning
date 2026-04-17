import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { notificationPreferenceController } from '../NotificationPreferenceController';
import { notificationPreferenceService } from '../../services/NotificationPreferenceService';
import { AppError } from '../../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

jest.mock('../../services/NotificationPreferenceService');

describe('NotificationPreferenceController', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: { id: 'user-1', email: 'test@test.com', role: 'user' as const },
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should return user notification preferences', async () => {
      const mockPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        enableDailyReminder: true,
        reminderTime: 'morning',
        enableStreak: true,
        enableLessonAvailable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (notificationPreferenceService.getPreferences as jest.Mock).mockResolvedValue(
        mockPreferences
      );

      await notificationPreferenceController.getPreferences(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPreferences,
        timestamp: expect.any(String),
      });
    });

    it('should throw error if user not authenticated', async () => {
      mockReq.user = undefined;

      await notificationPreferenceController.getPreferences(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('updatePreferences', () => {
    it('should update user notification preferences', async () => {
      const input = {
        enableDailyReminder: false,
        reminderTime: 'afternoon',
      };
      const mockUpdatedPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        enableDailyReminder: false,
        reminderTime: 'afternoon',
        enableStreak: true,
        enableLessonAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReq.body = input;
      (notificationPreferenceService.updatePreferences as jest.Mock).mockResolvedValue(
        mockUpdatedPreferences
      );

      await notificationPreferenceController.updatePreferences(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(notificationPreferenceService.updatePreferences).toHaveBeenCalledWith('user-1', input);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedPreferences,
        timestamp: expect.any(String),
      });
    });

    it('should handle partial updates', async () => {
      const input = { enableStreak: false };
      const mockUpdatedPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        enableDailyReminder: true,
        reminderTime: 'morning',
        enableStreak: false,
        enableLessonAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReq.body = input;
      (notificationPreferenceService.updatePreferences as jest.Mock).mockResolvedValue(
        mockUpdatedPreferences
      );

      await notificationPreferenceController.updatePreferences(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(notificationPreferenceService.updatePreferences).toHaveBeenCalledWith('user-1', input);
    });

    it('should throw error if user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = { enableDailyReminder: false };

      await notificationPreferenceController.updatePreferences(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
