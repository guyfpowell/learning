import { AdminService } from '../AdminService';
import { prisma } from '../../db';
import { AppError } from '../../middleware/error-handler';

jest.mock('../../db', () => ({
  prisma: {
    skill: { findMany: jest.fn(), create: jest.fn() },
    skillPath: { findMany: jest.fn(), create: jest.fn() },
    lesson: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    user: { findMany: jest.fn(), count: jest.fn() },
    userProgress: { count: jest.fn(), groupBy: jest.fn() },
    subscription: { count: jest.fn(), groupBy: jest.fn() },
  },
}));

describe('AdminService', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService();
    jest.clearAllMocks();
  });

  describe('listSkills', () => {
    it('returns all skills with path counts', async () => {
      const mockSkills = [{ id: 's1', name: 'Product Strategy', _count: { skillPaths: 2 } }];
      (prisma.skill.findMany as jest.Mock).mockResolvedValue(mockSkills);

      const result = await adminService.listSkills();

      expect(result).toEqual(mockSkills);
      expect(prisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { _count: { select: { skillPaths: true } } },
        })
      );
    });
  });

  describe('createSkill', () => {
    it('creates a skill', async () => {
      const input = { name: 'New Skill', description: 'Desc', category: 'product-management' };
      const created = { id: 's2', ...input };
      (prisma.skill.create as jest.Mock).mockResolvedValue(created);

      const result = await adminService.createSkill(input);

      expect(result).toEqual(created);
      expect(prisma.skill.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('listSkillPaths', () => {
    it('returns all skill paths with skill relation', async () => {
      const mockPaths = [{ id: 'sp1', level: 'beginner', skill: { name: 'Product Strategy' } }];
      (prisma.skillPath.findMany as jest.Mock).mockResolvedValue(mockPaths);

      const result = await adminService.listSkillPaths();

      expect(result).toEqual(mockPaths);
      expect(prisma.skillPath.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined })
      );
    });

    it('filters by skillId when provided', async () => {
      (prisma.skillPath.findMany as jest.Mock).mockResolvedValue([]);

      await adminService.listSkillPaths('s1');

      expect(prisma.skillPath.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { skillId: 's1' } })
      );
    });
  });

  describe('createSkillPath', () => {
    it('creates a skill path', async () => {
      const input = { skillId: 's1', level: 'beginner', durationHours: 10 };
      const created = { id: 'sp2', ...input };
      (prisma.skillPath.create as jest.Mock).mockResolvedValue(created);

      const result = await adminService.createSkillPath(input);

      expect(result).toEqual(created);
    });
  });

  describe('listLessons', () => {
    it('returns paginated lessons', async () => {
      const mockLessons = [{ id: 'l1', title: 'Lesson 1' }];
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
      (prisma.lesson.count as jest.Mock).mockResolvedValue(1);

      const result = await adminService.listLessons({ page: 1 });

      expect(result.lessons).toEqual(mockLessons);
      expect(result.total).toBe(1);
    });

    it('filters by skill when provided', async () => {
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.lesson.count as jest.Mock).mockResolvedValue(0);

      await adminService.listLessons({ page: 1, skill: 'Product Strategy' });

      expect(prisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            skillPath: expect.objectContaining({
              skill: expect.objectContaining({ name: 'Product Strategy' }),
            }),
          }),
        })
      );
    });

    it('filters by skillPathId and orders by day when provided', async () => {
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.lesson.count as jest.Mock).mockResolvedValue(0);

      await adminService.listLessons({ page: 1, skillPathId: 'sp1' });

      expect(prisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { skillPathId: 'sp1' },
          orderBy: { day: 'asc' },
        })
      );
    });
  });

  describe('createLesson', () => {
    it('creates a lesson', async () => {
      const input = {
        skillPathId: 'sp1', day: 1, title: 'New', content: 'Content',
        durationMinutes: 5, difficulty: 'beginner',
      };
      const created = { id: 'l2', ...input };
      (prisma.lesson.create as jest.Mock).mockResolvedValue(created);

      const result = await adminService.createLesson(input);

      expect(result).toEqual(created);
    });
  });

  describe('updateLesson', () => {
    it('updates a lesson', async () => {
      const updated = { id: 'l1', title: 'Updated' };
      (prisma.lesson.update as jest.Mock).mockResolvedValue(updated);

      const result = await adminService.updateLesson('l1', { title: 'Updated' });

      expect(result).toEqual(updated);
      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: { title: 'Updated' },
      });
    });
  });

  describe('deleteLesson', () => {
    it('soft-deletes by setting published=false', async () => {
      const updated = { id: 'l1', published: false };
      (prisma.lesson.update as jest.Mock).mockResolvedValue(updated);

      const result = await adminService.deleteLesson('l1');

      expect(result.published).toBe(false);
      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: { published: false },
      });
    });
  });

  describe('listUsers', () => {
    it('returns paginated users with subscription', async () => {
      const mockUsers = [{ id: 'u1', email: 'a@b.com' }];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const result = await adminService.listUsers({ page: 1 });

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(1);
    });
  });

  describe('getStats', () => {
    it('returns platform stats including lessonCompletionRate', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(42);
      (prisma.userProgress.count as jest.Mock)
        .mockResolvedValueOnce(10)  // dau
        .mockResolvedValueOnce(8)   // completions7d
        .mockResolvedValueOnce(10); // starts7d
      (prisma.subscription.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await adminService.getStats();

      expect(result.totalUsers).toBe(42);
      expect(result.dau).toBe(10);
      expect(result.mrr).toBe(0);
      expect(result.lessonCompletionRate).toBeCloseTo(0.8);
    });

    it('returns 0 lessonCompletionRate when no lessons started', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.userProgress.count as jest.Mock).mockResolvedValue(0);
      (prisma.subscription.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await adminService.getStats();

      expect(result.lessonCompletionRate).toBe(0);
    });
  });
});
