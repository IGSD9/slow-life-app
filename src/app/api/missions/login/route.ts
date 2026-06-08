import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getUser";
import { trackDailyLogin } from "@/lib/missions";
import { syncMailboxOnLogin } from "@/lib/actions/mailbox";

export async function POST() {
  const authUser = await getAuthUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await trackDailyLogin(authUser.id);
  const mailResult = await syncMailboxOnLogin(authUser.id, authUser.email);
  return NextResponse.json({
    success: true,
    dailyMailDelivered: mailResult.delivered,
  });
}
