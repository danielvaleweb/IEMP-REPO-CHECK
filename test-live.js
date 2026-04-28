async function run() {
  const url = `http://127.0.0.1:3000/backend/recent-lives?channelId=UCILgaItnqDH3plhRXD54QUg`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Snippet:", text.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
}
run();
