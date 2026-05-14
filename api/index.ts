import express from "express";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { Expo } from "expo-server-sdk";
import { initializeApp, getApps } from "firebase-admin/app";
import admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getMessaging as getAdminMessaging } from "firebase-admin/messaging";
import { initializeApp as initializeClientApp } from "firebase/app";
import { 
  getFirestore as getClientFirestore, 
  collection, 
  getDocs, 
  doc as clientDoc, 
  addDoc as clientAddDoc,
  getDoc as getClientDoc
} from "firebase/firestore";
import fs from "fs";

// Configuração do Express
const app = express();
app.use(express.json());

// Lazy-loaded Firebase instances
let firebaseAdminApp: any = null;
let firebaseClientApp: any = null;
let adminDb: any = null;
let clientDb: any = null;

function getFirebase() {
  if (firebaseAdminApp) return { adminDb, clientDb, firebaseAdminApp };

  let firebaseConfig: any = {};
  try {
    // No Vercel, o process.cwd() é a raiz do projeto
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      console.log("[Firebase] Config file found and loaded.");
    } else {
      console.warn("[Firebase] Config file NOT found at", configPath);
    }
  } catch (e) {
    console.error("[Firebase] Error loading config file:", e);
  }

  // Admin SDK
  try {
    const apps = getApps();
    if (apps.length === 0) {
      if (firebaseConfig.projectId && (process.env.FIREBASE_SERVICE_ACCOUNT || firebaseConfig.client_email)) {
        // Se temos credenciais completas
        const cert = process.env.FIREBASE_SERVICE_ACCOUNT 
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
          : firebaseConfig;
        firebaseAdminApp = initializeApp({
          credential: admin.credential.cert(cert),
          projectId: firebaseConfig.projectId
        });
      } else {
        // Tentativa de inicialização padrão (pode falhar no Vercel sem ADC)
        try {
          firebaseAdminApp = initializeApp({ projectId: firebaseConfig.projectId });
        } catch (e) {
          console.warn("[Firebase Admin] Could not initialize without full credentials");
        }
      }
    } else {
      firebaseAdminApp = apps[0];
    }
    if (firebaseAdminApp) {
      adminDb = getAdminFirestore(firebaseAdminApp, firebaseConfig.firestoreDatabaseId);
    }
  } catch (e) {
    console.error("[Firebase Admin] Initialization failed:", e);
  }

  // Client SDK
  if (firebaseConfig.apiKey) {
    try {
      firebaseClientApp = initializeClientApp(firebaseConfig, "server-client");
      clientDb = getClientFirestore(firebaseClientApp, firebaseConfig.firestoreDatabaseId);
    } catch (e) {
      console.error("[Firebase Client] Initialization failed:", e);
    }
  }

  return { adminDb, clientDb, firebaseAdminApp };
}

// Rota de Teste Simplificada
app.get("/backend/test", (req, res) => {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const exists = fs.existsSync(configPath);
  res.json({
    status: "ok",
    message: "Backend is running on Vercel",
    configExists: exists,
    cwd: process.cwd(),
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

// Rota de Broadcast de Notificações
app.post("/backend/push/broadcast", async (req, res) => {
  console.log("[Push] Broadcast request received");
  const { title, message, image, target = "all", userIds = [] } = req.body;
  const { adminDb, clientDb, firebaseAdminApp } = getFirebase();

  if (!adminDb && !clientDb) {
    return res.status(500).json({ error: "Serviço de banco de dados indisponível. Verifique as configurações do Firebase." });
  }

  try {
    let expoTokens: string[] = [];
    let fcmTokens: string[] = [];

    // Busca tokens
    if (adminDb) {
      const snapshot = await adminDb.collection("members").get();
      snapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        if (data.pushToken) expoTokens.push(data.pushToken);
        if (data.fcmTokens && Array.isArray(data.fcmTokens)) fcmTokens.push(...data.fcmTokens);
      });
    } else if (clientDb) {
      const snapshot = await getDocs(collection(clientDb, "members"));
      snapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        if (data.pushToken) expoTokens.push(data.pushToken);
        if (data.fcmTokens && Array.isArray(data.fcmTokens)) fcmTokens.push(...data.fcmTokens);
      });
    }

    expoTokens = [...new Set(expoTokens)].filter(t => !!t);
    fcmTokens = [...new Set(fcmTokens)].filter(t => !!t);

    console.log(`[Push] Found ${expoTokens.length} Expo tokens and ${fcmTokens.length} FCM tokens`);

    // Envio via Expo
    const expo = new Expo();
    const expoMessages = expoTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body: message,
      data: { image }
    }));
    
    if (expoMessages.length > 0) {
      const chunks = expo.chunkPushNotifications(expoMessages);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
    }

    // Envio via FCM
    if (fcmTokens.length > 0 && firebaseAdminApp) {
      try {
        const messaging = getAdminMessaging(firebaseAdminApp);
        const fcmMessages = fcmTokens.map(token => ({
          token,
          notification: { title, body: message, imageUrl: image },
          data: { title, body: message, image }
        }));
        
        const chunks = [];
        for (let i = 0; i < fcmMessages.length; i += 500) {
          chunks.push(fcmMessages.slice(i, i + 500));
        }
        for (const chunk of chunks) {
          await messaging.sendEach(chunk);
        }
        console.log(`[Push] FCM messages sent to ${fcmTokens.length} tokens`);
      } catch (fcmError: any) {
        console.error("[Push] FCM failed (check service account):", fcmError.message);
        // Não trava o envio total se apenas o FCM falhar por credenciais
        if (fcmError.message.includes("credentials")) {
          console.warn("[Push] FCM skipped due to missing/invalid credentials");
        } else {
          throw fcmError;
        }
      }
    }

    res.json({ success: true, sent: expoTokens.length + fcmTokens.length });
  } catch (error: any) {
    console.error("[Push Error]", error);
    res.status(500).json({ error: error.message });
  }
});

// Exporta para a Vercel
export default app;
