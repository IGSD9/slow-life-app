-- AlterTable
ALTER TABLE "Friendship" ADD COLUMN     "marriageProposalFrom" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "gems" INTEGER NOT NULL DEFAULT 0;
