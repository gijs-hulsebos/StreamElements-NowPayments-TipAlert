import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-nowpayments-sig'
    }
  });
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-nowpayments-sig');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const bodyText = await request.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    function sortObject(obj: any): any {
      return Object.keys(obj).sort().reduce((result: any, key: string) => {
        result[key] = (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) ? sortObject(obj[key]) : obj[key];
        return result;
      }, {});
    }

    const sortedBody = sortObject(body);
    const serializedBody = JSON.stringify(sortedBody);

    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET || '';
    const hmac = crypto.createHmac('sha512', ipnSecret);
    hmac.update(serializedBody);
    const calculatedSignature = hmac.digest('hex');

    if (calculatedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (body.payment_status === 'finished') {
      const payload = {
        id: body.payment_id,
        username: body.order_description || 'Crypto Tipper',
        amount: parseFloat(body.price_amount || '0'),
        currency: (body.price_currency || 'USD').toUpperCase(),
        cryptoDetails: `${body.pay_amount} ${(body.pay_currency || '').toUpperCase()}`
      };

      const kvResponse = await fetch('https://kvdb.io/SolAlertCanvas99x/latest_tip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!kvResponse.ok) {
        console.error('KVdb API Error:', kvResponse.status, await kvResponse.text());
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
