import Stripe from 'stripe';
import { buffer } from 'micro';

export const runtime = 'nodejs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: any, res: any) {
  console.log('🔥 Webhook hit');

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let buf;

  try {
    buf = await buffer(req);
    console.log('✅ Buffer OK');
  } catch (err) {
    console.error('❌ Buffer failed:', err);
    return res.status(500).send('Buffer error');
  }

  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('❌ Missing stripe-signature header');
    return res.status(400).send('Missing signature');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('✅ Event verified:', event.type);
  } catch (err: any) {
    console.error('❌ Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('💰 PAYMENT CONFIRMED:', session.id);
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('❌ Handler crash:', err);
    return res.status(500).send('Handler error');
  }
}