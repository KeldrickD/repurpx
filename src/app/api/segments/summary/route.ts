import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  SEGMENT_CONFIG,
  getSegmentForFan,
  type SegmentKey,
} from "@/lib/segments";

type FanPreview = {
  id: string;
  name: string;
  username: string | null;
  lifetimeSpend: number;
  lastMessageAt: Date | null;
};

type SegmentSummary = {
  key: SegmentKey;
  label: string;
  description: string;
  threshold?: string;
  count: number;
  fans: FanPreview[];
};

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const creatorAccountIdParam = url.searchParams.get("creatorAccountId");

    const creatorAccount =
      creatorAccountIdParam ||
      (
        await prisma.creatorAccount.findFirst({
          where: { userId },
          select: { id: true },
        })
      )?.id;

    if (!creatorAccount) {
      return NextResponse.json(
        { error: "No creator account found" },
        { status: 404 },
      );
    }

    const fans = await prisma.fan.findMany({
      where: { creatorAccountId: creatorAccount },
      select: {
        id: true,
        username: true,
        displayName: true,
        lifetimeSpend: true,
        lastMessageAt: true,
        joinedAt: true,
        rebillDate: true,
        createdAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const summaries: Record<SegmentKey, SegmentSummary> = Object.keys(
      SEGMENT_CONFIG,
    ).reduce((acc, key) => {
      const typedKey = key as SegmentKey;
      const config = SEGMENT_CONFIG[typedKey];
      acc[typedKey] = {
        key: typedKey,
        label: config.label,
        description: config.description,
        threshold: config.threshold,
        count: 0,
        fans: [],
      };
      return acc;
    }, {} as Record<SegmentKey, SegmentSummary>);

    fans.forEach((fan) => {
      const segment = getSegmentForFan(fan);
      const preview: FanPreview = {
        id: fan.id,
        name: fan.displayName ?? fan.username ?? "Unnamed fan",
        username: fan.username,
        lifetimeSpend: Number(fan.lifetimeSpend ?? 0),
        lastMessageAt: fan.lastMessageAt,
      };
      summaries[segment].count += 1;
      if (summaries[segment].fans.length < 6) {
        summaries[segment].fans.push(preview);
      }
    });

    return NextResponse.json({
      creatorAccountId: creatorAccount,
      totalFans: fans.length,
      segments: Object.values(summaries),
    });
  } catch (error) {
    console.error("[segments.summary]", error);
    return NextResponse.json(
      { error: "Unable to load segments" },
      { status: 500 },
    );
  }
}

