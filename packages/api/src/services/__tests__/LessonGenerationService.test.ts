import { LessonGenerationService } from '../LessonGenerationService';
import { aiServiceClient, AIServiceError } from '../AIServiceClient';
import { prisma } from '../../db';

jest.mock('../AIServiceClient', () => ({
  aiServiceClient: {
    generateLesson: jest.fn(),
  },
  AIServiceError: class AIServiceError extends Error {
    constructor(
      public readonly kind: string,
      message: string
    ) {
      super(message);
      this.name = 'AIServiceError';
    }
  },
}));

jest.mock('../../db', () => ({
  prisma: {
    lesson: { findFirst: jest.fn() },
    generatedLesson: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const VALID_LESSON = {
  title: 'Python Variables',
  content: 'Variables store data.',
  estimated_minutes: 5,
  key_takeaways: ['Variables are containers'],
  quiz: {
    question: 'What is a variable?',
    options: ['A container', 'A loop', 'A function', 'A class'],
    correct_answer: 'A container',
    explanation: 'A variable stores a value.',
  },
};

const GENERATE_OPTIONS = {
  userId: 'user-1',
  skillId: 'skill-python',
  skillLevel: 'beginner',
  topic: 'Variables',
  userContext: { goal: 'learn python' },
  tier: 'pro',
};

describe('LessonGenerationService', () => {
  let service: LessonGenerationService;

  beforeEach(() => {
    service = new LessonGenerationService();
    jest.clearAllMocks();
    // Default: no cached lesson
    (prisma.generatedLesson.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.generatedLesson.upsert as jest.Mock).mockResolvedValue({});
  });

  describe('generateLesson', () => {
    it('returns AI lesson on success', async () => {
      (aiServiceClient.generateLesson as jest.Mock).mockResolvedValue(VALID_LESSON);

      const result = await service.generateLesson(GENERATE_OPTIONS);

      expect(result.title).toBe('Python Variables');
      expect(aiServiceClient.generateLesson).toHaveBeenCalledWith(
        expect.objectContaining({
          skill_id: 'skill-python',
          skill_level: 'beginner',
          topic: 'Variables',
          tier: 'pro',
        })
      );
    });

    it('caches generated lesson after successful AI call', async () => {
      (aiServiceClient.generateLesson as jest.Mock).mockResolvedValue(VALID_LESSON);

      await service.generateLesson(GENERATE_OPTIONS);

      expect(prisma.generatedLesson.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_skillId: { userId: 'user-1', skillId: 'skill-python' } },
          create: expect.objectContaining({ userId: 'user-1', skillId: 'skill-python', model: 'pro' }),
          update: expect.objectContaining({ generatedContent: VALID_LESSON }),
        })
      );
    });

    it('serves cached lesson when AI fails', async () => {
      (aiServiceClient.generateLesson as jest.Mock).mockRejectedValue(
        new AIServiceError('circuit_open', 'circuit is open')
      );
      (prisma.generatedLesson.findUnique as jest.Mock).mockResolvedValue({
        generatedContent: VALID_LESSON,
      });

      const result = await service.generateLesson(GENERATE_OPTIONS);

      expect(result.title).toBe('Python Variables');
      expect(prisma.lesson.findFirst).not.toHaveBeenCalled();
    });

    it('logs cache hit when cached lesson is served', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (aiServiceClient.generateLesson as jest.Mock).mockRejectedValue(
        new AIServiceError('timeout', 'timed out')
      );
      (prisma.generatedLesson.findUnique as jest.Mock).mockResolvedValue({
        generatedContent: VALID_LESSON,
      });

      await service.generateLesson(GENERATE_OPTIONS);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Serving cached lesson'));
      warnSpy.mockRestore();
    });

    it('does not throw when cache write fails', async () => {
      (aiServiceClient.generateLesson as jest.Mock).mockResolvedValue(VALID_LESSON);
      (prisma.generatedLesson.upsert as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.generateLesson(GENERATE_OPTIONS)).resolves.toMatchObject({
        title: 'Python Variables',
      });
    });

    it('falls back to static lesson when AI service throws AIServiceError', async () => {
      (aiServiceClient.generateLesson as jest.Mock).mockRejectedValue(
        new AIServiceError('circuit_open', 'circuit is open')
      );

      const mockStaticLesson = {
        id: 'lesson-1',
        title: 'Static Variables Lesson',
        content: 'Static content',
        durationMinutes: 10,
        quizzes: [
          {
            question: 'Quiz question?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            explanation: 'Because A',
          },
        ],
      };
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue(mockStaticLesson);

      const result = await service.generateLesson(GENERATE_OPTIONS);

      expect(result.title).toBe('Static Variables Lesson');
      expect(result.estimated_minutes).toBe(10);
      expect(result.quiz.question).toBe('Quiz question?');
    });

    it('returns 503 AppError when AI fails and no static lesson exists', async () => {
      (aiServiceClient.generateLesson as jest.Mock).mockRejectedValue(
        new AIServiceError('network_error', 'network error')
      );
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.generateLesson(GENERATE_OPTIONS)).rejects.toMatchObject({
        statusCode: 503,
        message: 'AI generation temporarily unavailable',
      });
    });

    it('logs fallback activation when static lesson is served', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (aiServiceClient.generateLesson as jest.Mock).mockRejectedValue(
        new AIServiceError('timeout', 'timed out')
      );
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({
        title: 'Static',
        content: 'content',
        durationMinutes: 5,
        quizzes: [],
      });

      await service.generateLesson(GENERATE_OPTIONS);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Serving static fallback')
      );
      warnSpy.mockRestore();
    });
  });
});
