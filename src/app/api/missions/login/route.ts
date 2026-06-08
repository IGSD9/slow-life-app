import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getUser";
import { trackDailyLogin } from "@/lib/missions";

export async function POST() {
  const authUser = await getAuthUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await trackDailyLogin(authUser.id);
  return NextResponse.json({ success: true });
}
