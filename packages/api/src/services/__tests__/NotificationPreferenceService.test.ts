import { NotificationPreferenceService } from '../NotificationPreferenceService';
import { prisma } from '../../db';
import { AppError } from '../../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

jest.mock('../../db', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    notificationPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('NotificationPreferenceService', () => {
  let service: NotificationPreferenceService;

  beforeEach(() => {
    service = new NotificationPreferenceService();
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should return existing preferences if they exist', async () => {
      const userId = 'user-1';
      const mockPreferences = {
        id: 'pref-1',
        userId,
        enableDailyReminder: true,
        reminderTime: 'morning',
        enableStreak: true,
        enableLessonAvailable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(
        mockPreferences
      );

      const result = await service.getPreferences(userId);

      expect(result).toEqual(mockPreferences);
      expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should create default preferences if none exist', async () => {
      const userId = 'user-1';
      const mockUser = { id: userId, email: 'test@test.com' };
      const mockCreatedPreferences = {
        id: 'pref-1',
        userId,
        enableDailyReminder: true,
        reminderTime: 'morning',
        enableStreak: true,
        enableLessonAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notificationPreference.create as jest.Mock).mockResolvedValue(
        mockCreatedPreferences
      );

      const result = await service.getPreferences(userId);

      expect(result).toEqual(mockCreatedPreferences);
      expect(prisma.notificationPreference.create).toHaveBeenCalledWith({
        data: {
          userId,
          enableDailyReminder: true,
          reminderTime: 'morning',
          enableStreak: true,
          enableLessonAvailable: true,
        },
      });
    });

    it('should throw error if user not found when creating defaults', async () => {
      const userId = 'nonexistent';

      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getPreferences(userId)).rejects.toThrow(AppError);
    });
  });

  describe('updatePreferences', () => {
    it('should update existing preferences', async () => {
      const userId = 'user-1';
      const input = {
        enableDailyReminder: false,
        reminderTime: 'afternoon',
      };
      const mockUpdatedPreferences = {
        id: 'pref-1',
        userId,
        enableDailyReminder: false,
        reminderTime: 'afternoon',
        enableStreak: true,
        enableLessonAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(
        mockUpdatedPreferences
      );

      const result = await service.updatePreferences(userId, input);

      expect(result).toEqual(mockUpdatedPreferences);
      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: input,
        create: { userId, ...input },
      });
    });

    it('should create preferences if they do not exist', async () => {
      const userId = 'user-1';
      const input = {
        enableDailyReminder: true,
        reminderTime: 'evening',
      };
      const mockCreatedPreferences = {
        id: 'pref-1',
        userId,
        enableDailyReminder: true,
        reminderTime: 'evening',
        enableStreak: undefined,
        enableLessonAvailable: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(
        mockCreatedPreferences
      );

      const result = await service.updatePreferences(userId, input);

      expect(result).toEqual(mockCreatedPreferences);
      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: input,
        create: { userId, ...input },
      });
    });

    it('should update partial preferences', async () => {
      const userId = 'user-1';
      const input = { enableStreak: false };
      const mockUpdatedPreferences = {
        id: 'pref-1',
        userId,
        enableDailyReminder: true,
        reminderTime: 'morning',
        enableStreak: false,
        enableLessonAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(
        mockUpdatedPreferences
      );

      const result = await service.updatePreferences(userId, input);

      expect(result).toEqual(mockUpdatedPreferences);
    });
  });
});
