-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('FURNITURE', 'CLOTHING', 'STAMP', 'TITLE', 'CURRENCY');

-- CreateEnum
CREATE TYPE "ClothingSlot" AS ENUM ('HAT', 'TOP', 'BOTTOM', 'SHOES', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('DAILY', 'ACHIEVEMENT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE_GEMS', 'PURCHASE_ITEM', 'BATTLE_PASS');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" VARCHAR(20) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "avatarConfig" JSONB NOT NULL DEFAULT '{}',
    "showAffinityRank" BOOLEAN NOT NULL DEFAULT true,
    "titleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ItemCategory" NOT NULL,
    "clothingSlot" "ClothingSlot",
    "spriteKey" TEXT NOT NULL,
    "rarity" INTEGER NOT NULL DEFAULT 1,
    "priceCoins" INTEGER NOT NULL DEFAULT 0,
    "priceGems" INTEGER NOT NULL DEFAULT 0,
    "isTradeable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isPlaced" BOOLEAN NOT NULL DEFAULT false,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wallpaperId" TEXT NOT NULL DEFAULT 'wall_default',
    "floorId" TEXT NOT NULL DEFAULT 'floor_default',
    "layoutData" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "affinity" INTEGER NOT NULL DEFAULT 0,
    "isMarried" BOOLEAN NOT NULL DEFAULT false,
    "marriedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelReward" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "titleId" TEXT,

    CONSTRAINT "LevelReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelRewardClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LevelRewardClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Title" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionMaster" (
    "id" TEXT NOT NULL,
    "type" "MissionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "expReward" INTEGER NOT NULL DEFAULT 0,
    "coinReward" INTEGER NOT NULL DEFAULT 0,
    "itemRewardId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MissionMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "resetAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattlePassSeason" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxTier" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BattlePassSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattlePassReward" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "itemId" TEXT NOT NULL,
    "expRequired" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BattlePassReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattlePassProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "currentTier" INTEGER NOT NULL DEFAULT 0,
    "currentExp" INTEGER NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BattlePassProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "itemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeSession" (
    "id" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "proposerItems" JSONB NOT NULL,
    "receiverItems" JSONB NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TradeSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "InventoryItem_userId_idx" ON "InventoryItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_userId_itemId_key" ON "InventoryItem"("userId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_userId_key" ON "Room"("userId");

-- CreateIndex
CREATE INDEX "Friendship_userId_affinity_idx" ON "Friendship"("userId", "affinity");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userId_friendId_key" ON "Friendship"("userId", "friendId");

-- CreateIndex
CREATE UNIQUE INDEX "LevelReward_level_key" ON "LevelReward"("level");

-- CreateIndex
CREATE UNIQUE INDEX "LevelRewardClaim_userId_level_key" ON "LevelRewardClaim"("userId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "MissionProgress_userId_missionId_key" ON "MissionProgress"("userId", "missionId");

-- CreateIndex
CREATE UNIQUE INDEX "BattlePassReward_seasonId_tier_isPremium_key" ON "BattlePassReward"("seasonId", "tier", "isPremium");

-- CreateIndex
CREATE UNIQUE INDEX "BattlePassProgress_userId_seasonId_key" ON "BattlePassProgress"("userId", "seasonId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelReward" ADD CONSTRAINT "LevelReward_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelReward" ADD CONSTRAINT "LevelReward_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelRewardClaim" ADD CONSTRAINT "LevelRewardClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProgress" ADD CONSTRAINT "MissionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProgress" ADD CONSTRAINT "MissionProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "MissionMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattlePassReward" ADD CONSTRAINT "BattlePassReward_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "BattlePassSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattlePassReward" ADD CONSTRAINT "BattlePassReward_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattlePassProgress" ADD CONSTRAINT "BattlePassProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattlePassProgress" ADD CONSTRAINT "BattlePassProgress_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "BattlePassSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
