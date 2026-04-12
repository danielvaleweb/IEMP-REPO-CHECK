import { XMLParser } from "fast-xml-parser";

export default async function handler(req: any, res: any) {
  try {
    const channelId = "UCILgaItnqDH3plhRXD54QUg";
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    
    const response = await fetch(rssUrl);
    if (!response.ok) throw new Error("Failed to fetch RSS feed");
    
    const xmlData = await response.text();
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
