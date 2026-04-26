import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import cron from "node-cron";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

// Log configuration for debugging
console.log("[Firebase] Config:", { 
  projectId: firebaseConfig.projectId, 
  databaseId: firebaseConfig.firestoreDatabaseId 
});

const adminApp = getApps().length === 0 
  ? initializeApp({
      projectId: firebaseConfig.projectId,
    }) 
  : getApps()[0];

const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

// Test Firestore connection on startup
(async () => {
  try {
    console.log("[Firebase] Testing internal connection...");
    await db.collection("members").limit(1).get();
    console.log("[Firebase] Internal connection SUCCESS");
  } catch (error: any) {
    console.error("[Firebase] Internal connection FAILURE:");
    console.error(`Status: ${error.code}`);
    console.error(`Message: ${error.message}`);
    if (error.code === 7) {
      console.error("ADVICE: This is a PERMISSION_DENIED error. Ensure the Service Account in Cloud Run has 'Cloud Datastore User' role.");
    }
  }
})();

const expo = new Expo();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });

  // 1. Endpoint para receber o Expo Push Token
  app.post("/api/push/register", async (req, res) => {
    try {
      const { userId, token } = req.body;
      if (!userId || !token) {
        return res.status(400).json({ error: "userId and token are required" });
      }

      if (!Expo.isExpoPushToken(token)) {
        return res.status(400).json({ error: "Invalid Expo push token" });
      }

      // Salva o token no perfil do usuário
      const userRef = db.collection("members").doc(userId);
      await userRef.update({ pushToken: token });

      console.log(`Token registrado para o usuário ${userId}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao registrar token:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Endpoint para disparo imediato (API Interna/Admin)
  app.post("/api/push/send", async (req, res) => {
    try {
      const { title, message, target = "all", userIds = [] } = req.body;
      
      let tokens: string[] = [];
      
      if (target === "all") {
        const snapshot = await db.collection("members").where("pushToken", "!=", null).get();
        tokens = snapshot.docs.map(doc => doc.data().pushToken).filter(t => !!t);
      } else if (userIds.length > 0) {
        // Busca tokens de usuários específicos
        const tokensPromises = userIds.map(async (uid: string) => {
          const doc = await db.collection("members").doc(uid).get();
          return doc.exists ? doc.data()?.pushToken : null;
        });
        const results = await Promise.all(tokensPromises);
        tokens = results.filter(t => !!t);
      }

      if (tokens.length === 0) {
        return res.json({ success: true, sent: 0, message: "Nenhum token encontrado" });
      }

      const tickets = await sendPushNotifications(tokens, title, message);
      
      // Salva no histórico (opcional)
      await db.collection("announcements").add({
        title,
        message,
        target,
        status: "sent",
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, sent: tokens.length, tickets });
    } catch (error: any) {
      console.error("Erro ao enviar push:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Função auxiliar para enviar via Expo
  async function sendPushNotifications(tokens: string[], title: string, body: string, data = {}) {
    const messages: ExpoPushMessage[] = [];
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

  // 3. Cron Job para Notificações Agendadas (roda a cada minuto)
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date().toISOString();
      console.log(`[Cron] Checking for scheduled notifications at ${now}...`);
      
      const snapshot = await db.collection("announcements")
        .where("status", "==", "pending")
        .where("scheduledAt", "<=", now)
        .get();

      if (snapshot.empty) return;

      console.log(`[Cron] Processing ${snapshot.size} scheduled notifications...`);

      for (const doc of snapshot.docs) {
        const data = doc.data();
        let tokens: string[] = [];

        if (data.target === "all") {
          const membersSnap = await db.collection("members").where("pushToken", "!=", "").get();
          tokens = membersSnap.docs.map(m => m.data().pushToken).filter(t => !!t);
        } else if (data.userIds?.length > 0) {
          const tokensPromises = data.userIds.map(async (uid: string) => {
            const mDoc = await db.collection("members").doc(uid).get();
            return mDoc.exists ? mDoc.data()?.pushToken : null;
          });
          const results = await Promise.all(tokensPromises);
          tokens = results.filter(t => !!t);
        }

        if (tokens.length > 0) {
          await sendPushNotifications(tokens, data.title, data.message);
        }

        await doc.ref.update({
          status: "sent",
          sentAt: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error("[Cron] FATAL Error in notification job:");
      console.error(`Status: ${error.code}`);
      console.error(`Message: ${error.message}`);
    }
  });

  app.get("/api/live-status", async (req, res) => {
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
  app.get("/api/recent-videos", async (req, res) => {
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
      console.error("Critical error in /api/recent-videos:", error);
      res.status(500).json({ error: "Failed to fetch" });
    }
  });

  // API Route to get recent lives/streams
  app.get("/api/recent-lives", async (req, res) => {
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
      console.error("Critical error in /api/recent-lives:", error);
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use, retrying...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT, "0.0.0.0");
      }, 1000);
    } else {
      console.error("Server error:", e);
    }
  });
}

startServer();
