import { NextResponse } from "next/server";
import { getProfile, updateProfile } from "@/lib/actions/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const { email: _email, ...safeProfile } = profile;
  return NextResponse.json(safeProfile);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await updateProfile(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
