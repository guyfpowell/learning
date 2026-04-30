import { prisma } from '../db';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

const PAGE_SIZE = 20;

export interface CreateSkillInput {
  name: string;
  description: string;
  category: string;
}

export interface CreateSkillPathInput {
  skillId: string;
  level: string;
  durationHours: number;
  teamId?: string;
}

export interface CreateLessonInput {
  skillPathId: string;
  day: number;
  title: string;
  content: string;
  durationMinutes: number;
  difficulty: string;
  mediaUrl?: string;
}

export interface UpdateLessonInput {
  title?: string;
  content?: string;
  durationMinutes?: number;
  difficulty?: string;
  mediaUrl?: string;
  published?: boolean;
  day?: number;
  skillPathId?: string;
}

export interface ListLessonsOptions {
  page: number;
  skill?: string;
  level?: string;
  skillPathId?: string;
}

export interface ListUsersOptions {
  page: number;
}

export class AdminService {
  async listSkills() {
    return prisma.skill.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { skillPaths: true } } },
    });
  }

  async createSkill(input: CreateSkillInput) {
    return prisma.skill.create({ data: input });
  }

  async listSkillPaths(skillId?: string) {
    return prisma.skillPath.findMany({
      where: skillId ? { skillId } : undefined,
      include: { skill: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSkillPath(input: CreateSkillPathInput) {
    return prisma.skillPath.create({ data: input });
  }

  async listLessons(options: ListLessonsOptions) {
    const { page, skill, level, skillPathId } = options;
    const skip = (page - 1) * PAGE_SIZE;

    const where: Record<string, unknown> = {};
    if (skillPathId) {
      where.skillPathId = skillPathId;
    } else if (skill || level) {
      where.skillPath = {};
      if (skill) (where.skillPath as Record<string, unknown>).skill = { name: skill };
      if (level) (where.skillPath as Record<string, unknown>).level = level;
    }

    const orderBy = skillPathId ? { day: 'asc' as const } : { createdAt: 'desc' as const };

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: { skillPath: { include: { skill: true } } },
        orderBy,
        skip,
        take: PAGE_SIZE,
      }),
      prisma.lesson.count({ where }),
    ]);

    return { lessons, total, page, pageSize: PAGE_SIZE };
  }

  async createLesson(input: CreateLessonInput) {
    return prisma.lesson.create({ data: input });
  }

  async updateLesson(id: string, input: UpdateLessonInput) {
    return prisma.lesson.update({
      where: { id },
      data: input,
    });
  }

  async deleteLesson(id: string) {
    return prisma.lesson.update({
      where: { id },
      data: { published: false },
    });
  }

  async listUsers(options: ListUsersOptions) {
    const { page } = options;
    const skip = (page - 1) * PAGE_SIZE;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          subscriptions: {
            select: { status: true, plan: { select: { name: true } } },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.user.count(),
    ]);

    return { users, total, page, pageSize: PAGE_SIZE };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalUsers, dau, subscriptionGroups, completions7d, starts7d] = await Promise.all([
      prisma.user.count(),
      prisma.userProgress.count({
        where: { completedAt: { gte: today } },
      }),
      prisma.subscription.groupBy({
        by: ['planId'],
        where: { status: 'active' },
        _count: true,
      }),
      prisma.userProgress.count({ where: { completedAt: { gte: sevenDaysAgo } } }),
      prisma.userProgress.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    return {
      totalUsers,
      dau,
      activeSubscribers: subscriptionGroups.reduce((sum, g) => sum + g._count, 0),
      mrr: 0, // Phase 5 (Stripe) will implement real MRR
      lessonCompletionRate: starts7d > 0 ? completions7d / starts7d : 0,
    };
  }
}

export const adminService = new AdminService();
