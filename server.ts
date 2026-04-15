import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";
import fs from "fs";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    // Use /tmp/uploads for storage as it's writable on Cloud Run
    const uploadDir = "/tmp/uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      },
    });

    const upload = multer({ storage });

    // API Route for file uploads
    app.post("/api/upload", upload.single("image"), (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const filePath = `/uploads/${req.file.filename}`;
      res.json({ url: filePath });
    });

    // Serve uploads from /tmp/uploads
    app.use("/uploads", express.static(uploadDir));

    // Serve public folder as static
    const publicPath = path.resolve(process.cwd(), "public");
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
    }

    // API Route to check YouTube Live Status
    app.get("/api/live-status", async (req, res) => {
      try {
        const channelId = "UCILgaItnqDH3plhRXD54QUg";
        const youtubeUrl = `https://www.youtube.com/channel/${channelId}/live`;
        
        const response = await fetch(youtubeUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          return res.json({ isLive: false });
        }

        const html = await response.text();
        
        // Check for live indicators in the HTML
        const isLive = html.includes('{"text":" ao vivo"}') || 
                       html.includes('{"text":" watching"}') || 
                       html.includes('isLive":true') ||
                       html.includes('liveStreamability');

        res.json({ isLive });
      } catch (error) {
        console.error("Server error checking live status:", error);
        res.status(500).json({ isLive: false, error: "Internal server error" });
      }
    });

    // API Route to get recent videos
    app.get("/api/recent-videos", async (req, res) => {
      try {
        const channelId = "UCILgaItnqDH3plhRXD54QUg";
        const videosUrl = `https://www.youtube.com/@ministerio_profecia/videos`;
        
        const response = await fetch(videosUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });
        
        if (!response.ok) throw new Error(`Failed to fetch videos page: ${response.status}`);
        
        const html = await response.text();
        const match = html.match(/var ytInitialData\s*=\s*({[\s\S]*?});\s*<\/script>/) || 
                      html.match(/var ytInitialData\s*=\s*({[\s\S]*?});/);
        
        if (match) {
          try {
            const data = JSON.parse(match[1]);
            const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
            const videosTab = tabs.find((t: any) => {
              const renderer = t.tabRenderer;
              if (!renderer) return false;
              const title = renderer.title?.toLowerCase() || "";
              const url = renderer.endpoint?.browseEndpoint?.canonicalBaseUrl || "";
              return title.includes('video') || title.includes('vídeo') || url.includes('/videos') || renderer.selected === true;
            });
            
            const targetTab = videosTab || tabs[0];
            let contents = targetTab?.tabRenderer?.content?.richGridRenderer?.contents || 
                           targetTab?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items ||
                           [];
            
            const videos = contents
              .map((c: any) => {
                const v = c.richItemRenderer?.content?.videoRenderer || c.gridVideoRenderer || c.videoRenderer;
                if (!v) return null;
                
                const videoId = v.videoId;
                return {
                  id: videoId,
                  title: v.title?.runs?.[0]?.text || v.title?.simpleText || "Sem título",
                  thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                  published: v.publishedTimeText?.simpleText || v.publishedTimeText?.runs?.[0]?.text || "Recentemente",
                  link: `https://www.youtube.com/watch?v=${videoId}`
                };
              })
              .filter(Boolean)
              .slice(0, 6);
              
            if (videos.length > 0) {
              return res.json(videos);
            }
          } catch (parseError) {
            console.error("Error parsing ytInitialData:", parseError);
          }
        }
        
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const rssResponse = await fetch(rssUrl);
        if (rssResponse.ok) {
          const xmlData = await rssResponse.text();
          const jsonObj = parser.parse(xmlData);
          const entries = jsonObj.feed?.entry || [];
          const rssVideos = (Array.isArray(entries) ? entries : [entries]).slice(0, 6).map((entry: any) => {
            const videoId = entry["yt:videoId"];
            return {
              id: videoId,
              title: entry.title,
              thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              published: entry.published,
              link: entry.link?.["@_href"] || `https://www.youtube.com/watch?v=${videoId}`
            };
          });
          if (rssVideos.length > 0) return res.json(rssVideos);
        }

        throw new Error("Could not find videos via scraping or RSS");
      } catch (error) {
        console.error("Server error fetching recent videos:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(process.cwd(), "dist");
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          const indexPath = path.join(distPath, "index.html");
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.status(404).send("Index file not found");
          }
        });
      } else {
        app.get("*", (req, res) => {
          res.status(404).send("Dist directory not found. Please build the app.");
        });
      }
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
