-- CreateEnum
CREATE TYPE "TelegramChannelKind" AS ENUM ('CREATOR_SEGMENT', 'DANCER_TIER');

-- DropIndex
DROP INDEX "TelegramChannel_creatorAccountId_segment_key";

-- AlterTable
ALTER TABLE "TelegramChannel" ADD COLUMN     "dancerTier" "DancerCustomerTier",
ADD COLUMN     "kind" "TelegramChannelKind" NOT NULL DEFAULT 'CREATOR_SEGMENT';

-- CreateIndex
CREATE INDEX "TelegramChannel_creatorAccountId_kind_idx" ON "TelegramChannel"("creatorAccountId", "kind");

-- CreateIndex
CREATE INDEX "TelegramChannel_creatorAccountId_kind_segment_idx" ON "TelegramChannel"("creatorAccountId", "kind", "segment");

-- CreateIndex
CREATE INDEX "TelegramChannel_creatorAccountId_kind_dancerTier_idx" ON "TelegramChannel"("creatorAccountId", "kind", "dancerTier");
