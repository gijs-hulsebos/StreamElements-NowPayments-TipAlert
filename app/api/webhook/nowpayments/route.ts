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
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
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
        result[key] = (obj[key] && typeof obj[key] === 'object') ? sortObject(obj[key]) : obj[key];
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
      const seAccountId = process.env.STREAMELEMENTS_ACCOUNT_ID;
      const seJwtToken = process.env.STREAMELEMENTS_JWT_TOKEN;

      if (!seAccountId || !seJwtToken) {
        console.error('Missing StreamElements configuration');
        return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
      }

      const amount = parseFloat(body.pay_amount);
      const currency = (body.pay_currency || 'USD').toUpperCase();
      const donorName = body.order_description || 'Anonymous';

      const seResponse = await fetch(`https://api.streamelements.com/kappa/v2/tips/${seAccountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${seJwtToken}`
        },
        body: JSON.stringify({
          provider: 'nowpayments',
          amount: amount,
          currency: currency,
          user: {
            username: donorName
          },
          message: 'Donation received via NOWPayments'
        })
      });

      if (!seResponse.ok) {
        console.error('StreamElements API Error:', seResponse.status, await seResponse.text());
      }
    }

    return NextResponse.json({ status: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
