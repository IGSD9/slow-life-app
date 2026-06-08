import { NextResponse } from "next/server";
import {
  claimAllMails,
  claimMail,
  getMailbox,
  getUnclaimedMailCount,
  markMailRead,
} from "@/lib/actions/mailbox";
import { getAuthUser } from "@/lib/auth/getUser";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const [mails, unclaimedCount] = await Promise.all([
    getMailbox(authUser.id),
    getUnclaimedMailCount(authUser.id),
  ]);

  return NextResponse.json({ mails, unclaimedCount });
}

export async function POST(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "claim" && body.mailId) {
    const result = await claimMail(authUser.id, body.mailId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "claim_all") {
    const result = await claimAllMails(authUser.id);
    return NextResponse.json(result);
  }

  if (body.action === "read" && body.mailId) {
    await markMailRead(authUser.id, body.mailId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
}
