import cron from 'node-cron';
import { prisma } from '../db';
import { pushNotificationService } from '../services/PushNotificationService';

const PREFERRED_TIME_HOURS: Record<string, number> = {
  morning: 8,
  afternoon: 13,
  evening: 19,
};

const IDEMPOTENCY_HOURS = 20;

/**
 * Runs every hour. Sends a daily reminder to users whose preferred lesson
 * time matches the current UTC hour, and who haven't completed today's lesson.
 * Idempotency: skips users already sent a reminder in the past 20 hours.
 */
export function startDailyReminderJob(): void {
  cron.schedule('0 * * * *', async () => {
    const currentHourUTC = new Date().getUTCHours();

    const preferredTimes = Object.entries(PREFERRED_TIME_HOURS)
      .filter(([, hour]) => hour === currentHourUTC)
      .map(([time]) => time);

    if (preferredTimes.length === 0) return;

    const cutoff = new Date(Date.now() - IDEMPOTENCY_HOURS * 60 * 60 * 1000);

    // Find users whose preferred time matches this hour and reminders are enabled
    const profiles = await prisma.userProfile.findMany({
      where: { preferredTime: { in: preferredTimes } },
      select: { userId: true },
    });

    const userIds = profiles.map((p) => p.userId);
    if (userIds.length === 0) return;

    // Filter to those with daily reminder enabled
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: { in: userIds }, enableDailyReminder: true },
      select: { userId: true },
    });

    const eligibleIds = prefs.map((p) => p.userId);
    if (eligibleIds.length === 0) return;

    // Idempotency: exclude users already sent a daily-reminder recently
    const recentlySent = await prisma.notification.findMany({
      where: {
        userId: { in: eligibleIds },
        type: 'daily-reminder',
        sentAt: { gte: cutoff },
      },
      select: { userId: true },
    });
    const recentIds = new Set(recentlySent.map((n) => n.userId));

    // Skip users who completed today's lesson
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const completedToday = await prisma.userProgress.findMany({
      where: {
        userId: { in: eligibleIds },
        completedAt: { gte: todayStart },
      },
      select: { userId: true },
    });
    const completedIds = new Set(completedToday.map((p) => p.userId));

    const targetIds = eligibleIds.filter(
      (id) => !recentIds.has(id) && !completedIds.has(id)
    );

    for (const userId of targetIds) {
      await pushNotificationService.send(userId, {
        title: 'Your daily lesson is ready',
        body: 'Keep your streak alive — 3 minutes is all it takes.',
        data: { screen: 'lessons' },
      });

      await prisma.notification.create({
        data: { userId, type: 'daily-reminder' },
      });
    }
  });
}
