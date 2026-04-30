import { TeamAnalyticsService } from '../TeamAnalyticsService';
import { prisma } from '../../db';

jest.mock('../../db', () => ({
  prisma: {
    teamMember: { findMany: jest.fn() },
    userProgress: { findMany: jest.fn(), aggregate: jest.fn() },
  },
}));

describe('TeamAnalyticsService', () => {
  let service: TeamAnalyticsService;

  beforeEach(() => {
    service = new TeamAnalyticsService();
    jest.clearAllMocks();
  });

  describe('getTeamSummary', () => {
    it('returns aggregated stats for team members', async () => {
      (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([
        { userId: 'u1' },
        { userId: 'u2' },
      ]);
      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([
        { userId: 'u1', completedAt: new Date(), quizScore: 80, streakCount: 5 },
        { userId: 'u1', completedAt: new Date(), quizScore: 60, streakCount: 5 },
        { userId: 'u2', completedAt: new Date(), quizScore: 90, streakCount: 3 },
      ]);

      const result = await service.getTeamSummary('t1');

      expect(result.totalCompletions).toBe(3);
      expect(result.avgQuizScore).toBeCloseTo(76.67, 0);
      expect(result.avgStreak).toBeCloseTo(4.33, 0);
      expect(result.memberCount).toBe(2);
    });

    it('returns zeros for team with no progress', async () => {
      (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([{ userId: 'u1' }]);
      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getTeamSummary('t1');

      expect(result.totalCompletions).toBe(0);
      expect(result.avgQuizScore).toBe(0);
      expect(result.avgStreak).toBe(0);
    });
  });

  describe('getMemberProgress', () => {
    it('returns per-member breakdown', async () => {
      (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([
        {
          userId: 'u1',
          user: { id: 'u1', name: 'Alice', email: 'alice@example.com' },
          progress: [
            { completedAt: new Date('2026-04-02'), quizScore: 80, streakCount: 4, lesson: { skillPath: { skill: { name: 'Strategy' } } } },
            { completedAt: new Date('2026-04-01'), quizScore: 70, streakCount: 3, lesson: { skillPath: { skill: { name: 'Strategy' } } } },
          ],
        },
      ]);

      const result = await service.getMemberProgress('t1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
      expect(result[0].lessonsCompleted).toBe(2);
      expect(result[0].avgScore).toBe(75);
      expect(result[0].streak).toBe(4);
      expect(result[0].currentSkill).toBe('Strategy');
    });

    it('handles member with no progress', async () => {
      (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([
        {
          userId: 'u1',
          user: { id: 'u1', name: 'Bob', email: 'bob@example.com' },
          progress: [],
        },
      ]);

      const result = await service.getMemberProgress('t1');

      expect(result[0].lessonsCompleted).toBe(0);
      expect(result[0].avgScore).toBe(0);
      expect(result[0].streak).toBe(0);
      expect(result[0].currentSkill).toBeNull();
    });
  });

  describe('getSkillGapAnalysis', () => {
    it('returns skills sorted by avg score ascending', async () => {
      (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([
        { userId: 'u1' }, { userId: 'u2' },
      ]);
      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([
        { quizScore: 90, lesson: { skillPath: { skill: { id: 's1', name: 'Prompt Engineering' } } } },
        { quizScore: 40, lesson: { skillPath: { skill: { id: 's2', name: 'AI Governance' } } } },
        { quizScore: 50, lesson: { skillPath: { skill: { id: 's2', name: 'AI Governance' } } } },
      ]);

      const result = await service.getSkillGapAnalysis('t1');

      expect(result[0].skillName).toBe('AI Governance');
      expect(result[0].avgScore).toBe(45);
      expect(result[1].skillName).toBe('Prompt Engineering');
    });
  });

  describe('getTeamLeaderboard', () => {
    it('returns top members ranked by streak then completions', async () => {
      (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([
        {
          userId: 'u1',
          user: { id: 'u1', name: 'Alice' },
          progress: [
            { completedAt: new Date(), streakCount: 10 },
            { completedAt: new Date(), streakCount: 10 },
          ],
        },
        {
          userId: 'u2',
          user: { id: 'u2', name: 'Bob' },
          progress: [
            { completedAt: new Date(), streakCount: 5 },
          ],
        },
      ]);

      const result = await service.getTeamLeaderboard('t1');

      expect(result[0].name).toBe('Alice');
      expect(result[0].streak).toBe(10);
      expect(result[0].lessonsCompleted).toBe(2);
      expect(result[1].name).toBe('Bob');
    });

    it('limits result to top 10', async () => {
      const members = Array.from({ length: 15 }, (_, i) => ({
        userId: `u${i}`,
        user: { id: `u${i}`, name: `User ${i}` },
        progress: [{ completedAt: new Date(), streakCount: i }],
      }));
      (prisma.teamMember.findMany as jest.Mock).mockResolvedValue(members);

      const result = await service.getTeamLeaderboard('t1');

      expect(result.length).toBeLessThanOrEqual(10);
    });
  });
});
