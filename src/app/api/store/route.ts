import { NextResponse } from "next/server";
import { getStoreItems, purchaseItem } from "@/lib/actions/store";

export async function GET() {
  const data = await getStoreItems();
  if (!data) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await purchaseItem(body.itemId, body.currency ?? "coins");
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
