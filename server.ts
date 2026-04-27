import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

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

async function startServer() {
  const app = express();
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

  app.get("/services/test", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV, time: new Date().toISOString() });
  });

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });

  // Logging middleware for services
  app.use("/services", (req, res, next) => {
    console.log(`[Service Request] ${req.method} ${req.url}`);
    next();
  });

  // 1. Endpoint para receber o Expo Push Token
  app.post("/services/push/register", async (req, res) => {
    try {
      const { userId, token, type = 'expo' } = req.body;
      if (!userId || !token) {
        return res.status(400).json({ error: "userId and token are required" });
      }

      // Proactively use Client SDK for Firestore writes if we know Admin has issues
      // This is safer because the Client SDK uses the Web API (apiKey)
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

      console.log(`Token ${type} registrado para o usuário ${userId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao registrar token:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // 2. Endpoint para disparo imediato (API Interna/Admin)
  app.post("/services/push/broadcast", async (req, res) => {
    console.log("[API] /services/push/broadcast called", req.body);
    try {
      const { title, message, target = "all", userIds = [] } = req.body;
      
      let expoTokens: string[] = [];
      let fcmTokens: string[] = [];
      
      // Use Client SDK for fetching
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

      expoTokens = [...new Set(expoTokens)].filter(t => !!t);
      fcmTokens = [...new Set(fcmTokens)].filter(t => !!t);

      if (expoTokens.length === 0 && fcmTokens.length === 0) {
        return res.json({ success: true, sent: 0, message: "Nenhum token encontrado" });
      }

      const expoTickets = await sendPushNotifications(expoTokens, title, message);
      let fcmResult: any = null;
      
      try {
        if (fcmTokens.length > 0) {
          fcmResult = await sendFCMPush(fcmTokens, title, message);
        }
      } catch (fcmErr) {
        console.error("Erro específico no envio FCM:", fcmErr);
        fcmResult = { error: (fcmErr as Error).message };
      }
      
      // Salva no histórico via Client SDK
      try {
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
      } catch (historyErr) {
        console.error("Erro ao salvar histórico de anúncio:", historyErr);
      }

      res.json({ success: true, sent: expoTokens.length + fcmTokens.length, expoTickets, fcmResult });
    } catch (error) {
      console.error("Erro ao enviar push:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/services/push/broadcast", (req, res) => {
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
      notification: { title, body },
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

  // 3. Cron Job para Notificações Agendadas (roda a cada minuto)
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date().toISOString();
      console.log(`[Cron] Checking for scheduled notifications at ${now}...`);
      
      const q = query(
        collection(clientDb, "announcements"),
        where("status", "==", "pending"),
        where("scheduledAt", "<=", now)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log("[Cron] No pending notifications to send.");
        return;
      }

      console.log(`[Cron] Processing ${snapshot.docs.length} scheduled notifications...`);

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        let expoTokens: string[] = [];
        let fcmTokens: string[] = [];

        try {
          if (data.target === "all") {
            const membersSnap = await getDocs(collection(clientDb, "members"));
            membersSnap.docs.forEach(m => {
              const mData = m.data();
              if (mData.pushToken) expoTokens.push(mData.pushToken);
              if (mData.fcmTokens && Array.isArray(mData.fcmTokens)) fcmTokens.push(...mData.fcmTokens);
            });
          } else if (data.userIds?.length > 0) {
            const tokensPromises = data.userIds.map(async (uid: string) => {
              const mData = (await getClientDoc(clientDoc(clientDb, "members", uid))).data();
              return mData ? { expo: mData.pushToken, fcm: mData.fcmTokens } : null;
            });
            const results = await Promise.all(tokensPromises);
            results.forEach(res => {
              if (res?.expo) expoTokens.push(res.expo);
              if (res?.fcm && Array.isArray(res.fcm)) fcmTokens.push(...res.fcm);
            });
          }

          expoTokens = [...new Set(expoTokens)].filter(t => !!t);
          fcmTokens = [...new Set(fcmTokens)].filter(t => !!t);

          if (expoTokens.length > 0) {
            await sendPushNotifications(expoTokens, data.title, data.message);
          }
          if (fcmTokens.length > 0) {
            await sendFCMPush(fcmTokens, data.title, data.message);
          }

          await updateDoc(clientDoc(clientDb, "announcements", docSnap.id), {
            status: "sent",
            sentAt: new Date().toISOString()
          });
          
          console.log(`[Cron] Successfully sent announcement ${docSnap.id}`);
        } catch (innerError) {
          console.error(`[Cron] Failed to process announcement ${docSnap.id}:`, (innerError as Error).message);
        }
      }
    } catch (error) {
      console.error("[Cron] Critical error in notification job:");
      console.error(`Message: ${(error as Error).message}`);
    }
  });

  app.get("/services/live-status", async (req, res) => {
    try {
      let channelId = (req.query.channelId as string) || "UCILgaItnqDH3plhRXD54QUg";
      channelId = channelId.trim();
      if (channelId.includes('youtube.com/channel/')) {
        channelId = channelId.split('youtube.com/channel/')[1].split('/')[0].split('?')[0];
      } else if (channelId.includes('youtube.com/@')) {
         channelId = '@' + channelId.split('youtube.com/@')[1].split('/')[0].split('?')[0];
      }
      let handle = (req.query.handle as string) || "@ministerio_profecia";
      handle = handle.trim();
      if (handle.includes('youtube.com/')) {
         handle = handle.split('youtube.com/')[1].split('/')[0].split('?')[0];
         if(!handle.startsWith('@')) handle = '@' + handle;
      }
      
      // Try both handle and channel ID for live status
      const urls = [
        `https://www.youtube.com/${handle}/live`,
        `https://www.youtube.com/channel/${channelId}/live`
      ];
      
      let isLive = false;
      
      for (const youtubeUrl of urls) {
        try {
          const response = await fetch(youtubeUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html',
              'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            signal: AbortSignal.timeout(4000)
          });
          
          if (!response.ok) continue;

          const html = await response.text();
          
          if (html.includes('{"text":" ao vivo"}') || 
              html.includes('{"text":" ao vivo "}') || 
              html.includes('{"text":" watching"}') || 
              html.includes('isLive":true') ||
              html.includes('"isLive":true') ||
              html.includes('style":"LIVE"') ||
              html.includes('LIVE') && html.includes('watching') ||
              html.includes('canonical" href="https://www.youtube.com/watch?v=')) {
            isLive = true;
            break;
          }
        } catch (e) {
          console.warn(`Failed checking live status for ${youtubeUrl}:`, e);
        }
      }

      res.json({ isLive });
    } catch (error) {
      console.error("Server error checking live status:", error);
      res.status(500).json({ isLive: false });
    }
  });

  // API Route to get recent videos
  app.get("/services/recent-videos", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
      let queryChannelId = (req.query.channelId as string) || "UCILgaItnqDH3plhRXD54QUg";
      let channelId = queryChannelId.trim();
      
      // Resolve Handle to Channel ID if needed
      if (channelId.startsWith('@')) {
        try {
          const handleUrl = `https://www.youtube.com/${channelId}`;
          const hResponse = await fetch(handleUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          if (hResponse.ok) {
            const hHtml = await hResponse.text();
            const cidMatch = hHtml.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
            if (cidMatch) {
              channelId = cidMatch[1];
            }
          }
        } catch (e) { console.warn("Failed to resolve handle to channelId:", e); }
      }

      const videos: any[] = [];
      const seenIds = new Set();

      // 1. Try Scraping first (Full tab data is often better than RSS for categorization)
      try {
        let videosUrl = channelId.startsWith('@') ? `https://www.youtube.com/${channelId}/videos` : `https://www.youtube.com/channel/${channelId}/videos`;
        const response = await fetch(videosUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'Cookie': 'CONSENT=YES+cb.20230531-17-p0.en'
          }
        });
        if (response.ok) {
          const html = await response.text();
          const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
          if (match) {
            try {
              const data = JSON.parse(match[1]);
              const findDeepVideos = (obj: any) => {
                if (!obj || typeof obj !== 'object') return;
                if (obj.videoRenderer || obj.gridVideoRenderer) {
                  const v = obj.videoRenderer || obj.gridVideoRenderer;
                  const id = v.videoId;
                  if (id && !seenIds.has(id)) {
                    seenIds.add(id);
                    videos.push({
                      id,
                      title: v.title?.runs?.[0]?.text || v.title?.simpleText,
                      thumbnail: v.thumbnail?.thumbnails?.sort((a: any, b: any) => b.width - a.width)[0]?.url || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
                      date: v.publishedTimeText?.simpleText || "Recente"
                    });
                  }
                } else {
                  Object.values(obj).forEach(findDeepVideos);
                }
              };
              findDeepVideos(data);
            } catch (jsonErr) {
              console.warn("JSON.parse of ytInitialData failed for videos");
            }
          }
        }
      } catch (e) { console.warn("Videos Scraping failed:", e); }

      // 2. RSS Fallback/Enrichment
      if (videos.length < 5) {
        try {
          if (!channelId.startsWith('@')) {
            const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
            const rssResponse = await fetch(rssUrl);
            if (rssResponse.ok) {
              const xmlData = await rssResponse.text();
              const jsonObj = parser.parse(xmlData);
              const entries = jsonObj.feed?.entry || [];
              const entriesArray = Array.isArray(entries) ? entries : [entries];
              
              for (const entry of entriesArray) {
                const id = entry["yt:videoId"];
                if (id && !seenIds.has(id)) {
                  const title = entry.title || "";
                  const lowTitle = title.toLowerCase();
                  // Avoid clearly live content in the videos section if we have other things
                  const isLive = lowTitle.includes('culto') || lowTitle.includes('ao vivo') || lowTitle.includes('live') || lowTitle.includes('transmissão');
                  if (!isLive || videos.length < 5) {
                    seenIds.add(id);
                    videos.push({
                      id,
                      title,
                      thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
                      date: new Date(entry.published).toLocaleDateString('pt-BR')
                    });
                  }
                }
              }
            }
          }
        } catch (e) { console.warn("RSS failed:", e); }
      }

      res.json(videos.slice(0, 15));
    } catch (error) {
      console.error("Critical error in /services/recent-videos:", error);
      res.status(500).json({ error: "Failed to fetch" });
    }
  });

  // API Route to get recent lives/streams
  app.get("/services/recent-lives", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
      let queryChannelId = (req.query.channelId as string) || "UCILgaItnqDH3plhRXD54QUg";
      let channelId = queryChannelId.trim();

      // Resolve Handle to Channel ID if needed
      if (channelId.startsWith('@')) {
        try {
          const handleUrl = `https://www.youtube.com/${channelId}`;
          const hResponse = await fetch(handleUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          if (hResponse.ok) {
            const hHtml = await hResponse.text();
            const cidMatch = hHtml.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
            if (cidMatch) {
              channelId = cidMatch[1];
            }
          }
        } catch (e) { 
          console.warn("Failed to resolve handle to channelId:", e); 
        }
      }
      
      const lives: any[] = [];
      const seenIds = new Set();

      // 1. Try Scraping the specific Streams tab first
      try {
        let streamsUrl = channelId.startsWith('@') ? `https://www.youtube.com/${channelId}/streams` : `https://www.youtube.com/channel/${channelId}/streams`;
        const response = await fetch(streamsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'Cookie': 'CONSENT=YES+cb.20230531-17-p0.en'
          }
        });
        if (response.ok) {
          const html = await response.text();
          const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
          if (match) {
            try {
              const data = JSON.parse(match[1]);
              const findDeepStreams = (obj: any) => {
                if (!obj || typeof obj !== 'object') return;
                if (obj.videoRenderer || obj.gridVideoRenderer) {
                  const v = obj.videoRenderer || obj.gridVideoRenderer;
                  const id = v.videoId;
                  if (id && !seenIds.has(id)) {
                    seenIds.add(id);
                    lives.push({
                      id,
                      title: v.title?.runs?.[0]?.text || v.title?.simpleText,
                      thumbnail: v.thumbnail?.thumbnails?.sort((a: any, b: any) => b.width - a.width)[0]?.url || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
                      date: v.publishedTimeText?.simpleText || "Ao Vivo"
                    });
                  }
                } else {
                  Object.values(obj).forEach(findDeepStreams);
                }
              };
              findDeepStreams(data);
            } catch (jsonErr) {
              console.warn("JSON.parse of ytInitialData failed for streams");
            }
          }
        }
      } catch (e) { 
        console.warn("Streams scraping failed:", e); 
      }

      // 2. RSS Fallback with keyword filtering (only if we failed to get enough lives via scraping)
      if (lives.length < 5) {
        try {
          // If channelId is still a handle here, it means resolution failed. 
          // RSS requires a real channel ID.
          if (!channelId.startsWith('@')) {
            const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
            const rssResponse = await fetch(rssUrl);
            if (rssResponse.ok) {
              const xmlData = await rssResponse.text();
              const jsonObj = parser.parse(xmlData);
              const entries = jsonObj.feed?.entry || [];
              const entriesArray = Array.isArray(entries) ? entries : [entries];
              
              for (const entry of entriesArray) {
                const id = entry["yt:videoId"];
                const title = entry.title || "";
                const lowTitle = title.toLowerCase();
                const isLive = lowTitle.includes('culto') || lowTitle.includes('ao vivo') || lowTitle.includes('live') || lowTitle.includes('transmissão') || lowTitle.includes('vigília');
                
                if (id && !seenIds.has(id) && isLive) {
                  seenIds.add(id);
                  lives.push({
                    id,
                    title,
                    thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
                    date: new Date(entry.published).toLocaleDateString('pt-BR')
                  });
                }
              }
            }
          }
        } catch (e) { 
          console.warn("RSS Live fallback failed:", e); 
        }
      }

      res.json(lives.slice(0, 15));
    } catch (error) {
      console.error("Critical error in /services/recent-lives:", error);
      res.status(500).json({ error: "Failed to fetch lives", details: error instanceof Error ? error.message : String(error) });
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
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files
    app.use(express.static(distPath));
    
    // SPA Fallback
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Build artifacts not found. Please run npm run build.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
