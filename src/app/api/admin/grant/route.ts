import { NextResponse } from "next/server";
import {
  adminPresentExp,
  adminPresentGems,
  adminPresentItem,
  adminPresentLevel,
} from "@/lib/actions/admin";

export async function POST(request: Request) {
  const body = await request.json();

  if (body.type === "item") {
    const result = await adminPresentItem({
      targetEmail: body.targetEmail,
      itemId: body.itemId,
    });
    if (!result.success) {
      return NextResponse.json(
        { error: "error" in result ? result.error : "FAILED" },
        { status: 403 },
      );
    }
    return NextResponse.json(result);
  }

  if (body.type === "level") {
    const result = await adminPresentLevel({
      targetEmail: body.targetEmail,
      level: body.level,
    });
    if (!result.success) {
      return NextResponse.json(
        { error: "error" in result ? result.error : "FAILED" },
        { status: 403 },
      );
    }
    return NextResponse.json(result);
  }

  if (body.type === "exp") {
    const result = await adminPresentExp({
      targetEmail: body.targetEmail,
      amount: body.amount,
    });
    if (!result.success) {
      return NextResponse.json(
        { error: "error" in result ? result.error : "FAILED" },
        { status: 403 },
      );
    }
    return NextResponse.json(result);
  }

  if (body.type === "gems") {
    const result = await adminPresentGems({
      targetEmail: body.targetEmail,
      amount: body.amount,
    });
    if (!result.success) {
      return NextResponse.json(
        { error: "error" in result ? result.error : "FAILED" },
        { status: 403 },
      );
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
}
