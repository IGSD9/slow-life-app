-- CreateEnum
CREATE TYPE "MailType" AS ENUM ('DAILY_REWARD', 'SYSTEM');

-- CreateTable
CREATE TABLE "MailMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "mailType" "MailType" NOT NULL DEFAULT 'DAILY_REWARD',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyRewardConfig" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "itemId" TEXT,
    "itemQty" INTEGER NOT NULL DEFAULT 1,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyRewardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyRewardLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "mailId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyRewardLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MailMessage_userId_isClaimed_idx" ON "MailMessage"("userId", "isClaimed");

-- CreateIndex
CREATE INDEX "MailMessage_userId_createdAt_idx" ON "MailMessage"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRewardLog_userId_dateKey_key" ON "DailyRewardLog"("userId", "dateKey");

-- AddForeignKey
ALTER TABLE "MailMessage" ADD CONSTRAINT "MailMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRewardConfig" ADD CONSTRAINT "DailyRewardConfig_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRewardLog" ADD CONSTRAINT "DailyRewardLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 初期デイリー報酬（今後 DB で変更可能）
INSERT INTO "DailyRewardConfig" ("id", "label", "itemId", "itemQty", "coins", "gems", "exp", "isActive", "priority")
VALUES
  ('daily_coins', 'デイリーコイン', NULL, 1, 100, 0, 0, true, 1),
  ('daily_stamp', 'デイリースタンプ', 'stamp_heart_01', 1, 0, 0, 0, true, 2)
ON CONFLICT ("id") DO NOTHING;
