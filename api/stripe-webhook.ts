import Stripe from "stripe";
import { buffer } from "micro";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const runtime = "nodejs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  let buf: Buffer;

  try {
    buf = await buffer(req);
  } catch (error: unknown) {
    console.error("Buffer error:", error);
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
  } catch (error: unknown) {
    const detail = errorMessage(error);
    console.error("Webhook verification failed:", detail);
    return res.status(400).send(`Webhook Error: ${detail}`);
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
  } catch (error: unknown) {
    console.error("Webhook handler crash:", error);
    return res.status(500).send("Handler error");
  }
}
