import { SkillTracker } from '../SkillTracker';
import { prisma } from '../../db';

jest.mock('../../db', () => ({
  prisma: {
    userSkillRating: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

describe('SkillTracker', () => {
  let tracker: SkillTracker;

  beforeEach(() => {
    tracker = new SkillTracker();
    jest.clearAllMocks();
    (prisma.userSkillRating.upsert as jest.Mock).mockResolvedValue({});
  });

  describe('getCurrentLevel', () => {
    it('returns beginner when rating < 800', async () => {
      (prisma.userSkillRating.findUnique as jest.Mock).mockResolvedValue({ rating: 750 });
      expect(await tracker.getCurrentLevel('u1', 's1')).toBe('beginner');
    });

    it('returns intermediate when rating is 800–1200', async () => {
      (prisma.userSkillRating.findUnique as jest.Mock).mockResolvedValue({ rating: 1000 });
      expect(await tracker.getCurrentLevel('u1', 's1')).toBe('intermediate');
    });

    it('returns advanced when rating > 1200', async () => {
      (prisma.userSkillRating.findUnique as jest.Mock).mockResolvedValue({ rating: 1300 });
      expect(await tracker.getCurrentLevel('u1', 's1')).toBe('advanced');
    });

    it('defaults to intermediate (1000) when no record exists', async () => {
      (prisma.userSkillRating.findUnique as jest.Mock).mockResolvedValue(null);
      expect(await tracker.getCurrentLevel('u1', 's1')).toBe('intermediate');
    });
  });

  describe('updateRating', () => {
    it('increases rating when quiz score > 80', async () => {
      (prisma.userSkillRating.findUnique as jest.Mock).mockResolvedValue({ rating: 1000 });

      await tracker.updateRating('u1', 's1', 90);

      const call = (prisma.userSkillRating.upsert as jest.Mock).mock.calls[0][0];
      expect(call.create.rating).toBeGreaterThan(1000);
      expect(call.update.rating).toBeGreaterThan(1000);
    });

    it('decreases rating when quiz score < 50', async () => {
      (prisma.userSkillRating.findUnique as jest.Mock).mockResolvedValue({ rating: 1000 });

      await tracker.updateRating('u1', 's1', 30);

      const call = (prisma.userSkillRating.upsert as jest.Mock).mock.calls[0][0];
      expect(call.create.rating).toBeLessThan(1000);
    });

    it('creates a new record when none exists (starts at 1000)', async () => {
      (prisma.userSkillRating.findUnique as jest.Mock).mockResolvedValue(null);

      await tracker.updateRating('u1', 's1', 50);

      expect(prisma.userSkillRating.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_skillId: { userId: 'u1', skillId: 's1' } },
        })
      );
    });

    it('transitions from intermediate to advanced after many high scores', () => {
      // Verify level boundary: rating > 1200 → advanced
      expect(tracker.getRatingToLevel(1201)).toBe('advanced');
      expect(tracker.getRatingToLevel(1200)).toBe('intermediate');
      expect(tracker.getRatingToLevel(800)).toBe('intermediate');
      expect(tracker.getRatingToLevel(799)).toBe('beginner');
    });
  });
});
