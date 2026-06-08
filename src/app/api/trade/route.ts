import { NextResponse } from "next/server";
import {
  proposeTrade,
  acceptTrade,
  cancelTrade,
  getPendingTrades,
  getTradeableInventory,
} from "@/lib/actions/trade";
import { addAffinityForOutfitShare, addAffinityForStamp } from "@/lib/affinity";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";
import { areFriends } from "@/lib/actions/friend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const self = searchParams.get("self");

  if (self === "1") {
    const inventory = await getTradeableInventory();
    if (!inventory) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json(inventory);
  }

  if (userId) {
    const inventory = await getTradeableInventory(userId);
    if (!inventory) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(inventory);
  }

  const trades = await getPendingTrades();
  if (!trades) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json(trades);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  if (action === "propose") {
    const result = await proposeTrade({
      receiverId: body.receiverId,
      proposerItems: body.proposerItems ?? [],
      receiverItems: body.receiverItems ?? [],
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (action === "accept") {
    const result = await acceptTrade(body.sessionId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (action === "cancel") {
    const result = await cancelTrade(body.sessionId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (action === "share_outfit") {
    const authUser = await getAuthUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    await ensureUserSetup(authUser.id, authUser.email);

    const targetUserId = body.targetUserId as string;
    if (!targetUserId) {
      return NextResponse.json({ error: "INVALID" }, { status: 400 });
    }

    const friends = await areFriends(authUser.id, targetUserId);
    if (!friends) {
      return NextResponse.json({ error: "NOT_FRIENDS" }, { status: 403 });
    }

    await addAffinityForOutfitShare(authUser.id, targetUserId);
    return NextResponse.json({ success: true });
  }

  if (action === "send_stamp") {
    const authUser = await getAuthUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const targetUserId = body.targetUserId as string;
    if (!targetUserId) {
      return NextResponse.json({ error: "INVALID" }, { status: 400 });
    }

    const friends = await areFriends(authUser.id, targetUserId);
    if (!friends) {
      return NextResponse.json({ error: "NOT_FRIENDS" }, { status: 403 });
    }

    await addAffinityForStamp(authUser.id, targetUserId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
}
