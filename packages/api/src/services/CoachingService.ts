import { prisma } from '../db';
import { aiServiceClient } from './AIServiceClient';
import type { CoachingRequest } from '@learning/shared';

const PRO_TIERS = new Set(['pro', 'premium']);

export interface QuizResult {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface GenerateFeedbackInput {
  userId: string;
  lessonId: string;
  skillId: string;
  tier: string;
  quizResult: QuizResult;
  lessonTitle: string;
  lessonContent: string;
  skillRating?: number;
  learningStyle?: string;
  goal?: string;
}

export class CoachingService {
  /**
   * Generates personalised coaching feedback for Pro/Premium users after a quiz.
   * Never throws — returns null on any error or non-qualifying tier.
   */
  async generateFeedback(input: GenerateFeedbackInput): Promise<string | null> {
    if (!PRO_TIERS.has(input.tier)) return null;

    // Check cache first
    const cached = await this._getCachedCoaching(input.userId, input.skillId);
    if (cached) return cached;

    try {
      const request: CoachingRequest = {
        messages: [
          {
            role: 'user',
            content: `I just completed a quiz on "${input.lessonTitle}". The question was: "${input.quizResult.question}". I answered "${input.quizResult.userAnswer}" which was ${input.quizResult.isCorrect ? 'correct' : 'incorrect'}. The correct answer is "${input.quizResult.correctAnswer}". ${input.quizResult.explanation}`,
          },
        ],
        lesson_context: `${input.lessonTitle}: ${input.lessonContent.slice(0, 300)}`,
        user_context: {
          skill_rating: String(input.skillRating ?? 1000),
          learning_style: input.learningStyle ?? 'general',
          goal: input.goal ?? '',
        },
        tier: input.tier,
      };

      const output = await aiServiceClient.coachingMessage(request);
      const message = output.message;

      await this._cacheCoaching(input.userId, input.skillId, message);
      return message;
    } catch {
      // Per ADR-002: never throw; coaching failure must not block quiz delivery
      return null;
    }
  }

  private async _getCachedCoaching(userId: string, skillId: string): Promise<string | null> {
    try {
      const record = await prisma.generatedLesson.findUnique({
        where: { userId_skillId: { userId, skillId } },
        select: { coachingMessage: true },
      });
      return record?.coachingMessage ?? null;
    } catch {
      return null;
    }
  }

  private async _cacheCoaching(userId: string, skillId: string, message: string): Promise<void> {
    try {
      await prisma.generatedLesson.upsert({
        where: { userId_skillId: { userId, skillId } },
        create: {
          userId,
          skillId,
          model: 'coaching',
          generatedContent: {},
          coachingMessage: message,
        },
        update: { coachingMessage: message },
      });
    } catch {
      // Non-fatal
    }
  }
}

export const coachingService = new CoachingService();
