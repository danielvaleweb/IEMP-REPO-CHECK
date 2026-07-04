import express from "express";
// import { createServer as createViteServer } from "vite"; // Removido do topo para evitar erro no Vercel
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
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Environment Variables
dotenv.config({ path: path.resolve(__dirname, '.env') });
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: path.resolve(__dirname, '.env.development'), override: true });
}

// Initialize Firebase Config from ENV variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || undefined
};

if (!firebaseConfig.projectId) {
  console.warn("[Firebase] Missing VITE_FIREBASE_PROJECT_ID in environment variables.");
}

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
  console.error("[Firebase Admin] Initial initialization failed:", (e as Error).message);
  if (firebaseConfig.projectId) {
    try {
      adminApp = initializeApp({
        projectId: firebaseConfig.projectId
      });
    } catch (inner) {
      console.error("[Firebase Admin] Critical failure:", (inner as Error).message);
    }
  }
}

// Initialize Firestore Admin
const adminDb = adminApp ? getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId) : null;

// Initialize Firebase Client (Server-side)
let clientApp: any;
let clientDb: any;

if (firebaseConfig.apiKey) {
  try {
    clientApp = initializeClientApp(firebaseConfig as any, "server-client");
    clientDb = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);
    console.log("[Firebase] Client SDK initialized successfully");
  } catch (e) {
    console.error("[Firebase] Client SDK initialization failed:", (e as Error).message);
  }
} else {
  console.warn("[Firebase] Skipping Client SDK initialization due to missing config");
}

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
    const configExists = !!process.env.VITE_FIREBASE_PROJECT_ID || !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV, 
      configExists,
      cwd: process.cwd(),
      time: new Date().toISOString() 
    });
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
      } else if (clientDb) {
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

      if (!adminDb && !clientDb) {
        throw new Error("Banco de dados não disponível. Verifique as credenciais do Firebase no servidor.");
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
  const YT_API_KEY = process.env.YOUTUBE_API_KEY || "";
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

  // Proxy de imagem do Google Drive - Serve thumbnail ou full size
  app.get("/api/drive-image", async (req, res) => {
    try {
      const fileId = req.query.id as string;
      const isThumb = req.query.thumb === "1";
      if (!fileId) return res.status(400).json({ error: "ID do arquivo não fornecido" });

      // Thumbnails: much smaller, faster to load (sz=w500)
      const url = isThumb
        ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`
        : `https://drive.google.com/uc?export=view&id=${fileId}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://drive.google.com/'
        },
        redirect: 'follow'
      });

      if (!response.ok) throw new Error(`Google Drive retornou status ${response.status}`);

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', `public, max-age=${isThumb ? 604800 : 86400}`);
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("[Drive Image Proxy Error]:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

// Helper para formatar URL de imagem para o Open Graph (WhatsApp/Redes Sociais)
function formatOgImage(url: string | undefined | null): string {
  if (!url) return "https://i.imgur.com/hAcnt1E.png";

  if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
    let fileId = "";
    const matchId = url.match(/[?&]id=([^&]+)/);
    if (matchId && matchId[1]) {
      fileId = matchId[1];
    } else {
      const matchD = url.match(/\/d\/([^/]+)/);
      if (matchD && matchD[1]) {
        fileId = matchD[1];
      }
    }
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
    }
  }

  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    if (!url.includes("q_auto") && !url.includes("f_auto")) {
      return url.replace("/upload/", "/upload/q_auto/f_auto/");
    }
  }

  return url;
}

// Helper para ler o template HTML (do build dist ou raiz)
function getHtmlTemplate(): string | null {
  const possiblePaths = [
    path.join(process.cwd(), "dist", "index.html"),
    path.join(process.cwd(), "index.html"),
    path.join(__dirname, "../dist/index.html"),
    path.join(__dirname, "../index.html"),
    path.join(__dirname, "dist/index.html"),
    path.join(__dirname, "index.html")
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, "utf-8");
      }
    } catch (e) {}
  }
  return null;
}

// Rota para manipulação dinâmica de Open Graph (WhatsApp / Redes Sociais) para a Galeria
app.get(["/galeria", "/galeria/*"], async (req, res, next) => {
  const userAgent = (req.headers["user-agent"] || "").toLowerCase();
  const isBot = /whatsapp|facebook|twitter|telegram|discord|linkedin|bot|crawler|spider|preview|externalhit/i.test(userAgent);
  if (process.env.NODE_ENV !== "production" && !isBot) {
    return next();
  }

  try {
    const albumId = req.query.album as string;
    const photoUrl = req.query.photo as string;

    const html = getHtmlTemplate();
    if (!html) {
      return next();
    }

    let albumTitle = "Galeria de Fotos";
    let albumCover = "";

    if (albumId) {
      try {
        let docData: any = null;
        if (adminDb) {
          const docSnap = await adminDb.collection("posts").doc(albumId).get();
          if (docSnap.exists) docData = docSnap.data();
        } else if (clientDb) {
          const docSnap = await getClientDoc(clientDoc(clientDb, "posts", albumId));
          if (docSnap.exists()) docData = docSnap.data();
        }
        if (docData) {
          if (docData.title) albumTitle = docData.title;
          if (docData.image) albumCover = docData.image;
        }
      } catch (e) {
        console.error("Erro ao buscar álbum no Firestore para OG:", e);
      }
    }

    let finalImage = "https://i.imgur.com/hAcnt1E.png";
    let finalTitle = "Galeria de Fotos | Ministério Profecia";
    let finalDesc = "Confira a galeria de fotos e álbuns oficiais do Ministério Profecia.";

    if (photoUrl) {
      finalImage = formatOgImage(photoUrl);
      finalTitle = `${albumTitle} | Ministério Profecia`;
      finalDesc = `Confira esta foto do álbum "${albumTitle}" no site oficial do Ministério Profecia.`;
    } else if (albumId) {
      finalImage = formatOgImage(albumCover) || "https://i.imgur.com/hAcnt1E.png";
      finalTitle = `${albumTitle} | Ministério Profecia`;
      finalDesc = `Confira as fotos do álbum "${albumTitle}" no site oficial do Ministério Profecia.`;
    }

    const host = req.get("host") || "ministerioprofecia.com.br";
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const currentUrl = `${protocol}://${host}${req.originalUrl}`;

    let modifiedHtml = html
      .replace(/<title>[^<]*<\/title>/i, `<title>${finalTitle}</title>`)
      .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/i, `<meta property="og:title" content="${finalTitle}" />`)
      .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/i, `<meta property="og:description" content="${finalDesc}" />`)
      .replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/i, `<meta property="og:image" content="${finalImage}" />`);

    const extraMeta = `
    <meta property="og:image:secure_url" content="${finalImage}" />
    <meta property="og:url" content="${currentUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${finalTitle}" />
    <meta name="twitter:description" content="${finalDesc}" />
    <meta name="twitter:image" content="${finalImage}" />`;

    modifiedHtml = modifiedHtml.replace(/<\/head>/i, `${extraMeta}\n  </head>`);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    res.send(modifiedHtml);
  } catch (error: any) {
    console.error("Erro na rota /galeria OG:", error);
    next();
  }
});

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[Global Error Handler]", err);
    res.status(500).json({ 
      error: "Erro interno no servidor", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  });

  if (process.env.NODE_ENV !== "production" || process.env.RUN_STANDALONE) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;
