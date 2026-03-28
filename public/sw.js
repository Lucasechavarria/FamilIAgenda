/**
 * FamilIAgenda Service Worker
 * Maneja notificaciones push en segundo plano y clics del usuario.
 */

// 1. Escuchar el evento PUSH (cuando llega una notificación del servidor)
self.addEventListener('push', function(event) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notificación', body: event.data.text() };
    }
  }

  const title = data.title || 'FamilIAgenda Update';
  const options = {
    body: data.body || 'Tienes una nueva actualización en tu agenda familiar.',
    icon: '/pwa-192x192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Ver ahora', icon: '/favicon.ico' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 2. Escuchar el clic sobre la notificación
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Enfocar la ventana si ya está abierta o abrir una nueva
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});

// 3. Manejo de Service Worker activo
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
