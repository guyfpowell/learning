import { prisma } from '../db';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

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
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    // Get all progress for this user
    const allProgress = await prisma.userProgress.findMany({
      where: { userId },
      include: { lesson: { include: { skillPath: true } } },
    });

    // Find the lesson for today
    // Strategy: If user has completed lessons, get next one; otherwise get first lesson from their chosen skill path
    // For MVP, just find the first incomplete lesson from a skill path
    const incompleteLessons = allProgress.filter((p) => !p.completedAt);

    if (incompleteLessons.length > 0) {
      const nextLesson = incompleteLessons[0];
      return this.getLessonById(nextLesson.lessonId);
    }

    // If all lessons are complete, offer the first lesson again (for MVP)
    const anyLesson = await prisma.lesson.findFirst({
      include: { skillPath: true, quizzes: true },
    });

    if (!anyLesson) {
      throw new AppError(
        ERROR_CODES.LESSON_NOT_FOUND,
        'No lessons available',
        404
      );
    }

    return anyLesson;
  }

  async getLessonById(lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { skillPath: true, quizzes: true },
    });

    if (!lesson) {
      throw new AppError(
        ERROR_CODES.LESSON_NOT_FOUND,
        'Lesson not found',
        404
      );
    }

    return lesson;
  }

  async completeLessonService(userId: string, lessonId: string) {
    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new AppError(
        ERROR_CODES.LESSON_NOT_FOUND,
        'Lesson not found',
        404
      );
    }

    // Update or create progress record
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
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
        // Increment streak only if completed within 24 hours of last lesson
        // For MVP, just set it
        streakCount: {
          increment: 1,
        },
      },
      include: { lesson: true },
    });

    return progress;
  }

  async submitQuiz(userId: string, lessonId: string, answers: Record<string, string>) {
    // Get all quizzes for this lesson
    const quizzes = await prisma.quiz.findMany({
      where: { lessonId },
    });

    if (quizzes.length === 0) {
      throw new AppError(
        ERROR_CODES.LESSON_NOT_FOUND,
        'No quizzes found for this lesson',
        404
      );
    }

    // Score the answers
    let correctCount = 0;
    const feedbacks = [];

    for (const quiz of quizzes) {
      const userAnswer = answers[quiz.id];
      const isCorrect = userAnswer === quiz.correctAnswer;

      if (isCorrect) {
        correctCount++;
      }

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

    // Update progress with quiz score
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      create: {
        userId,
        lessonId,
        quizScore: score,
        completedAt: new Date(),
        streakCount: 1,
      },
      update: {
        quizScore: score,
        completedAt: new Date(),
      },
    });

    return {
      score,
      feedbacks,
      lesson: await this.getLessonById(lessonId),
    };
  }

  async getUpcomingLessons(userId: string, limit: number = 5) {
    const lessons = await prisma.lesson.findMany({
      take: limit,
      include: { skillPath: true, quizzes: true },
    });

    return lessons;
  }
}

export const lessonService = new LessonService();
