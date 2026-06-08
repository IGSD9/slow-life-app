import { NextResponse } from "next/server";
import { proposeMarriage, acceptMarriage, rejectMarriage } from "@/lib/actions/marriage";

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "propose") {
    const result = await proposeMarriage(body.friendId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "accept") {
    const result = await acceptMarriage(body.friendId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "reject") {
    const result = await rejectMarriage(body.friendId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
}
