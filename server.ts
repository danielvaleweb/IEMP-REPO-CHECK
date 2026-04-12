import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });

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
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      
      const response = await fetch(rssUrl);
      if (!response.ok) throw new Error("Failed to fetch RSS feed");
      
      const xmlData = await response.text();
      const jsonObj = parser.parse(xmlData);
      
      const entries = jsonObj.feed.entry || [];
      const videos = (Array.isArray(entries) ? entries : [entries]).slice(0, 6).map((entry: any) => ({
        id: entry["yt:videoId"],
        title: entry.title,
        thumbnail: entry["media:group"]["media:thumbnail"]["@_url"],
        published: entry.published,
        link: entry.link["@_href"]
      }));

      res.json(videos);
    } catch (error) {
      console.error("Server error fetching recent videos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
