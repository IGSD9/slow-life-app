-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

-- AlterTable
ALTER TABLE "Friendship" ADD COLUMN     "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING';
