export default async function handler(req: any, res: any) {
  try {
    const channelId = "UCILgaItnqDH3plhRXD54QUg";
    const youtubeUrl = `https://www.youtube.com/channel/${channelId}/live`;
    
    const response = await fetch(youtubeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return res.status(200).json({ isLive: false });
    }

    const html = await response.text();
    
    // Check for live indicators in the HTML
    const isLive = html.includes('{"text":" ao vivo"}') || 
                   html.includes('{"text":" watching"}') || 
                   html.includes('isLive":true') ||
                   html.includes('liveStreamability');

    res.status(200).json({ isLive });
  } catch (error) {
    console.error("Server error checking live status:", error);
    res.status(500).json({ isLive: false, error: "Internal server error" });
  }
}
