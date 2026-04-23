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
      // Using the handle URL is often more reliable
      const youtubeUrl = `https://www.youtube.com/@ministerio_profecia/live`;
      
      const response = await fetch(youtubeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        // Wait at most 5 seconds for YouTube
        signal: AbortSignal.timeout(5000)
      });
      
      // If we can't reach YouTube or get a weird status, assume not live rather than erroring 500
      if (!response.ok) {
        console.warn(`YouTube live check returned status ${response.status}`);
        return res.json({ isLive: false });
      }

      const html = await response.text();
      
      // Check for live indicators in the HTML
      const isLive = html.includes('{"text":" ao vivo"}') || 
                     html.includes('{"text":" ao vivo "}') || 
                     html.includes('{"text":" watching"}') || 
                     html.includes('isLive":true') ||
                     html.includes('"isLive":true') ||
                     html.includes('style":"LIVE"') ||
                     html.includes('LIVE') && html.includes('watching') ||
                     html.includes('liveStreamability');

      res.json({ isLive });
    } catch (error) {
      console.error("Server error checking live status:", error);
      res.status(500).json({ isLive: false, error: "Internal server error" });
    }
  });

  // API Route to get recent videos
  app.get("/api/recent-videos", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
      const channelId = "UCILgaItnqDH3plhRXD54QUg";
      // Using the channel ID URL for better stability in different regions
      const videosUrl = `https://www.youtube.com/channel/${channelId}/videos`;
      
      const response = await fetch(videosUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });
      
      if (!response.ok) throw new Error(`Failed to fetch videos page: ${response.status}`);
      
      const html = await response.text();
      const match = html.match(/var ytInitialData = ({.*?});/);
      
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
          
          // Find the videos tab (check title and common params)
          const videosTab = tabs.find((t: any) => {
            const title = t.tabRenderer?.title?.toLowerCase() || "";
            return title.includes('video') || title.includes('vídeo') ||
                   t.tabRenderer?.endpoint?.browseEndpoint?.params?.includes('EgZ2aWRlb3');
          });
          
          const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];
          
          const videos = contents
            .filter((c: any) => {
              const v = c.richItemRenderer?.content?.videoRenderer;
              // Filter out upcoming events and ensure it's a video
              return v && !v.upcomingEventData;
            })
            .slice(0, 10) // Get more to handle duplicates
            .map((c: any) => {
              const v = c.richItemRenderer.content.videoRenderer;
              const videoId = v.videoId;
              
              // Try to get a more reliable date
              let publishedText = v.publishedTimeText?.simpleText || "Recentemente";
              
              return {
                id: videoId,
                title: v.title?.runs?.[0]?.text || "Sem título",
                thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                published: publishedText,
                link: `https://www.youtube.com/watch?v=${videoId}`
              };
            });
            
          // Ensure uniqueness by ID and Title (sometimes they have different IDs for same stream)
          const uniqueItems: any[] = [];
          const seenTitles = new Set();
          const seenIds = new Set();
          
          for (const vid of videos) {
            const normalizedTitle = vid.title.toLowerCase().trim();
            if (!seenTitles.has(normalizedTitle) && !seenIds.has(vid.id)) {
              seenTitles.add(normalizedTitle);
              seenIds.add(vid.id);
              uniqueItems.push(vid);
            }
          }

          if (uniqueItems.length > 0) {
            return res.json(uniqueItems.slice(0, 6));
          }
        } catch (parseError) {
          console.error("Error parsing ytInitialData:", parseError);
        }
      }
      
      // Fallback to RSS if scraping fails
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

  // API Route to get recent lives/streams
  app.get("/api/recent-lives", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
      const channelId = "UCILgaItnqDH3plhRXD54QUg";
      // Using the channel ID URL for streams
      const streamsUrl = `https://www.youtube.com/channel/${channelId}/streams`;
      
      const response = await fetch(streamsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });
      
      if (!response.ok) throw new Error(`Failed to fetch streams page: ${response.status}`);
      
      const html = await response.text();
      const match = html.match(/var ytInitialData = ({.*?});/);
      
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
          
          // Find the streams tab
          const streamsTab = tabs.find((t: any) => {
            const title = t.tabRenderer?.title?.toLowerCase() || "";
            return title.includes('live') || title.includes('ao vivo') || title.includes('stream') ||
                   t.tabRenderer?.endpoint?.browseEndpoint?.params?.includes('EgJ6sgEA');
          });
          
          // Alternatively, just pick the one containing videos
          const contents = streamsTab?.tabRenderer?.content?.richGridRenderer?.contents || tabs.find((t: any) => t.tabRenderer?.content?.richGridRenderer?.contents)?.tabRenderer?.content?.richGridRenderer?.contents || [];
          
          const streams = contents
            .filter((c: any) => {
              const v = c.richItemRenderer?.content?.videoRenderer;
              // Filter out upcoming events and ensure it's a video
              return v && !v.upcomingEventData;
            })
            .slice(0, 10)
            .map((c: any) => {
              const v = c.richItemRenderer.content.videoRenderer;
              const videoId = v.videoId;
              let publishedText = v.publishedTimeText?.simpleText || "Recentemente";
              
              return {
                id: videoId,
                title: v.title?.runs?.[0]?.text || "Sem título",
                thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                published: publishedText,
                link: `https://www.youtube.com/watch?v=${videoId}`
              };
            });
            
          const uniqueItems: any[] = [];
          const seenIds = new Set();
          const seenTitles = new Set();
          
          for (const vid of streams) {
            const normalizedTitle = vid.title.toLowerCase().trim();
            if (!seenIds.has(vid.id) && !seenTitles.has(normalizedTitle)) {
              seenIds.add(vid.id);
              seenTitles.add(normalizedTitle);
              uniqueItems.push(vid);
            }
          }

          if (uniqueItems.length > 0) {
            return res.json(uniqueItems.slice(0, 6));
          }
        } catch (parseError) {
          console.error("Error parsing ytInitialData for streams:", parseError);
        }
      }
      
      // Fallback to RSS if scraping fails, using the same logic as recent-videos
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

      throw new Error("Could not find streams via scraping.");
    } catch (error) {
      console.error("Server error fetching recent streams:", error);
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
