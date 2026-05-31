async function run() {
  const q = 'vercel "INVALID_REQUEST_METHOD: This Request was not made with an accepted method"';
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    const arr = text.split('INVALID_REQUEST_METHOD');
    console.log(arr.length);
    for (const chunk of arr.slice(1)) {
      console.log(chunk.substring(0, 300));
    }
  } catch(e) {}
}
run();
