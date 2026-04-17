const mockExpo = {
  chunkPushNotifications: jest.fn((messages: unknown[]) => [messages]),
  sendPushNotificationsAsync: jest.fn().mockResolvedValue([{ status: 'ok' }]),
};

const Expo = jest.fn().mockImplementation(() => mockExpo);
(Expo as unknown as { isExpoPushToken: (token: string) => boolean }).isExpoPushToken = jest.fn(
  (token: string) => token.startsWith('ExponentPushToken')
);

export default Expo;
export type ExpoPushMessage = { to: string; title?: string; body?: string; data?: unknown; sound?: string };
export type ExpoPushTicket = { status: 'ok' | 'error'; details?: { error?: string } };
