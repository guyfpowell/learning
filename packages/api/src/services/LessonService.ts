import { prisma } from '../db';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';
import { skillTracker } from '../ai/SkillTracker';
import { recommendationEngine } from '../ai/RecommendationEngine';
import { learningStyleClassifier } from '../ai/LearningStyleClassifier';
import { engagementService } from './EngagementService';
import { coachingService } from './CoachingService';
import { UserService } from './UserService';
import { pushNotificationService } from './PushNotificationService';
import { streakService } from './StreakService';

const userService = new UserService();

export interface QuizSubmission {
  lessonId: string;
  userId: string;
  answers: Record<string, string>;
}

export class LessonService {
  async getTodayLesson(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
    }

    const allProgress = await prisma.userProgress.findMany({
      where: { userId },
      include: { lesson: { include: { skillPath: true } } },
    });

    const incompleteLessons = allProgress.filter((p) => !p.completedAt);

    if (incompleteLessons.length === 0) {
      const anyLesson = await prisma.lesson.findFirst({
        include: { skillPath: true, quizzes: true },
      });
      if (!anyLesson) {
        throw new AppError(ERROR_CODES.LESSON_NOT_FOUND, 'No lessons available', 404);
      }
      return anyLesson;
    }

    // Delegate to recommendation engine (handles cold-start internally)
    const skillPathId = incompleteLessons[0].lesson.skillPathId;
    const recommendedId = await recommendationEngine.getNextLesson(userId, skillPathId);

    const lessonId = recommendedId ?? incompleteLessons[0].lessonId;
    return this.getLessonById(lessonId);
  }

  async getLessonById(lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { skillPath: true, quizzes: true },
    });

    if (!lesson) {
      throw new AppError(ERROR_CODES.LESSON_NOT_FOUND, 'Lesson not found', 404);
    }

    return lesson;
  }

  async completeLessonService(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });

    if (!lesson) {
      throw new AppError(ERROR_CODES.LESSON_NOT_FOUND, 'Lesson not found', 404);
    }

    const progress = await prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        completedAt: new Date(),
        streakCount: 1,
        lastLessonDate: new Date(),
      },
      update: {
        completedAt: new Date(),
        lastLessonDate: new Date(),
        streakCount: { increment: 1 },
      },
      include: { lesson: true },
    });

    return progress;
  }

  async submitQuiz(
    userId: string,
    lessonId: string,
    answers: Record<string, string>,
    tier?: string
  ) {
    const quizzes = await prisma.quiz.findMany({ where: { lessonId } });

    if (quizzes.length === 0) {
      throw new AppError(ERROR_CODES.LESSON_NOT_FOUND, 'No quizzes found for this lesson', 404);
    }

    let correctCount = 0;
    const feedbacks = [];

    for (const quiz of quizzes) {
      const userAnswer = answers[quiz.id];
      const isCorrect = userAnswer === quiz.correctAnswer;
      if (isCorrect) correctCount++;
      feedbacks.push({
        quizId: quiz.id,
        question: quiz.question,
        userAnswer,
        correctAnswer: quiz.correctAnswer,
        isCorrect,
        explanation: quiz.explanation,
      });
    }

    const score = Math.round((correctCount / quizzes.length) * 100);

    const updatedProgress = await prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, quizScore: score, completedAt: new Date(), streakCount: 1 },
      update: { quizScore: score, completedAt: new Date() },
    });

    const streak = updatedProgress.streakCount;
    const milestone = streakService.getMilestone(streak);

    // Fire-and-forget milestone notification (never blocks quiz response)
    if (milestone) {
      this._sendMilestoneNotification(userId, streak, milestone).catch(() => {});
    }

    const lesson = await this.getLessonById(lessonId);
    const skillId = lesson.skillPath.skillId;

    // Update Elo skill rating (fire-and-forget pattern — non-blocking on error)
    skillTracker.updateRating(userId, skillId, score).catch(() => {});

    // Record engagement (fire-and-forget)
    engagementService.recordEngagement({ userId, lessonId }).catch(() => {});

    // Classify learning style and update profile (fire-and-forget)
    this._updateLearningStyle(userId).catch(() => {});

    // Generate coaching feedback (never throws, returns null on error/free tier)
    const firstFeedback = feedbacks[0];
    const coaching = await coachingService.generateFeedback({
      userId,
      lessonId,
      skillId,
      tier: tier ?? 'free',
      quizResult: firstFeedback
        ? {
            question: firstFeedback.question,
            userAnswer: firstFeedback.userAnswer ?? '',
            correctAnswer: firstFeedback.correctAnswer,
            isCorrect: firstFeedback.isCorrect,
            explanation: firstFeedback.explanation,
          }
        : { question: '', userAnswer: '', correctAnswer: '', isCorrect: false, explanation: '' },
      lessonTitle: lesson.title,
      lessonContent: lesson.content,
    });

    return { score, feedbacks, lesson, coaching, streak, milestone };
  }

  async getUpcomingLessons(userId: string, limit: number = 5) {
    return prisma.lesson.findMany({
      take: limit,
      include: { skillPath: true, quizzes: true },
    });
  }

  private async _sendMilestoneNotification(
    userId: string,
    streak: number,
    milestone: string
  ): Promise<void> {
    // Idempotency: only send once per milestone per user
    const existing = await prisma.notification.findFirst({
      where: { userId, type: `streak-milestone-${streak}` },
    });
    if (existing) return;

    await pushNotificationService.send(userId, {
      title: `${milestone}!`,
      body: streakService.getStreakMessage(streak),
      data: { screen: 'progress', streak: String(streak) },
    });

    await prisma.notification.create({
      data: { userId, type: `streak-milestone-${streak}` },
    });
  }

  private async _updateLearningStyle(userId: string): Promise<void> {
    const signals = await engagementService.getEngagementSignals(userId);
    const style = learningStyleClassifier.classify(signals);
    await userService.updateProfile(userId, { learningStyle: style });
  }
}

export const lessonService = new LessonService();
