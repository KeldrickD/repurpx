-- CreateEnum
CREATE TYPE "ClubVipStatus" AS ENUM ('NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateTable
CREATE TABLE "ClubPatron" (
    "id" TEXT NOT NULL,
    "creatorAccountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "telegramHandle" TEXT,
    "instagramHandle" TEXT,
    "vipStatus" "ClubVipStatus" NOT NULL DEFAULT 'NONE',
    "birthday" TIMESTAMP(3),
    "preferredNights" TEXT,
    "preferredDancer" TEXT,
    "totalSpendCents" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),
    "visitsCount" INTEGER NOT NULL DEFAULT 0,
    "lastTableAt" TIMESTAMP(3),
    "tablesCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubPatron_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClubPatron_creatorAccountId_idx" ON "ClubPatron"("creatorAccountId");

-- AddForeignKey
ALTER TABLE "ClubPatron" ADD CONSTRAINT "ClubPatron_creatorAccountId_fkey" FOREIGN KEY ("creatorAccountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
