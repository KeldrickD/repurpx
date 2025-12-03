import { BillingPlan } from "@prisma/client";

export const PLAN_LIMITS: Record<BillingPlan, { monthlySmsLimit: number }> = {
  FREE: { monthlySmsLimit: 0 },
  STARTER: { monthlySmsLimit: 500 },
  GROWTH: { monthlySmsLimit: 2000 },
  CLUB: { monthlySmsLimit: 10000 },
};

