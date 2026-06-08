import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";

export async function POST() {
  const authUser = await getAuthUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const mission = await prisma.missionMaster.findFirst({
    where: { id: "daily_friend_visit", isActive: true },
  });
  if (!mission) return NextResponse.json({ success: true });

  const progress = await prisma.missionProgress.findUnique({
    where: {
      userId_missionId: { userId: authUser.id, missionId: mission.id },
    },
  });

  const newProgress = (progress?.progress ?? 0) + 1;
  const completed = newProgress >= mission.targetValue;

  await prisma.missionProgress.upsert({
    where: {
      userId_missionId: { userId: authUser.id, missionId: mission.id },
    },
    create: {
      userId: authUser.id,
      missionId: mission.id,
      progress: newProgress,
      completed,
    },
    update: { progress: newProgress, completed },
  });

  return NextResponse.json({ success: true });
}
