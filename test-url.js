async function run() {
  const url = `https://www.youtube.com/@igrejaprofetizandoavida`;
  const res = await fetch(url, { headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }});
  console.log(res.status);
}
run();
