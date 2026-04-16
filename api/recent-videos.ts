import { XMLParser } from "fast-xml-parser";

export default async function handler(req: any, res: any) {
  try {
    const channelId = "UCILgaItnqDH3plhRXD54QUg";
    const videosUrl = `https://www.youtube.com/@ministerio_profecia/videos`;
    
    const response = await fetch(videosUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const match = html.match(/var ytInitialData = ({.*?});/);
      if (match) {
        const data = JSON.parse(match[1]);
        const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        const videosTab = tabs.find((t: any) => 
          t.tabRenderer?.title === 'Videos' || 
          t.tabRenderer?.title === 'Vídeos' ||
          t.tabRenderer?.selected === true
        );
        const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];
        const videos = contents
          .filter((c: any) => c.richItemRenderer?.content?.videoRenderer)
          .slice(0, 6)
          .map((c: any) => {
            const v = c.richItemRenderer.content.videoRenderer;
            const videoId = v.videoId;
            return {
              id: videoId,
              title: v.title?.runs?.[0]?.text || "Sem título",
              thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              published: v.publishedTimeText?.simpleText || "Recentemente",
              link: `https://www.youtube.com/watch?v=${videoId}`
            };
          });
        if (videos.length > 0) return res.status(200).json(videos);
      }
    }

    // Fallback to RSS
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssResponse = await fetch(rssUrl);
    if (!rssResponse.ok) throw new Error("Failed to fetch RSS feed");
    
    const xmlData = await rssResponse.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    const jsonObj = parser.parse(xmlData);
    
    const entries = jsonObj.feed?.entry || [];
    const videos = (Array.isArray(entries) ? entries : [entries]).slice(0, 6).map((entry: any) => ({
      id: entry["yt:videoId"],
      title: entry.title,
      thumbnail: entry["media:group"]?.["media:thumbnail"]?.["@_url"] || `https://i.ytimg.com/vi/${entry["yt:videoId"]}/hqdefault.jpg`,
      published: entry.published,
      link: entry.link?.["@_href"] || `https://www.youtube.com/watch?v=${entry["yt:videoId"]}`
    }));

    res.status(200).json(videos);
  } catch (error) {
    console.error("Server error fetching recent videos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
