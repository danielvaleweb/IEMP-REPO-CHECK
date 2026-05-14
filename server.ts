import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { Expo } from "expo-server-sdk";
import cron from "node-cron";
import { initializeApp, getApps } from "firebase-admin/app";
import admin from "firebase-admin";
const { credential } = admin;
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getMessaging as getAdminMessaging } from "firebase-admin/messaging";
import { initializeApp as initializeClientApp } from "firebase/app";
import { 
  getFirestore as getClientFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc as clientDoc, 
  updateDoc,
  getDoc as getClientDoc,
  limit as clientLimit,
  addDoc as clientAddDoc,
  arrayUnion as clientArrayUnion
} from "firebase/firestore";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Config
const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

// Initialize Firebase Admin
let adminApp: any;
try {
  const apps = getApps();
  if (apps.length === 0) {
    // Try auto-initialization first - often works best in Cloud Run
    try {
      adminApp = initializeApp();
      console.log("[Firebase Admin] Auto-initialized successfully");
    } catch (e) {
      console.log("[Firebase Admin] Auto-init failed, trying with explicit projectId:", firebaseConfig.projectId);
      adminApp = initializeApp({
        projectId: firebaseConfig.projectId
      });
    }
  } else {
    adminApp = apps[0];
  }
} catch (e) {
  console.error("[Firebase Admin] Initial initialization failed, trying fallback with only projectId:", (e as Error).message);
  try {
    adminApp = initializeApp({
      projectId: firebaseConfig.projectId
    });
  } catch (inner) {
    console.error("[Firebase Admin] Critical failure:", (inner as Error).message);
  }
}

// Initialize Firestore Admin
const adminDb = adminApp ? getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId) : null;

// Initialize Firebase Client (Server-side)
const clientApp = initializeClientApp(firebaseConfig, "server-client");
const clientDb = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

// Primary database access point
// Prefere adminDb, mas use clientDb se adminDb falhar nos testes de conexão
let db = adminDb; 

// Initial connection check
if (adminDb) {
  adminDb.collection("members").limit(1).get()
    .then(() => console.log("[Firebase] Admin SDK connection test OK"))
    .catch((err: any) => {
      console.warn("[Firebase] Admin SDK permission issues detected. Falling back to Client SDK where possible.");
      console.warn("Reason:", err.message);
      // We don't set db = null here because some things (like FCM) still need adminApp
    });
}

const expo = new Expo();

