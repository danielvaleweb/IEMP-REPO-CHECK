importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// This will be replaced by the build process or we can fetch it
fetch('/firebase-applet-config.json')
  .then(response => response.json())
  .then(config => {
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
  });
