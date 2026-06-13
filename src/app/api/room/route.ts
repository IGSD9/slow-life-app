import { NextResponse } from "next/server";
import { getRoom, saveRoomLayout } from "@/lib/actions/room";
import { getAuthUser } from "@/lib/auth/getUser";
import type { RoomLayout } from "@/types/room";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? undefined;

    const room = await getRoom(userId);
    if (!room) {
      const authUser = await getAuthUser();
      if (!authUser?.email) {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      wallpaperId: room.wallpaperId,
      floorId: room.floorId,
      layoutData: room.layoutData,
      user: room.user,
    });
  } catch (error) {
    console.error("[GET /api/room]", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveRoomLayout({
      layoutData: body.layoutData as RoomLayout,
      wallpaperId: body.wallpaperId,
      floorId: body.floorId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/room]", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
