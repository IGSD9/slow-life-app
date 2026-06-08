import { NextResponse } from "next/server";
import { placeFurniture } from "@/lib/actions/room";
import type { PlacedFurniture } from "@/types/room";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await placeFurniture(body as PlacedFurniture);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
