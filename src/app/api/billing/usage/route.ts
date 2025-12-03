import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, addMonths } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const creatorAccountIdParam = searchParams.get("creatorAccountId");

  const creator = await prisma.creatorAccount.findFirst({
    where: {
      userId,
      ...(creatorAccountIdParam ? { id: creatorAccountIdParam } : {}),
    },
    select: {
      id: true,
      billingPlan: true,
      monthlySmsLimit: true,
      smsPeriodStart: true,
      stripeSubscriptionId: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!creator) {
    return NextResponse.json({ error: "No creator account found" }, { status: 404 });
  }

  const periodStart = creator.smsPeriodStart ?? startOfMonth(new Date());

  const usageAgg = await prisma.outboundSms.aggregate({
    where: {
      creatorAccountId: creator.id,
      createdAt: { gte: periodStart },
    },
    _sum: {
      successCount: true,
    },
  });

  const used = usageAgg._sum.successCount ?? 0;
  const limit = creator.monthlySmsLimit;
  const remaining = limit > 0 ? Math.max(limit - used, 0) : 0;

  return NextResponse.json({
    creatorAccountId: creator.id,
    plan: creator.billingPlan,
    monthlySmsLimit: limit,
    smsUsed: used,
    smsRemaining: remaining,
    smsPeriodStart: periodStart,
    smsPeriodResetAt: addMonths(periodStart, 1),
    stripeSubscriptionId: creator.stripeSubscriptionId,
  });
}

