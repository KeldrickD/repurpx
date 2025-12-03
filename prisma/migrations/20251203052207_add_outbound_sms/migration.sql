-- CreateEnum
CREATE TYPE "SmsAudienceType" AS ENUM ('DANCER_TIER', 'CLUB_VIP');

-- CreateEnum
CREATE TYPE "SmsTargetType" AS ENUM ('DANCER_CUSTOMER', 'CLUB_PATRON');

-- CreateTable
CREATE TABLE "OutboundSms" (
    "id" TEXT NOT NULL,
    "creatorAccountId" TEXT NOT NULL,
    "audienceType" "SmsAudienceType" NOT NULL,
    "audienceKey" TEXT NOT NULL,
    "targetType" "SmsTargetType" NOT NULL,
    "targetId" TEXT,
    "body" TEXT NOT NULL,
    "toCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT,
    "providerBatchId" TEXT,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundSms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboundSms_creatorAccountId_audienceType_idx" ON "OutboundSms"("creatorAccountId", "audienceType");

-- AddForeignKey
ALTER TABLE "OutboundSms" ADD CONSTRAINT "OutboundSms_creatorAccountId_fkey" FOREIGN KEY ("creatorAccountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
