import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: Request) {
  return NextResponse.json({ status: 'OK', message: 'Webhook endpoint is active. Please send a POST request with the NOWPayments IPN payload.' }, { status: 200 });
}

export async function HEAD(req: Request) {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS, HEAD, PUT, PATCH, DELETE'
    }
  });
}

export async function PUT(req: Request) {
  return NextResponse.json({ status: 'OK', message: 'PUT received.' }, { status: 200 });
}

export async function PATCH(req: Request) {
  return NextResponse.json({ status: 'OK', message: 'PATCH received.' }, { status: 200 });
}

export async function DELETE(req: Request) {
  return NextResponse.json({ status: 'OK', message: 'DELETE received.' }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-nowpayments-sig');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // We need the raw body text to verify the HMAC signature
    const rawBody = await req.text();
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET || 'mock-secret';

    // 1. Verify the signature
    const hmac = crypto.createHmac('sha512', ipnSecret);
    hmac.update(rawBody);
    const calculatedSignature = hmac.digest('hex');

    if (signature !== calculatedSignature) {
      console.error('Invalid signature. Possible spoofing attempt.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse the payload
    const payload = JSON.parse(rawBody);
    console.log('Received valid NOWPayments IPN:', payload.payment_id);

    // 3. Check if payment is finished
    if (payload.payment_status === 'finished') {
      const donorName = payload.order_description || 'Anonymous';
      const amount = parseFloat(payload.price_amount);
      const currency = payload.price_currency;

      // 4. Send Donation to StreamElements
      const seAccountId = process.env.STREAMELEMENTS_ACCOUNT_ID;
      const seJwtToken = process.env.STREAMELEMENTS_JWT_TOKEN;

      if (!seAccountId || !seJwtToken) {
        console.error('StreamElements credentials are not configured.');
        return NextResponse.json({ error: 'StreamElements not configured' }, { status: 500 });
      }

      const response = await fetch(`https://api.streamelements.com/kappa/v2/tips/${seAccountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${seJwtToken}`
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
        // We still want to return 200 to NOWPayments so it doesn't retry endlessly, 
        // but log the error for debugging.
      } else {
        console.log('Successfully forwarded donation to StreamElements!');
      }
    }

    // Always return 200 OK to acknowledge receipt from NOWPayments
    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
