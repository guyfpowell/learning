import { prisma } from '../db';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import webpush, { PushSubscription } from 'web-push';

const expo = new Expo();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@learningapp.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class PushNotificationService {
  async registerToken(
    userId: string,
    token: string,
    platform: 'expo' | 'web',
    deviceId?: string
  ): Promise<void> {
    await prisma.pushToken.upsert({
      where: {
        userId_platform_deviceId: {
          userId,
          platform,
          deviceId: deviceId ?? '',
        },
      },
      update: { token, updatedAt: new Date() },
      create: { userId, token, platform, deviceId: deviceId ?? '' },
    });
  }

  async send(userId: string, payload: PushPayload): Promise<void> {
    const tokens = await prisma.pushToken.findMany({ where: { userId } });
    if (tokens.length === 0) return;

    const expoTokens = tokens.filter((t) => t.platform === 'expo');
    const webTokens = tokens.filter((t) => t.platform === 'web');

    await Promise.allSettled([
      this.sendExpo(userId, expoTokens, payload),
      this.sendWeb(userId, webTokens, payload),
    ]);
  }

  private async sendExpo(
    userId: string,
    tokens: { id: string; token: string }[],
    payload: PushPayload
  ): Promise<void> {
    const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t.token));
    if (validTokens.length === 0) return;

    const messages: ExpoPushMessage[] = validTokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data,
    }));

    // Batch in groups of ≤100 per Expo spec
    const chunks = expo.chunkPushNotifications(messages);
    const staleIds: string[] = [];

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);
        tickets.forEach((ticket, i) => {
          if (ticket.status === 'error') {
            const details = (ticket as { details?: { error?: string } }).details;
            if (details?.error === 'DeviceNotRegistered') {
              staleIds.push(validTokens[i].id);
            }
          }
        });
      } catch {
        // Non-blocking — log and continue
      }
    }

    if (staleIds.length > 0) {
      await prisma.pushToken.deleteMany({ where: { id: { in: staleIds } } });
    }
  }

  private async sendWeb(
    userId: string,
    tokens: { id: string; token: string }[],
    payload: PushPayload
  ): Promise<void> {
    if (!process.env.VAPID_PUBLIC_KEY) return;

    const staleIds: string[] = [];

    await Promise.allSettled(
      tokens.map(async (t) => {
        try {
          const subscription: PushSubscription = JSON.parse(t.token);
          await webpush.sendNotification(
            subscription,
            JSON.stringify({ title: payload.title, body: payload.body, data: payload.data })
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 410 || status === 404) {
            staleIds.push(t.id);
          }
          // Other errors: log and continue
        }
      })
    );

    if (staleIds.length > 0) {
      await prisma.pushToken.deleteMany({ where: { id: { in: staleIds } } });
    }
  }
}

export const pushNotificationService = new PushNotificationService();
