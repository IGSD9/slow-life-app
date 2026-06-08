import { NextResponse } from "next/server";
import {
  acceptFriendRequest,
  getFriendsData,
  rejectFriendRequest,
  sendFriendRequest,
} from "@/lib/actions/friend";

export async function GET() {
  const data = await getFriendsData();
  if (!data) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "request") {
    const result = await sendFriendRequest(body.email);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "accept") {
    const result = await acceptFriendRequest(body.friendshipId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "reject") {
    const result = await rejectFriendRequest(body.friendshipId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
}
