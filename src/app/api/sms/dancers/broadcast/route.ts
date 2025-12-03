import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import {
  DancerCustomerTier,
  SmsAudienceType,
  SmsTargetType,
} from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountSms } from "@/lib/sms";
import { assertCanSendSms, SmsLimitError } from "@/lib/smsLimits";

const BroadcastSchema = z.object({
  creatorAccountId: z.string(),
  tier: z.enum(["WHALE", "REGULAR", "OCCASIONAL", "TEST"]),
  text: z.string().min(1),
  limit: z.number().int().positive().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { creatorAccountId, tier, text, limit } =
      BroadcastSchema.parse(payload);

    const account = await prisma.creatorAccount.findFirst({
      where: { id: creatorAccountId, userId },
      select: { id: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const take = limit ?? 200;
    const customers = await prisma.dancerCustomer.findMany({
      where: {
        creatorAccountId,
        tier: tier as DancerCustomerTier,
        phone: { not: null },
      },
      take,
    });

    if (customers.length === 0) {
      return NextResponse.json(
        { error: `No customers with phone for tier ${tier}` },
        { status: 400 },
      );
    }

    const targets = customers;

    try {
      await assertCanSendSms(creatorAccountId, targets.length);
    } catch (err) {
      if (err instanceof SmsLimitError) {
        return NextResponse.json(
          { error: err.message, code: err.code, remaining: err.remaining },
          { status: 402 },
        );
      }
      throw err;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const customer of customers) {
      if (!customer.phone) continue;
      try {
        await sendAccountSms(creatorAccountId, customer.phone, text);
        successCount += 1;
      } catch (error) {
        console.error("SMS send failed", customer.phone, error);
        failedCount += 1;
      }
    }

    const log = await prisma.outboundSms.create({
      data: {
        creatorAccountId,
        audienceType: SmsAudienceType.DANCER_TIER,
        audienceKey: tier,
        targetType: SmsTargetType.DANCER_CUSTOMER,
        body: text,
        toCount: customers.length,
        successCount,
        failedCount,
        provider: "twilio",
        sentAt: new Date(),
        errorSummary:
          failedCount > 0
            ? `Failed for ${failedCount} of ${customers.length}`
            : null,
      },
    });

    return NextResponse.json({
      ok: true,
      toCount: customers.length,
      successCount,
      failedCount,
      logId: log.id,
    });
  } catch (error) {
    console.error("[sms.dancers.broadcast]", error);
    const message =
      error instanceof Error ? error.message : "Failed to send SMS broadcast";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

