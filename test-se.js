async function run() {
  const channel = "0123456789abcdef01234567";
  const overlayToken = "abcdef1234567890abcdef1234567890"; // Typical overlay token
  try {
    const res = await fetch(`https://api.streamelements.com/kappa/v2/tips/${channel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${overlayToken}`
      },
      body: JSON.stringify({ amount: 10 })
    });
    console.log(res.status, await res.text());
  } catch(e) {}
}
run();
