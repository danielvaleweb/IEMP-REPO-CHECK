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
      let channelId = (req.query.channelId as string) || "UCILgaItnqDH3plhRXD54QUg";
      channelId = channelId.trim();
      
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
          }
        }
      } catch (e) { console.warn("Videos Scraping failed"); }

      // 2. RSS Fallback/Enrichment
      if (videos.length < 5) {
        try {
          const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId.startsWith('@') ? 'UCILgaItnqDH3plhRXD54QUg' : channelId}`;
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
        } catch (e) { console.warn("RSS failed"); }
      }

      res.json(videos.slice(0, 15));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch" });
    }
  });

  // API Route to get recent lives/streams
  app.get("/api/recent-lives", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
      let channelId = (req.query.channelId as string) || "UCILgaItnqDH3plhRXD54QUg";
      channelId = channelId.trim();
      
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
          }
        }
      } catch (e) { console.warn("Streams scraping failed"); }

      // 2. RSS Fallback with keyword filtering
      if (lives.length < 5) {
        try {
          const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId.startsWith('@') ? 'UCILgaItnqDH3plhRXD54QUg' : channelId}`;
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
              const isLive = lowTitle.includes('culto') || lowTitle.includes('ao vivo') || lowTitle.includes('live') || lowTitle.includes('transmissão');
              
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
        } catch (e) { console.warn("RSS Live failed"); }
      }

      res.json(lives.slice(0, 15));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lives" });
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
    const distPath = path.join(__dirname, "dist");
    
    // Serve static files
    app.use(express.static(distPath));
    
    // SPA Fallback
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`Error sending index.html at ${indexPath}:`, err);
          res.status(500).send("Internal Server Error: Page not found on server.");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
