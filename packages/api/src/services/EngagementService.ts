import { prisma } from '../db';
import type { EngagementSignals } from '../ai/LearningStyleClassifier';

export interface RecordEngagementInput {
  userId: string;
  lessonId: string;
  completionTime?: number; // seconds
  rating?: number;         // -1 | 0 | 1
}

export class EngagementService {
  async recordEngagement(input: RecordEngagementInput): Promise<void> {
    const { userId, lessonId, completionTime, rating } = input;

    await prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        completionTime,
        rating,
        revisitCount: 0,
      },
      update: {
        ...(completionTime !== undefined && { completionTime }),
        ...(rating !== undefined && { rating }),
        revisitCount: { increment: 1 },
      },
    });
  }

  async getEngagementSignals(userId: string): Promise<EngagementSignals> {
    const records = await prisma.userProgress.findMany({
      where: { userId, completedAt: { not: null } },
      include: { lesson: { select: { durationMinutes: true } } },
    });

    if (records.length === 0) {
      return { avgCompletionRatio: 1.0, avgFirstAttemptAccuracy: 0.5, avgRevisitCount: 0 };
    }

    const completionRatios = records
      .filter((r) => r.completionTime != null && r.lesson.durationMinutes > 0)
      .map((r) => r.completionTime! / (r.lesson.durationMinutes * 60));

    const avgCompletionRatio =
      completionRatios.length > 0
        ? completionRatios.reduce((a, b) => a + b, 0) / completionRatios.length
        : 1.0;

    const scores = records.filter((r) => r.quizScore != null).map((r) => r.quizScore! / 100);
    const avgFirstAttemptAccuracy =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5;

    const avgRevisitCount =
      records.reduce((sum, r) => sum + r.revisitCount, 0) / records.length;

    return { avgCompletionRatio, avgFirstAttemptAccuracy, avgRevisitCount };
  }
}

export const engagementService = new EngagementService();
