// Service Worker for Dual Wedding Invitation Reminders and Admin Broadcasts

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Compose the OS notification body — prepend the sender name so guests see
// who broadcasted the announcement ("Keluarga Besar: <title>").
function composeBody(message, sender, audience) {
  const senderLabel = sender ? sender.trim() : 'Keluarga Besar';
  let body = message || '';
  if (audience && audience !== 'all') {
    const audLabel = audience === 'coupleA' ? 'Couple A' : audience === 'coupleB' ? 'Couple B' : 'VIP';
    body = `[untuk ${audLabel}] ${body}`;
  }
  return `${senderLabel}: ${body}`;
}

// Listen for push notifications (simulated or real push server)
self.addEventListener('push', (event) => {
  let data = { title: 'Pemberitahuan Baru', message: 'Ada kabar baru dari pernikahan!', icon: '/images/BALI-ICON.webp', sender: 'Keluarga Besar', audience: 'all' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Pemberitahuan', message: event.data.text() };
    }
  }

  const options = {
    body: composeBody(data.message, data.sender, data.audience),
    icon: data.icon || '/images/BALI-ICON.webp',
    badge: data.icon || '/images/BALI-ICON.webp',
    vibrate: [200, 100, 200],
    data: {
      url: self.registration.scope
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Listen to message events from the main window (for background/local task notifications)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, message, icon, url, sender, audience } = event.data;

    const options = {
      body: composeBody(message, sender, audience),
      icon: icon || '/images/BALI-ICON.webp',
      badge: icon || '/images/BALI-ICON.webp',
      vibrate: [100, 50, 100],
      data: {
        url: url || self.registration.scope
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window client is already open, focus it
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});
