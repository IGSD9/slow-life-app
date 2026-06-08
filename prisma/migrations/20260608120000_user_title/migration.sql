-- CreateTable
CREATE TABLE "UserTitle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTitle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserTitle_userId_idx" ON "UserTitle"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTitle_userId_titleId_key" ON "UserTitle"("userId", "titleId");

-- AddForeignKey
ALTER TABLE "UserTitle" ADD CONSTRAINT "UserTitle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTitle" ADD CONSTRAINT "UserTitle_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 既存の結婚称号を所持データへ移行
INSERT INTO "UserTitle" ("id", "userId", "titleId", "acquiredAt")
SELECT gen_random_uuid()::text, "userId", "titleId", NOW()
FROM "Profile"
WHERE "titleId" = 'title_married'
ON CONFLICT ("userId", "titleId") DO NOTHING;

-- 管理者称号は装備から外す
UPDATE "Profile" SET "titleId" = NULL WHERE "titleId" = 'title_admin';
