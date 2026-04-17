import { EngagementService } from '../EngagementService';
import { prisma } from '../../db';

jest.mock('../../db', () => ({
  prisma: {
    userProgress: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('EngagementService', () => {
  let service: EngagementService;

  beforeEach(() => {
    service = new EngagementService();
    jest.clearAllMocks();
    (prisma.userProgress.upsert as jest.Mock).mockResolvedValue({});
  });

  describe('recordEngagement', () => {
    it('upserts with completionTime and rating', async () => {
      await service.recordEngagement({
        userId: 'u1',
        lessonId: 'l1',
        completionTime: 180,
        rating: 1,
      });

      expect(prisma.userProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_lessonId: { userId: 'u1', lessonId: 'l1' } },
          update: expect.objectContaining({ completionTime: 180, rating: 1 }),
        })
      );
    });

    it('increments revisitCount on update', async () => {
      await service.recordEngagement({ userId: 'u1', lessonId: 'l1' });

      const call = (prisma.userProgress.upsert as jest.Mock).mock.calls[0][0];
      expect(call.update.revisitCount).toEqual({ increment: 1 });
    });
  });

  describe('getEngagementSignals', () => {
    it('returns defaults when no completed lessons', async () => {
      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([]);

      const signals = await service.getEngagementSignals('u1');

      expect(signals).toEqual({
        avgCompletionRatio: 1.0,
        avgFirstAttemptAccuracy: 0.5,
        avgRevisitCount: 0,
      });
    });

    it('computes correct averages from progress records', async () => {
      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([
        {
          completedAt: new Date(),
          completionTime: 120,   // 2 min actual
          quizScore: 80,
          revisitCount: 1,
          lesson: { durationMinutes: 3 }, // 3 min estimated → ratio = 120/180 ≈ 0.67
        },
        {
          completedAt: new Date(),
          completionTime: 240,   // 4 min actual
          quizScore: 60,
          revisitCount: 3,
          lesson: { durationMinutes: 3 }, // ratio = 240/180 ≈ 1.33
        },
      ]);

      const signals = await service.getEngagementSignals('u1');

      expect(signals.avgCompletionRatio).toBeCloseTo(1.0, 1); // (0.67 + 1.33) / 2
      expect(signals.avgFirstAttemptAccuracy).toBeCloseTo(0.7, 2); // (0.8 + 0.6) / 2
      expect(signals.avgRevisitCount).toBe(2); // (1 + 3) / 2
    });
  });
});
