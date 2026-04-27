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
      
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png', // Fallback icon
        data: payload.data
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  });
