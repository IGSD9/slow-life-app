import { NextResponse } from "next/server";
import { createGemCheckoutSession } from "@/lib/actions/stripe";
import { GEM_PACKS } from "@/lib/stripePacks";

export async function GET() {
  return NextResponse.json({
    packs: GEM_PACKS.map((p) => ({
      id: p.id,
      gems: p.gems,
      priceYen: p.priceYen,
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createGemCheckoutSession(body.packId);
  if (!result.success) {
    const status = result.error === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}
