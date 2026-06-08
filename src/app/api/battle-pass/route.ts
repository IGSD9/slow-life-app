import { NextResponse } from "next/server";
import {
  getBattlePassData,
  claimBattlePassReward,
  activatePremiumPass,
} from "@/lib/actions/battlepass";

export async function GET() {
  const data = await getBattlePassData();
  if (!data) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "claim") {
    const result = await claimBattlePassReward(body.tier, body.isPremium ?? false);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "premium") {
    const result = await activatePremiumPass();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
}
