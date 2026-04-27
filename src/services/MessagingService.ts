import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

const VAPID_KEY = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async () => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }
    
    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      await saveMessagingToken();
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
};

export const saveMessagingToken = async () => {
  try {
    const messaging = getMessaging();
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "members", user.uid);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(currentToken),
          lastTokenUpdate: new Date().toISOString()
        });
        
        // Also register with the server for backward compatibility or direct push
        await fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, token: currentToken, type: 'fcm' })
        });
      }
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
      console.log("Message received in foreground: ", payload);
      // Opcional: mostrar um alerta customizado ou toast aqui
      if (payload.notification) {
        alert(`${payload.notification.title}\n\n${payload.notification.body}`);
      }
      resolve(payload);
    });
  });
