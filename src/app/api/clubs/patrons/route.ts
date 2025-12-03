import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { z } from "zod";
import { ClubVipStatus, CreatorPlatform } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveAccountId } from "@/lib/accounts";
import {
  getClubActivityStatus,
  getRecommendedVipStatus,
  hasUpcomingBirthday,
} from "@/lib/clubSegments";

const VipStatusSchema = z.enum([
  "NONE",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
]);

const PatronCreateSchema = z.object({
  creatorAccountId: z.string(),
  displayName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  telegramHandle: z.string().optional(),
  instagramHandle: z.string().optional(),
  totalSpendCents: z.number().int().nonnegative().optional(),
  visitsCount: z.number().int().nonnegative().optional(),
  lastVisitAt: z.string().datetime().optional(),
  vipStatus: VipStatusSchema.optional(),
  birthday: z.string().datetime().optional(),
  preferredNights: z.string().optional(),
  preferredDancer: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const creatorAccountId = await resolveAccountId(
    userId,
    CreatorPlatform.CLUB,
    url.searchParams.get("creatorAccountId"),
  );

  const patrons = await prisma.clubPatron.findMany({
    where: { creatorAccountId },
    orderBy: [
      { vipStatus: "desc" },
      { totalSpendCents: "desc" },
      { updatedAt: "desc" },
    ],
  });

  const enriched = patrons.map((patron) => {
    const recommendedVipStatus = getRecommendedVipStatus({
      totalSpendCents: patron.totalSpendCents,
      visitsCount: patron.visitsCount,
      lastVisitAt: patron.lastVisitAt ?? undefined,
      vipStatus: patron.vipStatus,
      birthday: patron.birthday ?? undefined,
    });

    const activityStatus = getClubActivityStatus({
      totalSpendCents: patron.totalSpendCents,
      visitsCount: patron.visitsCount,
      lastVisitAt: patron.lastVisitAt ?? undefined,
    });

    const upcomingBirthday = hasUpcomingBirthday({
      totalSpendCents: patron.totalSpendCents,
      visitsCount: patron.visitsCount,
      lastVisitAt: patron.lastVisitAt ?? undefined,
      birthday: patron.birthday ?? undefined,
    });

    return {
      ...patron,
      recommendedVipStatus,
      activityStatus,
      upcomingBirthday,
    };
  });

  return NextResponse.json({ creatorAccountId, patrons: enriched });
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const data = PatronCreateSchema.parse(payload);

    const creatorAccount = await prisma.creatorAccount.findFirst({
      where: { id: data.creatorAccountId, userId },
      select: { id: true },
    });
    if (!creatorAccount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const patron = await prisma.clubPatron.create({
      data: {
        creatorAccountId: data.creatorAccountId,
        displayName: data.displayName.trim(),
        phone: data.phone?.trim(),
        email: data.email?.trim(),
        telegramHandle: data.telegramHandle?.trim(),
        instagramHandle: data.instagramHandle?.trim(),
        totalSpendCents: data.totalSpendCents ?? 0,
        visitsCount: data.visitsCount ?? 0,
        lastVisitAt: data.lastVisitAt ? new Date(data.lastVisitAt) : null,
        vipStatus: data.vipStatus ?? ClubVipStatus.NONE,
        birthday: data.birthday ? new Date(data.birthday) : null,
        preferredNights: data.preferredNights?.trim(),
        preferredDancer: data.preferredDancer?.trim(),
        notes: data.notes?.trim(),
      },
    });

    return NextResponse.json({ patron });
  } catch (error) {
    console.error("[clubs.patrons]", error);
    const message =
      error instanceof Error ? error.message : "Failed to create patron";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

