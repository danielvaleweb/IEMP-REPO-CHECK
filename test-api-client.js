async function run() {
  const API_KEY = process.env.VITE_YOUTUBE_API_KEY || "REPLACE_ME";
  const CHANNEL_ID = "UCILgaItnqDH3plhRXD54QUg";
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=20`;
  const res = await fetch(url);
  console.log(res.status);
}
run();
