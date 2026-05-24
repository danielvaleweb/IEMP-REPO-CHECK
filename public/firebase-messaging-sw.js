importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Get configuration from URL query params
const params = new URLSearchParams(location.search);
const config = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId')
};

if (config.projectId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      const notificationTitle = payload.notification?.title || payload.data?.title || 'Nova Mensagem';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'Você recebeu um novo aviso da igreja.',
        icon: '/logo192.png',
        badge: '/logo192.png',
        data: payload.data,
        vibrate: [200, 100, 200]
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

// Dummy fetch listener to satisfy PWA installability requirements
// The user explicitly stated they don't want offline caching, just the installability.
self.addEventListener('fetch', (event) => {
  // Pass through all requests to network
});
