import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";
import { grantExp } from "@/lib/actions/profile";
import { syncAchievementMissions } from "@/lib/missions";

function startOfTodayUtc() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function ensureDailyReset(userId: string) {
  const todayStart = startOfTodayUtc();
  const dailyMissions = await prisma.missionMaster.findMany({
    where: { type: "DAILY", isActive: true },
  });

  for (const mission of dailyMissions) {
    const progress = await prisma.missionProgress.findUnique({
      where: { userId_missionId: { userId, missionId: mission.id } },
    });
    if (!progress) continue;
    if (progress.resetAt && progress.resetAt >= todayStart) continue;

    await prisma.missionProgress.update({
      where: { id: progress.id },
      data: {
        progress: 0,
        completed: false,
        claimed: false,
        resetAt: todayStart,
      },
    });
  }
}

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await ensureUserSetup(authUser.id, authUser.email);
  await ensureDailyReset(authUser.id);
  await syncAchievementMissions(authUser.id);

  const missions = await prisma.missionMaster.findMany({
    where: { isActive: true },
    include: {
      progress: { where: { userId: authUser.id } },
    },
  });

  const result = missions.map((m) => ({
    id: m.id,
    type: m.type,
    title: m.title,
    description: m.description,
    targetValue: m.targetValue,
    expReward: m.expReward,
    coinReward: m.coinReward,
    progress: m.progress[0]?.progress ?? 0,
    completed: m.progress[0]?.completed ?? false,
    claimed: m.progress[0]?.claimed ?? false,
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  if (body.action !== "claim") {
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  }

  const mission = await prisma.missionMaster.findUnique({
    where: { id: body.missionId },
  });
  if (!mission || !mission.isActive) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const progress = await prisma.missionProgress.findUnique({
    where: {
      userId_missionId: { userId: authUser.id, missionId: mission.id },
    },
  });

  if (!progress?.completed || progress.claimed) {
    return NextResponse.json({ error: "NOT_CLAIMABLE" }, { status: 400 });
  }

  await prisma.missionProgress.update({
    where: { id: progress.id },
    data: { claimed: true },
  });

  if (mission.expReward > 0) {
    await grantExp(mission.expReward);
  }

  if (mission.coinReward > 0) {
    await prisma.profile.update({
      where: { userId: authUser.id },
      data: { coins: { increment: mission.coinReward } },
    });
  }

  return NextResponse.json({
    success: true,
    expReward: mission.expReward,
    coinReward: mission.coinReward,
  });
}
