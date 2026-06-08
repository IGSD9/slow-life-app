-- CreateTable
CREATE TABLE "BattlePassClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "isPremium" BOOLEAN NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattlePassClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BattlePassClaim_userId_seasonId_tier_isPremium_key" ON "BattlePassClaim"("userId", "seasonId", "tier", "isPremium");
