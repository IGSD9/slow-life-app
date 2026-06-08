import { NextResponse } from "next/server";
import { getPublicCharacterProfile } from "@/lib/actions/publicProfile";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const profile = await getPublicCharacterProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json(profile);
}
