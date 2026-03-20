import Stripe from "stripe";
import { buffer } from "micro";

export const runtime = "nodejs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  let buf: Buffer;

  try {
    buf = await buffer(req);
  } catch (err) {
    console.error("Buffer error:", err);
    return res.status(500).send("Buffer error");
  }

  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).send("Missing stripe-signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      let receiptNumber: string | null = null;

      if (paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ["latest_charge"],
        });

        const latestCharge = paymentIntent.latest_charge;

        if (latestCharge && typeof latestCharge !== "string") {
          receiptNumber = latestCharge.receipt_number ?? null;
        } else if (typeof latestCharge === "string") {
          const charge = await stripe.charges.retrieve(latestCharge);
          receiptNumber = charge.receipt_number ?? null;
        }
      }

      const supabaseRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            stripe_session_id: session.id,
            stripe_payment_intent: paymentIntentId,
            receipt_number: receiptNumber,
            customer_email: session.customer_details?.email ?? null,
            product_id: session.metadata?.product_id ?? null,
            amount_total: session.amount_total ?? null,
            currency: session.currency ?? null,
            status: "paid",
          }),
        }
      );

      const text = await supabaseRes.text();

      if (!supabaseRes.ok) {
        console.error("❌ Supabase insert failed:", text);
        return res.status(500).send(text);
      }

      console.log("✅ Supabase response:", text);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler crash:", err);
    return res.status(500).send("Handler error");
  }
}