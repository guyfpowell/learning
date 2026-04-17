import { prisma } from '../db';

const MILESTONES: Record<number, string> = {
  7: '7-day streak',
  14: '2-week streak',
  30: '30-day streak',
  60: '2-month streak',
  100: '100-day streak',
  365: '365-day streak',
};

const STREAK_MESSAGES: { threshold: number; message: string }[] = [
  { threshold: 365, message: "A full year of learning. You're extraordinary." },
  { threshold: 100, message: "100 days strong. You've built something rare." },
  { threshold: 60, message: "Two months in. This is who you are now." },
  { threshold: 30, message: "30 days. You've proven you can do this." },
  { threshold: 14, message: "Two weeks running. Real habits are forming." },
  { threshold: 7, message: "One week solid. You're on a roll." },
  { threshold: 3, message: "Three days in a row. Keep the momentum going." },
  { threshold: 1, message: "Day one done. See you tomorrow." },
];

export class StreakService {
  getMilestone(streakCount: number): string | null {
    return MILESTONES[streakCount] ?? null;
  }

  getStreakMessage(streakCount: number): string {
    const match = STREAK_MESSAGES.find((m) => streakCount >= m.threshold);
    return match?.message ?? 'Every lesson counts. Keep going.';
  }

  async isStreakAtRisk(userId: string): Promise<boolean> {
    const [progress, profile] = await Promise.all([
      prisma.userProgress.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
    ]);

    // No streak to risk
    if (!progress || !progress.lastLessonDate) return false;

    const timezone = profile?.timezone ?? 'UTC';
    const nowInTz = new Date(
      new Date().toLocaleString('en-US', { timeZone: timezone })
    );
    const todayStart = new Date(nowInTz);
    todayStart.setHours(0, 0, 0, 0);

    const lastLesson = new Date(progress.lastLessonDate);
    const lastLessonDay = new Date(
      lastLesson.toLocaleString('en-US', { timeZone: timezone })
    );
    lastLessonDay.setHours(0, 0, 0, 0);

    const completedToday = lastLessonDay.getTime() === todayStart.getTime();
    const isPastSixPM = nowInTz.getHours() >= 18;

    return !completedToday && isPastSixPM && progress.streakCount > 0;
  }
}

export const streakService = new StreakService();
