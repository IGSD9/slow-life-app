import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getUser";
import { getAffinityRanking } from "@/lib/actions/friend";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const ranking = await getAffinityRanking(authUser.id);
  return NextResponse.json(ranking);
}
