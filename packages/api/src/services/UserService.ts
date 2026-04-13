import { prisma } from '../db';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

export interface UpdateProfileInput {
  goal?: string;
  preferredTime?: string;
  timezone?: string;
  learningStyle?: string;
}

export class UserService {
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const profile = await prisma.userProfile.update({
      where: { userId },
      data: input,
      include: { user: true },
    });

    if (!profile) {
      throw new AppError(
        ERROR_CODES.USER_PROFILE_NOT_FOUND,
        'User profile not found',
        404
      );
    }

    return profile;
  }

  async getUserProgress(userId: string) {
    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: { lesson: true },
    });

    const stats = {
      totalLessonsCompleted: progress.filter((p) => p.completedAt).length,
      currentStreak: 0,
      averageScore: 0,
      lastLessonDate: null as Date | null,
    };

    if (progress.length > 0) {
      const completedLessons = progress.filter((p) => p.completedAt);
      stats.averageScore =
        completedLessons.length > 0
          ? Math.round(
              completedLessons.reduce((sum, p) => sum + (p.quizScore || 0), 0) /
                completedLessons.length
            )
          : 0;

      const sortedByDate = completedLessons.sort(
        (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
      );
      if (sortedByDate.length > 0) {
        stats.lastLessonDate = sortedByDate[0].completedAt;
        stats.currentStreak = sortedByDate[0].streakCount;
      }
    }

    return stats;
  }
}

export const userService = new UserService();
