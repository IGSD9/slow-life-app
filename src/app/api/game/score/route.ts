import { NextResponse } from "next/server";
import { submitGameScore } from "@/lib/actions/game";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await submitGameScore(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
