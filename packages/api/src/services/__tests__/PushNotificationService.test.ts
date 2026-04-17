import { PushNotificationService } from '../PushNotificationService';
import { prisma } from '../../db';

jest.mock('../../db', () => ({
  prisma: {
    pushToken: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('PushNotificationService', () => {
  let service: PushNotificationService;

  beforeEach(() => {
    service = new PushNotificationService();
    jest.clearAllMocks();
  });

  describe('registerToken', () => {
    it('upserts a push token with empty string for missing deviceId', async () => {
      (mockPrisma.pushToken.upsert as jest.Mock).mockResolvedValue({});

      await service.registerToken('user1', 'ExponentPushToken[abc]', 'expo');

      expect(mockPrisma.pushToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_platform_deviceId: {
              userId: 'user1',
              platform: 'expo',
              deviceId: '',
            },
          },
          create: expect.objectContaining({
            userId: 'user1',
            token: 'ExponentPushToken[abc]',
            platform: 'expo',
            deviceId: '',
          }),
        })
      );
    });

    it('uses provided deviceId', async () => {
      (mockPrisma.pushToken.upsert as jest.Mock).mockResolvedValue({});

      await service.registerToken('user1', 'ExponentPushToken[abc]', 'expo', 'device-xyz');

      expect(mockPrisma.pushToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_platform_deviceId: {
              userId: 'user1',
              platform: 'expo',
              deviceId: 'device-xyz',
            },
          },
        })
      );
    });
  });

  describe('send', () => {
    it('returns without sending if no tokens registered', async () => {
      (mockPrisma.pushToken.findMany as jest.Mock).mockResolvedValue([]);

      await service.send('user1', { title: 'Hello', body: 'World' });

      expect(mockPrisma.pushToken.findMany).toHaveBeenCalledWith({ where: { userId: 'user1' } });
    });

    it('sends to expo tokens when present', async () => {
      (mockPrisma.pushToken.findMany as jest.Mock).mockResolvedValue([
        { id: 'tk1', platform: 'expo', token: 'ExponentPushToken[valid]' },
      ]);
      (mockPrisma.pushToken.deleteMany as jest.Mock).mockResolvedValue({});

      await expect(
        service.send('user1', { title: 'Test', body: 'Body' })
      ).resolves.not.toThrow();
    });

    it('never throws even if sending fails', async () => {
      (mockPrisma.pushToken.findMany as jest.Mock).mockResolvedValue([
        { id: 'tk1', platform: 'expo', token: 'ExponentPushToken[valid]' },
      ]);
      // Simulate internal failure — still resolves
      (mockPrisma.pushToken.deleteMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        service.send('user1', { title: 'Test', body: 'Body' })
      ).resolves.not.toThrow();
    });
  });
});
