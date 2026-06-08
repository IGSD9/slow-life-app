"use server";

import { getAuthUser } from "@/lib/auth/getUser";
import { GEM_PACKS } from "@/lib/stripePacks";

export async function createGemCheckoutSession(packId: string) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return { success: false, error: "STRIPE_NOT_CONFIGURED" };

  const pack = GEM_PACKS.find((p) => p.id === packId);
  if (!pack) return { success: false, error: "INVALID_PACK" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${siteUrl}/store?success=1`,
    cancel_url: `${siteUrl}/store?cancel=1`,
    "line_items[0][price_data][currency]": "jpy",
    "line_items[0][price_data][unit_amount]": String(pack.priceYen),
    "line_items[0][price_data][product_data][name]": `ジェム ${pack.gems}個`,
    "line_items[0][quantity]": "1",
    customer_email: authUser.email,
    "metadata[gemAmount]": String(pack.gems),
    "metadata[userEmail]": authUser.email,
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    return { success: false, error: "STRIPE_ERROR" };
  }

  const session = (await res.json()) as { url?: string; id: string };
  return { success: true, url: session.url, sessionId: session.id };
}
