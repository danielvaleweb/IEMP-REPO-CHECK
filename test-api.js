async function run() {
  const url = 'https://www.googleapis.com/youtube/v3/search?key=AIzaSyA_nzF9lNrNZnE67_lum2D9HsO5OBrwx8o&channelId=UCILgaItnqDH3plhRXD54QUg&part=snippet,id&order=date&maxResults=25';
  const res = await fetch(url, { headers: { 'Referer': 'https://ministerioprofecia.com.br/' } });
  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 500));
}
run();