export const app = express();
app.use(express.json());
const PORT = 3000;

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
  });

  app.get("/services/_routes", (req, res) => {
    const routes = app._router.stack
      .filter((r: any) => r.route)
      .map((r: any) => ({
        path: r.route.path,
        methods: Object.keys(r.route.methods)
      }));
    res.json(routes);
  });

  app.get("/backend/test", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV, time: new Date().toISOString() });
  });

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });

  // Logging middleware for backend
  app.use("/backend", (req, res, next) => {
    console.log(`[Backend Request] ${req.method} ${req.url}`);
    next();
  });

  // 1. Endpoint para receber o Expo Push Token
  app.post("/backend/push/register", async (req, res) => {
    try {
      const { userId, token, type = 'expo' } = req.body;
      if (!userId || !token) {
        return res.status(400).json({ error: "userId and token are required" });
      }

      if (adminDb) {
        if (type === 'fcm') {
          await adminDb.collection("members").doc(userId).update({
            fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
            lastTokenUpdate: new Date().toISOString()
          });
        } else {
          if (!Expo.isExpoPushToken(token)) {
            return res.status(400).json({ error: "Invalid Expo push token" });
          }
          await adminDb.collection("members").doc(userId).update({ pushToken: token });
        }
      } else {
        if (type === 'fcm') {
          await updateDoc(clientDoc(clientDb, "members", userId), {
            fcmTokens: clientArrayUnion(token),
            lastTokenUpdate: new Date().toISOString()
          });
        } else {
          if (!Expo.isExpoPushToken(token)) {
            return res.status(400).json({ error: "Invalid Expo push token" });
          }
          await updateDoc(clientDoc(clientDb, "members", userId), { pushToken: token });
        }
      }

      console.log(`Token ${type} registrado para o usuário ${userId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao registrar token:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // 2. Endpoint para disparo imediato (API Interna/Admin)
  app.post("/backend/push/broadcast", async (req, res) => {
    console.log("[Backend] /push/broadcast called", req.body);
    try {
      const { title, message, image, target = "all", userIds = [] } = req.body;
      
      let expoTokens: string[] = [];
      let fcmTokens: string[] = [];
      
      // Use Admin SDK for fetching to bypass rules if available
      if (adminDb) {
        if (target === "all") {
          const snapshot = await adminDb.collection("members").get();
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.pushToken) expoTokens.push(data.pushToken);
            if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
              fcmTokens.push(...data.fcmTokens);
            }
          });
        } else if (userIds.length > 0) {
          const tokensPromises = userIds.map(async (uid: string) => {
            const docSnap = await adminDb.collection("members").doc(uid).get();
            const data = docSnap.data();
            return data ? { expo: data.pushToken, fcm: data.fcmTokens } : null;
          });
          const results = await Promise.all(tokensPromises);
          results.forEach(res => {
            if (res?.expo) expoTokens.push(res.expo);
            if (res?.fcm && Array.isArray(res.fcm)) fcmTokens.push(...res.fcm);
          });
        }
      } else {
        if (target === "all") {
          const snapshot = await getDocs(collection(clientDb, "members"));
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.pushToken) expoTokens.push(data.pushToken);
            if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
              fcmTokens.push(...data.fcmTokens);
            }
          });
        } else if (userIds.length > 0) {
          const tokensPromises = userIds.map(async (uid: string) => {
            const data = (await getClientDoc(clientDoc(clientDb, "members", uid))).data();
            return data ? { expo: data.pushToken, fcm: data.fcmTokens } : null;
          });
          const results = await Promise.all(tokensPromises);
          results.forEach(res => {
            if (res?.expo) expoTokens.push(res.expo);
            if (res?.fcm && Array.isArray(res.fcm)) fcmTokens.push(...res.fcm);
          });
        }
      }

      expoTokens = [...new Set(expoTokens)].filter(t => !!t);
      fcmTokens = [...new Set(fcmTokens)].filter(t => !!t);

      if (expoTokens.length === 0 && fcmTokens.length === 0) {
        return res.json({ success: true, sent: 0, message: "Nenhum token encontrado" });
      }

      const expoTickets = await sendPushNotifications(expoTokens, title, message, { image });
      let fcmResult: any = null;
      
      try {
        if (fcmTokens.length > 0) {
          fcmResult = await sendFCMPush(fcmTokens, title, message, { image });
        }
      } catch (fcmErr) {
        console.error("Erro específico no envio FCM:", fcmErr);
        fcmResult = { error: (fcmErr as Error).message };
      }
      
      // Salva no histórico via Admin SDK (bypasses rules)
      try {
        if (adminDb) {
          await adminDb.collection("announcements").add({
            title,
            message,
            target,
            status: "sent",
            sentAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            stats: {
              expoCount: expoTokens.length,
              fcmCount: fcmTokens.length
            }
          });
        } else {
          await clientAddDoc(collection(clientDb, "announcements"), {
            title,
            message,
            target,
            status: "sent",
            sentAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            stats: {
              expoCount: expoTokens.length,
              fcmCount: fcmTokens.length
            }
          });
        }
      } catch (historyErr) {
        console.error("Erro ao salvar histórico de anúncio:", historyErr);
      }

      res.json({ success: true, sent: expoTokens.length + fcmTokens.length, expoTickets, fcmResult });
    } catch (error) {
      console.error("Erro ao enviar push:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/backend/push/broadcast", (req, res) => {
    res.send("API Push Broadcast endpoint is active. Use POST to send notifications.");
  });

  // Função auxiliar para enviar via Expo
  async function sendPushNotifications(tokens: string[], title: string, body: string, data = {}) {
    const messages: any[] = [];
    for (const pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken)) continue;
      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Erro no chunk do Expo:", error);
      }
    }
    return tickets;
  }

  // Função para enviar via FCM
  async function sendFCMPush(tokens: string[], title: string, body: string, data = {}) {
    if (!adminApp) return { error: "Admin SDK not initialized" };
    
    const messaging = getAdminMessaging(adminApp);
    const messages = tokens.map(token => ({
      token,
      notification: { 
        title, 
        body,
        imageUrl: (data as any).image 
      },
      data: { ...data, title, body } // Some webviews prefer data payload
    }));

    const results = [];
    // FCM permits sending up to 500 messages at once with sendEach
    const chunks = [];
    for (let i = 0; i < messages.length; i += 500) {
      chunks.push(messages.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      try {
        const response = await messaging.sendEach(chunk);
        results.push(response);
      } catch (error) {
        console.error("Erro ao enviar chunk FCM:", error);
      }
    }
    return results;
  }

  // 3. Cron Job removed as requested.

  // Legacy live-status removed as requested.

  // YouTube API Integration
  const YT_API_KEY = "AIzaSyA_nzF9lNrNZnE67_lum2D9HsO5OBrwx8o";
  const YT_REFERER = "https://ministerioprofecia.com.br/";

  // Cache em memória no servidor para economizar cota global (reseta se o servidor reiniciar)
  const ytCache = new Map<string, { data: any, timestamp: number }>();
  const CACHE_DURATION = 7200000; // 2 horas de cache no servidor

  app.get("/api/youtube", async (req, res) => {
    try {
      const channelId = (req.query.channelId as string) || "UCILgaItnqDH3plhRXD54QUg";
      
      const cached = ytCache.get(channelId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.json(cached.data);
      }

      // Convertemos Canal (UC...) para Playlist de Uploads (UU...) para economizar 100x em cota
      let playlistId = channelId;
      if (channelId.startsWith('UC')) {
        playlistId = 'UU' + channelId.substring(2);
      }

      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=20&key=${YT_API_KEY}`;
      
      let response = await fetch(url, { headers: { 'Referer': YT_REFERER } });
      let text = await response.text();
      let data: any;
      
      try {
        data = JSON.parse(text);
      } catch (e) {
        return res.status(502).json({ error: { message: "Resposta inválida do YouTube" } });
      }

      // Se der erro (ex: cota), retornamos o erro para o frontend lidar/usar cache local
      if (data.error) {
        console.error("[YouTube API Error]", data.error);
        return res.status(data.error.code || 500).json(data);
      }

      // Normalizar resposta para garantir compatibilidade com o frontend
      if (data.items) {
        data.items = data.items.map((item: any) => ({
          ...item,
          // Garante que o frontend encontre o ID do vídeo
          id: { videoId: item.contentDetails?.videoId || item.id?.videoId || item.id }
        }));
      }

      ytCache.set(channelId, { data, timestamp: Date.now() });
      res.status(200).json(data);
    } catch (error) {
      console.error("Erro em /api/youtube:", error);
      res.status(500).json({ error: { message: "Erro interno no servidor de vídeos" } });
    }
  });

  // YouTube Transcript Endpoint
  app.get("/api/youtube-transcript", async (req, res) => {
    try {
      const videoId = req.query.videoId as string;
      if (!videoId) return res.status(400).json({ error: "Video ID is required" });

      console.log(`[YouTube Transcript] Fetching for video: ${videoId}`);
      
      const { YoutubeTranscript } = await import('youtube-transcript');
      
      let transcriptRequest;
      try {
        // Try fetching in Portuguese first
        transcriptRequest = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' });
      } catch (ptError) {
        console.warn(`[YouTube Transcript] PT fetch failed for ${videoId}, trying default.`, ptError);
        // Fallback to default language
        transcriptRequest = await YoutubeTranscript.fetchTranscript(videoId);
      }
      
      if (!transcriptRequest || transcriptRequest.length === 0) {
        throw new Error("Nenhuma transcrição encontrada para este vídeo.");
      }

      const fullText = transcriptRequest.map(item => item.text).join(' ');
      res.json({ transcript: fullText });
    } catch (error: any) {
      const errorStr = String(error);
      console.error("[YouTube Transcript Error]:", errorStr);
      
      let errorMessage = "Falha ao obter a transcrição do vídeo.";
      if (errorStr.includes('Transcript is disabled')) {
        errorMessage = "A transcrição está desativada para este vídeo.";
      } else if (errorStr.includes('No transcripts found')) {
        errorMessage = "Nenhuma transcrição encontrada para este vídeo.";
      } else if (errorStr.includes('Could not find transcript')) {
        errorMessage = "Não foi possível encontrar a transcrição deste vídeo.";
      } else if (errorStr.includes('Too Many Requests')) {
        errorMessage = "Muitas requisições ao YouTube. Tente novamente mais tarde.";
      }

      res.status(500).json({ 
        error: errorMessage, 
        details: error instanceof Error ? error.message : errorStr 
      });
    }
  });

  // Proxy para Google Drive - Evita NetworkError/CORS no frontend
  app.get("/api/drive-proxy", async (req, res) => {
    try {
      const folderId = req.query.id as string;
      if (!folderId) return res.status(400).json({ error: "ID da pasta não fornecido" });
      
      console.log(`[Drive Proxy] Sincronizando pasta: ${folderId}`);
      
      const url = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) throw new Error(`Google Drive retornou status ${response.status}`);
      
      const content = await response.text();
      res.header("Content-Type", "text/html");
      res.send(content);
    } catch (error) {
      console.error("[Drive Proxy Error]:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/admin/update-firebase-config", async (req, res) => {
    try {
      const newConfig = req.body;
      if (!newConfig.projectId || !newConfig.appId || !newConfig.apiKey) {
        return res.status(400).json({ error: "Missing required config fields" });
      }

      // Read current config
      const currentConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
      const currentConfig = JSON.parse(fs.readFileSync(currentConfigPath, "utf-8"));
      
      // Merge with new params
      const updatedConfig = {
        ...currentConfig,
        projectId: newConfig.projectId,
        appId: newConfig.appId,
        apiKey: newConfig.apiKey,
        authDomain: newConfig.authDomain,
        storageBucket: newConfig.storageBucket,
      };

      fs.writeFileSync(currentConfigPath, JSON.stringify(updatedConfig, null, 2), "utf-8");
      console.log("[Admin] Firebase Config has been updated via Migration UI.");
      
      res.json({ success: true, message: "Firebase config updated successfully" });
    } catch (error) {
      console.error("Erro ao atualizar firebase-applet-config.json:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    
    // Serve static files
    app.use(express.static(distPath));
    
    // SPA Fallback
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      console.log(`[Server] Searching for index.html at: ${indexPath}`);
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send(`Build artifacts not found in ${distPath}. Please run npm run build.`);
      }
    });
  }

  if (process.env.NODE_ENV !== "production" || process.env.RUN_STANDALONE) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;
