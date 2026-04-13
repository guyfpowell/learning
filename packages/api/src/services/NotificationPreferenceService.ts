import { prisma } from '../db';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

export interface UpdateNotificationPreferenceInput {
  enableDailyReminder?: boolean;
  reminderTime?: string;
  enableStreak?: boolean;
  enableLessonAvailable?: boolean;
}

export class NotificationPreferenceService {
  async getPreferences(userId: string) {
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      return await this.createDefaultPreferences(userId);
    }

    return preferences;
  }

  async updatePreferences(userId: string, input: UpdateNotificationPreferenceInput) {
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: input,
      create: {
        userId,
        ...input,
      },
    });

    return preferences;
  }

  private async createDefaultPreferences(userId: string) {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    return await prisma.notificationPreference.create({
      data: {
        userId,
        enableDailyReminder: true,
        reminderTime: 'morning',
        enableStreak: true,
        enableLessonAvailable: true,
      },
    });
  }
}

export const notificationPreferenceService = new NotificationPreferenceService();
