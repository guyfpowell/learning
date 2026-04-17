import cron from 'node-cron';
import { prisma } from '../db';
import { pushNotificationService } from '../services/PushNotificationService';
import { streakService } from '../services/StreakService';

const IDEMPOTENCY_HOURS = 20;

/**
 * Runs every hour. At 6 PM in each user's local timezone, sends a
 * "streak at risk" reminder if they haven't completed today's lesson.
 */
export function startStreakAtRiskJob(): void {
  cron.schedule('0 * * * *', async () => {
    const cutoff = new Date(Date.now() - IDEMPOTENCY_HOURS * 60 * 60 * 1000);

    // Get all users with streak notifications enabled
    const prefs = await prisma.notificationPreference.findMany({
      where: { enableStreak: true },
      select: { userId: true },
    });

    const userIds = prefs.map((p) => p.userId);
    if (userIds.length === 0) return;

    // Idempotency: skip users already sent a streak-at-risk reminder recently
    const recentlySent = await prisma.notification.findMany({
      where: {
        userId: { in: userIds },
        type: 'streak-at-risk',
        sentAt: { gte: cutoff },
      },
      select: { userId: true },
    });
    const recentIds = new Set(recentlySent.map((n) => n.userId));

    const candidates = userIds.filter((id) => !recentIds.has(id));
    if (candidates.length === 0) return;

    for (const userId of candidates) {
      const atRisk = await streakService.isStreakAtRisk(userId);
      if (!atRisk) continue;

      const progress = await prisma.userProgress.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      const streak = progress?.streakCount ?? 0;
      const body =
        streak > 0
          ? `Don't break your ${streak}-day streak! Your lesson takes 3 minutes.`
          : 'Your lesson is waiting. Keep the habit alive.';

      await pushNotificationService.send(userId, {
        title: "Don't lose your streak",
        body,
        data: { screen: 'lessons' },
      });

      await prisma.notification.create({
        data: { userId, type: 'streak-at-risk' },
      });
    }
  });
}
