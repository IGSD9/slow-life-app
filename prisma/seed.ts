import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.title.upsert({
    where: { id: "title_admin" },
    create: {
      id: "title_admin",
      name: "管理者",
      description: "運営スタッフの称号",
    },
    update: { name: "管理者" },
  });

  await prisma.title.upsert({
    where: { id: "title_married" },
    create: {
      id: "title_married",
      name: "結婚",
      description: "パートナーと結ばれた称号",
    },
    update: { name: "結婚" },
  });

  const items = [
    {
      name: "室内PC",
      description: "ミニゲームが遊べる必須家具",
      category: "FURNITURE" as const,
      spriteKey: "furniture_pc_01",
      rarity: 1,
      isTradeable: false,
    },
    {
      name: "木の机",
      description: "シンプルなデスク",
      category: "FURNITURE" as const,
      spriteKey: "furniture_desk_01",
      rarity: 1,
    },
    {
      name: "椅子",
      description: "座れる椅子",
      category: "FURNITURE" as const,
      spriteKey: "furniture_chair_01",
      rarity: 1,
      priceCoins: 200,
    },
    {
      name: "観葉植物",
      description: "お部屋を彩る植物",
      category: "FURNITURE" as const,
      spriteKey: "furniture_plant_01",
      rarity: 2,
      priceCoins: 500,
    },
    {
      name: "デフォルトトップス",
      description: "初期装備のトップス",
      category: "CLOTHING" as const,
      clothingSlot: "TOP" as const,
      spriteKey: "clothing_top_default",
      rarity: 1,
      isTradeable: false,
    },
    {
      name: "デフォルトボトムス",
      description: "初期装備のボトムス",
      category: "CLOTHING" as const,
      clothingSlot: "BOTTOM" as const,
      spriteKey: "clothing_bottom_default",
      rarity: 1,
      isTradeable: false,
    },
    {
      name: "レッドキャップ",
      description: "おしゃれな帽子",
      category: "CLOTHING" as const,
      clothingSlot: "HAT" as const,
      spriteKey: "clothing_hat_default",
      rarity: 2,
      priceCoins: 300,
    },
    {
      name: "スニーカー",
      description: "歩きやすい靴",
      category: "CLOTHING" as const,
      clothingSlot: "SHOES" as const,
      spriteKey: "clothing_shoes_default",
      rarity: 1,
      priceCoins: 250,
    },
    {
      name: "ハートスタンプ",
      description: "チャット用スタンプ",
      category: "STAMP" as const,
      spriteKey: "stamp_heart_01",
      rarity: 1,
      priceCoins: 100,
    },
    {
      name: "結婚リング",
      description: "結婚の証",
      category: "CLOTHING" as const,
      clothingSlot: "ACCESSORY" as const,
      spriteKey: "clothing_accessory_ring",
      rarity: 3,
      isTradeable: false,
      priceGems: 0,
    },
  ];

  for (const item of items) {
    await prisma.itemMaster.upsert({
      where: { id: item.spriteKey },
      create: { id: item.spriteKey, ...item },
      update: item,
    });
  }

  const levelRewards = [
    { level: 10, itemId: "furniture_plant_01" },
    { level: 50, itemId: "clothing_hat_default" },
    { level: 100, itemId: "furniture_desk_01" },
  ];

  for (const reward of levelRewards) {
    await prisma.levelReward.upsert({
      where: { level: reward.level },
      create: reward,
      update: { itemId: reward.itemId },
    });
  }

  const missions = [
    {
      id: "daily_login",
      type: "DAILY" as const,
      title: "お部屋にお帰り",
      description: "ログインする",
      targetValue: 1,
      expReward: 50,
      coinReward: 100,
    },
    {
      id: "daily_tetris",
      type: "DAILY" as const,
      title: "テトリス1回",
      description: "テトリスを1回プレイする",
      targetValue: 1,
      expReward: 100,
      coinReward: 50,
    },
    {
      id: "daily_avatar",
      type: "DAILY" as const,
      title: "おしゃれしよう",
      description: "着せ替えを保存する",
      targetValue: 1,
      expReward: 50,
    },
    {
      id: "daily_friend_visit",
      type: "DAILY" as const,
      title: "お友達と遊ぼう",
      description: "フレンドの部屋を訪問する",
      targetValue: 1,
      expReward: 150,
    },
    {
      id: "achieve_lv10",
      type: "ACHIEVEMENT" as const,
      title: "レベル10達成",
      description: "レベル10に到達する",
      targetValue: 10,
      expReward: 200,
    },
    {
      id: "achieve_tetris_score",
      type: "ACHIEVEMENT" as const,
      title: "テトリス名人",
      description: "テトリスで1000点以上獲得",
      targetValue: 1000,
      expReward: 500,
    },
    {
      id: "daily_solitaire",
      type: "DAILY" as const,
      title: "ソリティア1回",
      description: "ソリティアを1回プレイする",
      targetValue: 1,
      expReward: 80,
    },
    {
      id: "daily_action",
      type: "DAILY" as const,
      title: "アクション1回",
      description: "横スクロールアクションを1回プレイする",
      targetValue: 1,
      expReward: 80,
    },
    {
      id: "achieve_fighting",
      type: "ACHIEVEMENT" as const,
      title: "大乱闘勝利",
      description: "大乱闘で1回勝利する",
      targetValue: 1,
      expReward: 300,
    },
    {
      id: "achieve_trade",
      type: "ACHIEVEMENT" as const,
      title: "トレードマスター",
      description: "アイテム交換を10回完了する",
      targetValue: 10,
      expReward: 400,
      coinReward: 500,
    },
  ];

  for (const mission of missions) {
    await prisma.missionMaster.upsert({
      where: { id: mission.id },
      create: mission,
      update: mission,
    });
  }

  const seasonStart = new Date();
  const seasonEnd = new Date();
  seasonEnd.setDate(seasonEnd.getDate() + 90);

  await prisma.battlePassSeason.upsert({
    where: { id: "season_1" },
    create: {
      id: "season_1",
      name: "シーズン1: スローライフ",
      startDate: seasonStart,
      endDate: seasonEnd,
      maxTier: 10,
      isActive: true,
    },
    update: { isActive: true, endDate: seasonEnd },
  });

  const bpRewards = [
    { tier: 1, itemId: "stamp_heart_01", isPremium: false },
    { tier: 2, itemId: "furniture_chair_01", isPremium: false },
    { tier: 3, itemId: "clothing_shoes_default", isPremium: false },
    { tier: 5, itemId: "clothing_hat_default", isPremium: false },
    { tier: 1, itemId: "furniture_plant_01", isPremium: true },
    { tier: 3, itemId: "furniture_desk_01", isPremium: true },
    { tier: 5, itemId: "clothing_hat_default", isPremium: true },
  ];

  for (const r of bpRewards) {
    await prisma.battlePassReward.upsert({
      where: {
        seasonId_tier_isPremium: {
          seasonId: "season_1",
          tier: r.tier,
          isPremium: r.isPremium,
        },
      },
      create: {
        seasonId: "season_1",
        tier: r.tier,
        isPremium: r.isPremium,
        itemId: r.itemId,
        expRequired: r.tier * 200,
      },
      update: { itemId: r.itemId },
    });
  }

  console.log("Seed completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
