import { startDailyReminderJob } from '../dailyReminderJob';
import { prisma } from '../../db';
import { schedule } from 'node-cron';

jest.mock('../../db', () => ({
  prisma: {
    userProfile: { findMany: jest.fn() },
    notificationPreference: { findMany: jest.fn() },
    notification: { findMany: jest.fn(), create: jest.fn() },
    userProgress: { findMany: jest.fn() },
  },
}));

jest.mock('../../services/PushNotificationService', () => ({
  pushNotificationService: { send: jest.fn().mockResolvedValue(undefined) },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockSchedule = schedule as jest.Mock;

describe('dailyReminderJob', () => {
  let cronCallback: () => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Pin clock to UTC 08:00 so PREFERRED_TIME_HOURS['morning'] === 8 matches
    jest.useFakeTimers({ now: new Date('2026-04-17T08:00:00Z') });
    mockSchedule.mockImplementation((_expr: string, cb: () => Promise<void>) => {
      cronCallback = cb;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('registers a cron schedule on start', () => {
    startDailyReminderJob();
    expect(mockSchedule).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
  });

  it('skips send when no matching profiles found', async () => {
    startDailyReminderJob();
    (mockPrisma.userProfile.findMany as jest.Mock).mockResolvedValue([]);

    await cronCallback();

    expect(mockPrisma.notificationPreference.findMany).not.toHaveBeenCalled();
  });

  it('skips users already sent a reminder recently (idempotency)', async () => {
    startDailyReminderJob();

    (mockPrisma.userProfile.findMany as jest.Mock).mockResolvedValue([{ userId: 'u1' }]);
    (mockPrisma.notificationPreference.findMany as jest.Mock).mockResolvedValue([{ userId: 'u1' }]);
    (mockPrisma.notification.findMany as jest.Mock)
      .mockResolvedValueOnce([{ userId: 'u1' }]) // idempotency check — already sent
      .mockResolvedValue([]);
    (mockPrisma.userProgress.findMany as jest.Mock).mockResolvedValue([]);

    const { pushNotificationService } = await import('../../services/PushNotificationService');

    await cronCallback();

    expect(pushNotificationService.send).not.toHaveBeenCalled();
  });

  it('skips users who already completed today\'s lesson', async () => {
    startDailyReminderJob();

    (mockPrisma.userProfile.findMany as jest.Mock).mockResolvedValue([{ userId: 'u1' }]);
    (mockPrisma.notificationPreference.findMany as jest.Mock).mockResolvedValue([{ userId: 'u1' }]);
    (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue([]); // not recently sent
    (mockPrisma.userProgress.findMany as jest.Mock).mockResolvedValue([{ userId: 'u1' }]); // completed today

    const { pushNotificationService } = await import('../../services/PushNotificationService');

    await cronCallback();

    expect(pushNotificationService.send).not.toHaveBeenCalled();
  });

  it('sends notification and records it for eligible users', async () => {
    startDailyReminderJob();

    (mockPrisma.userProfile.findMany as jest.Mock).mockResolvedValue([{ userId: 'u1' }]);
    (mockPrisma.notificationPreference.findMany as jest.Mock).mockResolvedValue([{ userId: 'u1' }]);
    (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue([]); // not recently sent
    (mockPrisma.userProgress.findMany as jest.Mock).mockResolvedValue([]); // not completed today
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    const { pushNotificationService } = await import('../../services/PushNotificationService');

    await cronCallback();

    expect(pushNotificationService.send).toHaveBeenCalledWith('u1', expect.objectContaining({
      title: 'Your daily lesson is ready',
    }));
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: { userId: 'u1', type: 'daily-reminder' },
    });
  });
});
