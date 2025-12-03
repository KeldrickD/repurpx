-- CreateTable
CREATE TABLE "SmsNumber" (
    "id" TEXT NOT NULL,
    "creatorAccountId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "providerSid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "SmsNumber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmsNumber_creatorAccountId_key" ON "SmsNumber"("creatorAccountId");

-- AddForeignKey
ALTER TABLE "SmsNumber" ADD CONSTRAINT "SmsNumber_creatorAccountId_fkey" FOREIGN KEY ("creatorAccountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
