async function run() {
  const channelId = "UCILgaItnqDH3plhRXD54QUg";
  const url = `https://www.youtube.com/channel/${channelId}/videos`;
  try {
    const res = await fetch(url, { headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'Cookie': 'CONSENT=YES+cb.20230531-17-p0.en'
    }});
    console.log("Status:", res.status);
    const html = await res.text();
    console.log("Snippet:", html.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
}
run();
