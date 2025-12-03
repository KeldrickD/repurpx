import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import {
  ClubVipStatus,
  SmsAudienceType,
  SmsTargetType,
} from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountSms } from "@/lib/sms";
import {
  getClubActivityStatus,
  hasUpcomingBirthday,
} from "@/lib/clubSegments";
import { assertCanSendSms, SmsLimitError } from "@/lib/smsLimits";

const BroadcastSchema = z.object({
  creatorAccountId: z.string(),
  vipStatus: z.enum(["NONE", "BRONZE", "SILVER", "GOLD", "PLATINUM"]),
  text: z.string().min(1),
  filter: z
    .enum(["ALL", "AT_RISK", "COLD", "BIRTHDAY_WEEK"])
    .optional(),
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
    const { creatorAccountId, vipStatus, text, filter, limit } =
      BroadcastSchema.parse(payload);

    const account = await prisma.creatorAccount.findFirst({
      where: { id: creatorAccountId, userId },
      select: { id: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const take = limit ?? 200;
    const patrons = await prisma.clubPatron.findMany({
      where: {
        creatorAccountId,
        vipStatus: vipStatus as ClubVipStatus,
        phone: { not: null },
      },
      orderBy: { totalSpendCents: "desc" },
      take: 1000, // fetch more to allow filtering before slicing
    });

    if (patrons.length === 0) {
      return NextResponse.json(
        { error: `No patrons with phone for VIP ${vipStatus}` },
        { status: 400 },
      );
    }

    const filtered = patrons.filter((patron) => {
      if (!filter || filter === "ALL") return true;

      const activityStatus = getClubActivityStatus({
        totalSpendCents: patron.totalSpendCents,
        visitsCount: patron.visitsCount,
        lastVisitAt: patron.lastVisitAt ?? undefined,
      });

      if (filter === "AT_RISK") {
        return activityStatus === "AT_RISK";
      }

      if (filter === "COLD") {
        return activityStatus === "COLD";
      }

      if (filter === "BIRTHDAY_WEEK") {
        return hasUpcomingBirthday({
          totalSpendCents: patron.totalSpendCents,
          visitsCount: patron.visitsCount,
          lastVisitAt: patron.lastVisitAt ?? undefined,
          birthday: patron.birthday ?? undefined,
        });
      }

      return true;
    });

    const targets = filtered.filter((p) => p.phone).slice(0, take);

    if (targets.length === 0) {
      return NextResponse.json(
        {
          error:
            filter === "BIRTHDAY_WEEK"
              ? "No patrons with birthdays in the configured window."
              : "No patrons matched this filter.",
        },
        { status: 400 },
      );
    }

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

    for (const patron of targets) {
      const phone = patron.phone!;
      try {
        await sendAccountSms(creatorAccountId, phone, text);
        successCount += 1;
      } catch (error) {
        console.error("Club SMS send failed", phone, error);
        failedCount += 1;
      }
    }

    const log = await prisma.outboundSms.create({
      data: {
        creatorAccountId,
        audienceType: SmsAudienceType.CLUB_VIP,
        audienceKey: `${vipStatus}:${filter ?? "ALL"}`,
        targetType: SmsTargetType.CLUB_PATRON,
        body: text,
        toCount: targets.length,
        successCount,
        failedCount,
        provider: "twilio",
        sentAt: new Date(),
        errorSummary:
          failedCount > 0
            ? `Failed for ${failedCount} of ${targets.length}`
            : null,
      },
    });

    return NextResponse.json({
      ok: true,
      toCount: targets.length,
      successCount,
      failedCount,
      logId: log.id,
    });
  } catch (error) {
    console.error("[sms.clubs.broadcast]", error);
    const message =
      error instanceof Error ? error.message : "Failed to send SMS broadcast";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

