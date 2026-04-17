// Service Worker — handles web push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Learning App', body: event.data.text() };
  }

  const title = payload.title || 'Learning App';
  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Open lesson' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const screen = event.notification.data?.screen || 'dashboard';
  const urlMap = { lessons: '/', progress: '/progress', dashboard: '/' };
  const url = urlMap[screen] || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
