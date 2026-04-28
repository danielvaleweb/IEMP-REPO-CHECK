import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const API_KEY = "AIzaSyA_nzF9lNrNZnE67_lum2D9HsO5OBrwx8o";
  const channelId = "UCILgaItnqDH3plhRXD54QUg";

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&key=${API_KEY}`
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch YouTube data" });
  }
}
