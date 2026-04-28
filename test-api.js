async function run() {
  const API_KEY = process.env.VITE_YOUTUBE_API_KEY || 'REPLACE_ME';
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=UCILgaItnqDH3plhRXD54QUg&part=snippet,id&order=date&maxResults=25`;
  const res = await fetch(url, { headers: { 'Referer': 'https://ministerioprofecia.com.br/' } });
  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 500));
}
run();
