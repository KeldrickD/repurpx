-- CreateEnum
CREATE TYPE "BillingPlan" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'CLUB');

-- AlterTable
ALTER TABLE "CreatorAccount" ADD COLUMN     "billingPlan" "BillingPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "monthlySmsLimit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "smsPeriodStart" TIMESTAMP(3),
ADD COLUMN     "smsUsedThisPeriod" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;
