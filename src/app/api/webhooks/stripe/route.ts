import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { grantGemsFromPurchase } from "@/lib/actions/store";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeKey) {
    return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 501 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "NO_SIGNATURE" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email ?? session.metadata?.userEmail;
    const gemAmount = parseInt(session.metadata?.gemAmount ?? "0", 10);

    if (email && gemAmount > 0) {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      if (user) {
        await grantGemsFromPurchase(user.id, gemAmount);
      }
    }
  }

  return NextResponse.json({ received: true });
}
