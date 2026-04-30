import { prisma } from '../db';

export class TeamAnalyticsService {
  async getTeamSummary(teamId: string) {
    const members = await prisma.teamMember.findMany({ where: { teamId } });
    const userIds = members.map((m) => m.userId);

    const progress = await prisma.userProgress.findMany({
      where: { userId: { in: userIds }, completedAt: { not: null } },
      select: { quizScore: true, streakCount: true },
    });

    const totalCompletions = progress.length;
    const avgQuizScore = totalCompletions
      ? progress.reduce((sum, p) => sum + (p.quizScore ?? 0), 0) / totalCompletions
      : 0;
    const avgStreak = totalCompletions
      ? progress.reduce((sum, p) => sum + p.streakCount, 0) / totalCompletions
      : 0;

    return { memberCount: members.length, totalCompletions, avgQuizScore, avgStreak };
  }

  async getMemberProgress(teamId: string) {
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        progress: {
          where: { completedAt: { not: null } },
          orderBy: { completedAt: 'desc' },
          include: { lesson: { include: { skillPath: { include: { skill: { select: { name: true } } } } } } },
        },
      } as any,
    });

    return members.map((m: any) => {
      const completed = m.progress.filter((p: any) => p.completedAt);
      const avgScore = completed.length
        ? completed.reduce((sum: number, p: any) => sum + (p.quizScore ?? 0), 0) / completed.length
        : 0;
      const latest = completed[0];
      return {
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        lessonsCompleted: completed.length,
        avgScore,
        streak: latest?.streakCount ?? 0,
        lastActive: latest?.completedAt ?? null,
        currentSkill: latest?.lesson?.skillPath?.skill?.name ?? null,
      };
    });
  }

  async getSkillGapAnalysis(teamId: string) {
    const members = await prisma.teamMember.findMany({ where: { teamId } });
    const userIds = members.map((m) => m.userId);

    const progress = await prisma.userProgress.findMany({
      where: { userId: { in: userIds }, completedAt: { not: null }, quizScore: { not: null } },
      include: {
        lesson: { include: { skillPath: { include: { skill: { select: { id: true, name: true } } } } } },
      },
    });

    const skillMap = new Map<string, { skillName: string; scores: number[] }>();
    for (const p of progress) {
      const skill = (p as any).lesson?.skillPath?.skill;
      if (!skill) continue;
      if (!skillMap.has(skill.id)) skillMap.set(skill.id, { skillName: skill.name, scores: [] });
      skillMap.get(skill.id)!.scores.push((p as any).quizScore ?? 0);
    }

    return Array.from(skillMap.values())
      .map(({ skillName, scores }) => ({
        skillName,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        sampleSize: scores.length,
      }))
      .sort((a, b) => a.avgScore - b.avgScore);
  }

  async getTeamLeaderboard(teamId: string) {
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, name: true } },
        progress: {
          where: { completedAt: { not: null } },
          select: { streakCount: true, completedAt: true },
        },
      } as any,
    });

    return members
      .map((m: any) => {
        const completed = m.progress as Array<{ streakCount: number; completedAt: Date | null }>;
        const maxStreak = completed.reduce((max, p) => Math.max(max, p.streakCount), 0);
        return {
          userId: m.userId,
          name: m.user.name,
          streak: maxStreak,
          lessonsCompleted: completed.length,
        };
      })
      .sort((a: any, b: any) => b.streak - a.streak || b.lessonsCompleted - a.lessonsCompleted)
      .slice(0, 10);
  }
}

export const teamAnalyticsService = new TeamAnalyticsService();
