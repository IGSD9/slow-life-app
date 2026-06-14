"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";
import { grantExp } from "@/lib/actions/profile";
import { trackTetrisPlay } from "@/lib/missions";
import { calcExpFromScore } from "@/games/engine";
import { addBattlePassExp } from "./battlepass";

const GAME_MISSION_MAP: Record<string, string[]> = {
  tetris: ["テトリス", "スコア"],
  solitaire: ["ソリティア"],
  scroll_action: ["アクション"],
  fighting: ["大乱闘", "格闘"],
  real_fps: ["FPS", "シューティング"],
};

export async function submitGameScore(input: {
  gameId: "tetris" | "solitaire" | "scroll_action" | "fighting" | "real_fps";
  score: number;
}) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  if (input.score < 0 || input.score > 999_999) {
    return { success: false, error: "INVALID_SCORE" };
  }

  const expGain = calcExpFromScore(input.score, input.gameId);
  const result = await grantExp(expGain);
  if (!result.success) return result;

  await addBattlePassExp(authUser.id, Math.ceil(expGain * 0.5));

  if (input.gameId === "tetris") {
    await trackTetrisPlay(authUser.id);
  }

  const keywords = GAME_MISSION_MAP[input.gameId] ?? [];
  const missions = await prisma.missionMaster.findMany({
    where: { isActive: true },
    include: { progress: { where: { userId: authUser.id } } },
  });

  for (const mission of missions) {
    const matched = keywords.some((kw) => mission.title.includes(kw) || mission.description.includes(kw));
    if (!matched) continue;

    let newProgress = mission.progress[0]?.progress ?? 0;
    if (mission.description.includes("スコア") || mission.title.includes("スコア")) {
      newProgress = Math.max(newProgress, input.score);
    } else {
      newProgress += 1;
    }

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
  }

  revalidatePath("/missions");
  revalidatePath("/battle-pass");
  return {
    ...result,
    expGain,
    rewards: result.rewards?.map((r) => ({ id: r.id, name: r.name })) ?? [],
  };
}

export async function submitFpsClear() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  const expGain = 50;
  const result = await grantExp(expGain);
  if (!result.success) return result;

  await addBattlePassExp(authUser.id, Math.ceil(expGain * 0.5));

  revalidatePath("/missions");
  revalidatePath("/battle-pass");
  revalidatePath("/profile");
  return {
    ...result,
    expGain,
    rewards: result.rewards?.map((r) => ({ id: r.id, name: r.name })) ?? [],
  };
}
