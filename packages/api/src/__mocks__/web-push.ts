export type PushSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

export const setVapidDetails = jest.fn();
export const sendNotification = jest.fn().mockResolvedValue({});

export default { setVapidDetails, sendNotification };
