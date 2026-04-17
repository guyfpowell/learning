import { prisma } from '../db';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES, type LessonOutput, type LessonRequest } from '@learning/shared';
import { aiServiceClient, AIServiceError } from './AIServiceClient';

export interface GenerateLessonOptions {
  userId: string;
  skillId: string;
  skillLevel: string;
  topic: string;
  userContext: {
    goal?: string;
    learningStyle?: string;
    completedLessons?: number;
  };
  tier: string;
}

export class LessonGenerationService {
  async generateLesson(options: GenerateLessonOptions): Promise<LessonOutput> {
    const request: LessonRequest = {
      skill_id: options.skillId,
      skill_level: options.skillLevel,
      topic: options.topic,
      user_context: {
        goal: options.userContext.goal,
        learningStyle: options.userContext.learningStyle,
        completedLessons: options.userContext.completedLessons,
      },
      tier: options.tier,
    };

    // Step 1: Try AI service
    try {
      const lesson = await aiServiceClient.generateLesson(request);
      await this._cacheLesson(options.userId, options.skillId, options.tier, lesson);
      return lesson;
    } catch (err) {
      if (!(err instanceof AIServiceError)) throw err;
      console.error(
        `[LessonGeneration] AI failed (${err.kind}) for user=${options.userId} skill=${options.skillId}: ${err.message}`
      );
    }

    // Step 2: Check DB cache
    const cachedLesson = await this._getCachedLesson(options.userId, options.skillId);
    if (cachedLesson) {
      console.warn(
        `[LessonGeneration] Serving cached lesson for user=${options.userId} skill=${options.skillId}`
      );
      return cachedLesson;
    }

    // Step 3: Fallback to first static lesson for this skill path
    const staticLesson = await this._getStaticLesson(options.skillId, options.skillLevel);
    if (staticLesson) {
      console.warn(
        `[LessonGeneration] Serving static fallback for user=${options.userId} skill=${options.skillId}`
      );
      return staticLesson;
    }

    // Step 4: No fallback available
    console.error(
      `[LessonGeneration] No fallback available for user=${options.userId} skill=${options.skillId}`
    );
    throw new AppError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'AI generation temporarily unavailable',
      503
    );
  }

  private async _cacheLesson(
    userId: string,
    skillId: string,
    model: string,
    content: LessonOutput
  ): Promise<void> {
    try {
      await prisma.generatedLesson.upsert({
        where: { userId_skillId: { userId, skillId } },
        create: { userId, skillId, model, generatedContent: content as object },
        update: { model, generatedContent: content as object, generatedAt: new Date() },
      });
    } catch (err) {
      // Non-fatal: cache write failure should not block lesson delivery
      console.error(`[LessonGeneration] Cache write failed for user=${userId} skill=${skillId}:`, err);
    }
  }

  private async _getCachedLesson(
    userId: string,
    skillId: string
  ): Promise<LessonOutput | null> {
    const cached = await prisma.generatedLesson.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });
    if (!cached) return null;
    return cached.generatedContent as unknown as LessonOutput;
  }

  private async _getStaticLesson(
    skillId: string,
    skillLevel: string
  ): Promise<LessonOutput | null> {
    const lesson = await prisma.lesson.findFirst({
      where: {
        skillPath: {
          skillId,
          level: skillLevel,
        },
      },
      orderBy: { day: 'asc' },
      include: { quizzes: true },
    });

    if (!lesson) return null;

    const quiz = lesson.quizzes[0];

    return {
      title: lesson.title,
      content: lesson.content,
      estimated_minutes: lesson.durationMinutes,
      key_takeaways: [],
      quiz: quiz
        ? {
            question: quiz.question,
            options: quiz.options,
            correct_answer: quiz.correctAnswer,
            explanation: quiz.explanation,
          }
        : {
            question: 'What did you learn from this lesson?',
            options: ['option A', 'option B', 'option C', 'option D'],
            correct_answer: 'option A',
            explanation: 'Review the lesson content for details.',
          },
    };
  }
}

export const lessonGenerationService = new LessonGenerationService();
