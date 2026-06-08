import { prisma } from "@/lib/prisma";

export async function progressMission(
  userId: string,
  missionId: string,
  value: number,
  mode: "increment" | "max" = "increment",
) {
  const mission = await prisma.missionMaster.findUnique({
    where: { id: missionId, isActive: true },
  });
  if (!mission) return;

  const existing = await prisma.missionProgress.findUnique({
    where: { userId_missionId: { userId, missionId } },
  });

  let newProgress: number;
  if (mode === "max") {
    newProgress = Math.max(existing?.progress ?? 0, value);
  } else {
    newProgress = (existing?.progress ?? 0) + value;
  }

  const completed = newProgress >= mission.targetValue;
  await prisma.missionProgress.upsert({
    where: { userId_missionId: { userId, missionId } },
    create: { userId, missionId, progress: newProgress, completed },
    update: { progress: newProgress, completed },
  });
}

export async function syncAchievementMissions(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return;

  await progressMission(userId, "achieve_lv10", profile.level, "max");
}

export async function trackDailyLogin(userId: string) {
  await progressMission(userId, "daily_login", 1);
  await syncAchievementMissions(userId);
}

export async function trackAvatarSave(userId: string) {
  await progressMission(userId, "daily_avatar", 1);
}

export async function trackTetrisPlay(userId: string) {
  await progressMission(userId, "daily_tetris", 1);
}

export async function trackTradeComplete(userId: string) {
  await progressMission(userId, "achieve_trade", 1);
}
