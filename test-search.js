async function run() {
  try {
    const res = await fetch('https://api.streamelements.com/openapi.json');
    console.log(res.status, await res.text());
  } catch(e) {}
}
run();
