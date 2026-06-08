import { NextResponse } from "next/server";
import { getAdminGiftItems } from "@/lib/actions/admin";

export async function GET() {
  const items = await getAdminGiftItems();
  if (items.length === 0) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  return NextResponse.json(items);
}
