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

  let firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || undefined
  };

  if (!firebaseConfig.projectId) {
    console.warn("[Firebase] Project ID not found in environment variables.");
  }

  // Admin SDK
  try {
    const apps = getApps();
    if (apps.length === 0) {
      if (firebaseConfig.projectId && process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Se temos credenciais completas
        const cert = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
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
      firebaseClientApp = initializeClientApp(firebaseConfig as any, "server-client");
      clientDb = getClientFirestore(firebaseClientApp, firebaseConfig.firestoreDatabaseId);
    } catch (e) {
      console.error("[Firebase Client] Initialization failed:", e);
    }
  }

  return { adminDb, clientDb, firebaseAdminApp };
}

// Rota de Teste Simplificada
app.get("/backend/test", (req, res) => {
  const configExists = !!process.env.VITE_FIREBASE_PROJECT_ID;
  res.json({
    status: "ok",
    message: "Backend is running on Vercel",
    configExists: configExists,
    cwd: process.cwd(),
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
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
    res.setHeader("Content-Type", "text/html");
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

    // Thumbnails: much smaller, faster to load (sz=w500 ~50-100KB vs full ~2-8MB)
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
    // Cache thumbnails longer (1 week), full images 1 day
    res.setHeader('Cache-Control', `public, max-age=${isThumb ? 604800 : 86400}`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("[Drive Image Proxy Error]:", error);
    res.status(500).json({ error: (error as Error).message });
  }
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

// Helper para formatar URL de imagem para o Open Graph (WhatsApp/Redes Sociais)
function formatOgImage(url: string | undefined | null): string {
  if (!url) return "https://i.imgur.com/hAcnt1E.png";

  // Se for URL do Google Drive / Google Photos / lh3
  if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
    let fileId = "";
    // Tenta extrair id=ID
    const matchId = url.match(/[?&]id=([^&]+)/);
    if (matchId && matchId[1]) {
      fileId = matchId[1];
    } else {
      // Tenta extrair /d/ID
      const matchD = url.match(/\/d\/([^/]+)/);
      if (matchD && matchD[1]) {
        fileId = matchD[1];
      }
    }
    if (fileId) {
      // Retorna a URL direta do CDN de fotos da Google (sem redirecionamentos 302, essencial para o WhatsApp)
      return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
    }
  }

  // Se for Cloudinary
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
app.get(["/galeria", "/galeria/*"], async (req, res) => {
  try {
    const albumId = req.query.album as string;
    const photoUrl = req.query.photo as string;

    const html = getHtmlTemplate();
    if (!html) {
      return res.status(500).send("Template HTML não encontrado no servidor.");
    }

    let albumTitle = "Galeria de Fotos";
    let albumCover = "";

    if (albumId) {
      try {
        const { adminDb, clientDb } = getFirebase();
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
    const html = getHtmlTemplate();
    if (html) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } else {
      res.status(500).send("Erro interno ao carregar a página.");
    }
  }
});

// Exporta para a Vercel
export default app;
