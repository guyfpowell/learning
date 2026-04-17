import { RecommendationEngine } from '../RecommendationEngine';
import { prisma } from '../../db';

jest.mock('../../db', () => ({
  prisma: {
    userProgress: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const makeProgress = (
  lessonId: string,
  day: number,
  completedAt: Date | null,
  quizScore: number | null = null,
  revisitCount = 0
) => ({
  lessonId,
  completedAt,
  quizScore,
  completionTime: null,
  revisitCount,
  lesson: { skillPathId: 'path-1', day },
});

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = new RecommendationEngine();
    jest.clearAllMocks();
    (prisma.userProgress.upsert as jest.Mock).mockResolvedValue({});
  });

  describe('getNextLesson — cold start', () => {
    it('returns first incomplete lesson by day order when fewer than 3 completed', async () => {
      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([
        makeProgress('lesson-1', 1, new Date(), 80), // completed
        makeProgress('lesson-2', 2, null),            // incomplete ← next
        makeProgress('lesson-3', 3, null),
      ]);

      const result = await engine.getNextLesson('user-1', 'path-1');
      expect(result).toBe('lesson-2');
    });

    it('returns null when all lessons are complete and still in cold start', async () => {
      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([
        makeProgress('lesson-1', 1, new Date(), 80),
        makeProgress('lesson-2', 2, new Date(), 70),
      ]);

      const result = await engine.getNextLesson('user-1', 'path-1');
      expect(result).toBeNull();
    });
  });

  describe('getNextLesson — UCB1 (post cold start)', () => {
    it('uses UCB1 scoring after 3 lessons completed', async () => {
      // 3 completed, 2 incomplete
      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([
        makeProgress('lesson-1', 1, new Date(), 80),
        makeProgress('lesson-2', 2, new Date(), 60),
        makeProgress('lesson-3', 3, new Date(), 90),
        makeProgress('lesson-4', 4, null, null, 0),   // low revisit → high exploration
        makeProgress('lesson-5', 5, null, null, 5),   // high revisit → lower exploration bonus
      ]);

      const result = await engine.getNextLesson('user-1', 'path-1');
      // lesson-4 has revisitCount=0 → pulls=1 → higher UCB exploration term
      expect(result).toBe('lesson-4');
    });
  });

  describe('recordOutcome', () => {
    it('upserts progress with score and completionTime', async () => {
      await engine.recordOutcome('user-1', 'lesson-1', 85, 120);

      expect(prisma.userProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_lessonId: { userId: 'user-1', lessonId: 'lesson-1' } },
          update: { quizScore: 85, completionTime: 120 },
        })
      );
    });
  });
});
