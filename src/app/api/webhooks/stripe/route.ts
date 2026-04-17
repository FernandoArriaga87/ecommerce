import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// This is the endpoint Stripe will call when events happen
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    // If you have a webhook secret, verify the signature
    // For now, in test mode, we might skip full verification if STRIPE_WEBHOOK_SECRET is not set
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Fallback for testing without webhook secret verification (NOT RECOMMENDED for production)
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        console.log(`Payment confirmed for order: ${orderId}`);
        
        // Update order status to CONFIRMED
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            status: "CONFIRMED", 
            externalId: session.id, // Better to store the session id
          },
        });
      }
      break;
    
    case "checkout.session.async_payment_failed":
      // Handle failed payment
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// NextJS route config to handle raw body
export const config = {
  api: {
    bodyParser: false,
  },
};
