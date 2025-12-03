import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import type { Session } from "next-auth";
import type { FanSegment } from "@prisma/client";
import { TelegramChannelKind } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpsertSchema = z.object({
  creatorAccountId: z.string().optional(),
  segment: z.enum(["WHALE", "MID", "LOW", "NEW", "EXPIRING", "GHOST", "CUSTOM"]),
  chatId: z.string().min(1),
  title: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const creatorAccountId = url.searchParams.get("creatorAccountId");

  const accountId = await resolveCreatorAccountId(userId, creatorAccountId);
  if (!accountId) {
    return NextResponse.json({ error: "No creator account found" }, { status: 404 });
  }

  const channels = await prisma.telegramChannel.findMany({
    where: {
      creatorAccountId: accountId,
      kind: TelegramChannelKind.CREATOR_SEGMENT,
    },
    orderBy: { segment: "asc" },
  });

  return NextResponse.json({ creatorAccountId: accountId, channels });
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const data = UpsertSchema.parse(payload);

    const accountId = await resolveCreatorAccountId(userId, data.creatorAccountId);
    if (!accountId) {
      return NextResponse.json({ error: "No creator account found" }, { status: 404 });
    }

    const segmentValue = resolveSegmentValue(data.segment);

    const existingChannel = await prisma.telegramChannel.findFirst({
      where: {
        creatorAccountId: accountId,
        kind: TelegramChannelKind.CREATOR_SEGMENT,
        segment: segmentValue,
      },
    });

    if (existingChannel) {
      await prisma.telegramChannel.update({
        where: { id: existingChannel.id },
        data: {
          chatId: data.chatId,
          title: data.title,
        },
      });
    } else {
      await prisma.telegramChannel.create({
        data: {
          creatorAccountId: accountId,
          kind: TelegramChannelKind.CREATOR_SEGMENT,
          segment: segmentValue,
          chatId: data.chatId,
          title: data.title,
        },
      });
    }

    const channels = await prisma.telegramChannel.findMany({
      where: {
        creatorAccountId: accountId,
        kind: TelegramChannelKind.CREATOR_SEGMENT,
      },
      orderBy: { segment: "asc" },
    });

    return NextResponse.json({ creatorAccountId: accountId, channels });
  } catch (error) {
    console.error("[telegram.channels]", error);
    const message = error instanceof Error ? error.message : "Failed to save Telegram channel.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function resolveCreatorAccountId(userId: string, requestId?: string | null) {
  if (requestId) {
    const account = await prisma.creatorAccount.findFirst({
      where: { id: requestId, userId },
      select: { id: true },
    });
    if (account) return account.id;
  }

  const fallback = await prisma.creatorAccount.findFirst({
    where: { userId },
    select: { id: true },
  });
  return fallback?.id ?? null;
}

function resolveSegmentValue(segment: string): FanSegment | null {
  if (segment === "CUSTOM") return null;
  return segment as FanSegment;
}

