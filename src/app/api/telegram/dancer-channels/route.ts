import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { z } from "zod";
import {
  DancerCustomerTier,
  TelegramChannelKind,
} from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TierSchema = z.enum(["WHALE", "REGULAR", "OCCASIONAL", "TEST"]);

const UpsertSchema = z.object({
  creatorAccountId: z.string(),
  dancerTier: TierSchema,
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
  const creatorAccountIdParam = url.searchParams.get("creatorAccountId");

  const accountId = await resolveDancerAccountId(
    userId,
    creatorAccountIdParam,
  );

  if (!accountId) {
    return NextResponse.json(
      { error: "No dancer account found" },
      { status: 404 },
    );
  }

  const channels = await prisma.telegramChannel.findMany({
    where: {
      creatorAccountId: accountId,
      kind: TelegramChannelKind.DANCER_TIER,
    },
    orderBy: [{ dancerTier: "asc" }, { createdAt: "asc" }],
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

    const accountId = await resolveDancerAccountId(
      userId,
      data.creatorAccountId,
    );

    if (!accountId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existingChannel = await prisma.telegramChannel.findFirst({
      where: {
        creatorAccountId: accountId,
        kind: TelegramChannelKind.DANCER_TIER,
        dancerTier: data.dancerTier as DancerCustomerTier,
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
          kind: TelegramChannelKind.DANCER_TIER,
          dancerTier: data.dancerTier as DancerCustomerTier,
          chatId: data.chatId,
          title: data.title,
        },
      });
    }

    const channels = await prisma.telegramChannel.findMany({
      where: {
        creatorAccountId: accountId,
        kind: TelegramChannelKind.DANCER_TIER,
      },
      orderBy: [{ dancerTier: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ creatorAccountId: accountId, channels });
  } catch (error) {
    console.error("[telegram.dancerChannels]", error);
    const message =
      error instanceof Error ? error.message : "Failed to save Telegram channel.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function resolveDancerAccountId(
  userId: string,
  requestId?: string | null,
) {
  if (requestId) {
    const account = await prisma.creatorAccount.findFirst({
      where: { id: requestId, userId },
      select: { id: true },
    });
    if (account?.id) return account.id;
  }

  const fallback = await prisma.creatorAccount.findFirst({
    where: { userId },
    select: { id: true },
  });
  return fallback?.id ?? null;
}

