-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "lastCollectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Friendship" ADD COLUMN "marriageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_marriageId_key" ON "Friendship"("marriageId");

-- CreateTable
CREATE TABLE "SharedRoom" (
    "id" TEXT NOT NULL,
    "marriageId" TEXT NOT NULL,
    "wallpaperId" TEXT NOT NULL DEFAULT 'wall_default',
    "floorId" TEXT NOT NULL DEFAULT 'floor_default',
    "layoutData" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedRoom_marriageId_key" ON "SharedRoom"("marriageId");
