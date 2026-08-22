self.addEventListener('install', (event) => {
  console.log('UBC Service Worker installed');
});

// public/sw.js

self.addEventListener('push', function(event) {
    if (!event.data) return;

    // Appwrite sends data as a JSON string
    const data = event.data.json();

    const options = {
        body: data.body || 'New update from UBC Youth Camp!',
        icon: 'logo.png', // Ensure this path is correct
        badge: 'logo.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/' // Redirect to dashboard on click
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'UBC CAMP ALERT', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});