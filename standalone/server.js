const express = require('express');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// CONFIGURATION
// ==========================================
// Replace these with your actual keys from NOWPayments and StreamElements
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || 'YOUR_NOWPAYMENTS_IPN_SECRET';
const STREAMELEMENTS_ACCOUNT_ID = process.env.STREAMELEMENTS_ACCOUNT_ID || 'YOUR_STREAMELEMENTS_ACCOUNT_ID';
const STREAMELEMENTS_JWT_TOKEN = process.env.STREAMELEMENTS_JWT_TOKEN || 'YOUR_STREAMELEMENTS_JWT_TOKEN';

// We need the raw body to verify the HMAC signature
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// ==========================================
// WEBHOOK ENDPOINT
// ==========================================
app.post('/webhook/nowpayments', async (req, res) => {
  const signature = req.headers['x-nowpayments-sig'];
  
  if (!signature) {
    console.error('Missing NOWPayments signature');
    return res.status(400).send('Missing signature');
  }

  // 1. Verify the signature
  const hmac = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET);
  hmac.update(req.rawBody);
  const calculatedSignature = hmac.digest('hex');

  if (signature !== calculatedSignature) {
    console.error('Invalid signature. Possible spoofing attempt.');
    return res.status(401).send('Invalid signature');
  }

  // 2. Parse the payload
  const payload = req.body;
  console.log('Received valid NOWPayments IPN:', payload.payment_id);

  // 3. Check if payment is finished
  if (payload.payment_status === 'finished') {
    const donorName = payload.order_description || 'Anonymous';
    const amount = parseFloat(payload.price_amount);
    const currency = payload.price_currency;

    // 4. Send to StreamElements API
    try {
      const response = await fetch(`https://api.streamelements.com/kappa/v2/tips/${STREAMELEMENTS_ACCOUNT_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STREAMELEMENTS_JWT_TOKEN}`
        },
        body: JSON.stringify({
          user: {
            username: donorName
          },
          provider: 'nowpayments',
          amount: amount,
          currency: currency,
          message: 'Donation received via NOWPayments'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('StreamElements API Error:', response.status, errorText);
      } else {
        console.log('Successfully forwarded donation to StreamElements!');
      }
    } catch (err) {
      console.error('Error forwarding to StreamElements:', err);
    }
  }

  // Always return 200 OK to acknowledge receipt
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Bridge server listening on port ${port}`);
});
