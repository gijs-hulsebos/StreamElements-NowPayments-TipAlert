async function run() {
  const url = 'https://ais-pre-k7n6nmapzl5ek62lhrat52-241191987649.europe-west2.run.app/api/webhook/nowpayments';
  try {
    const res = await fetch(url, { method: 'POST', body: '{}' });
    console.log(res.status, await res.text());
  } catch(e) {}
}
run();
