import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import type { FanSegment } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

const BroadcastSchema = z.object({
  creatorAccountId: z.string().optional(),
  segment: z.enum(["WHALE", "MID", "LOW", "NEW", "EXPIRING", "GHOST", "CUSTOM"]),
  text: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { creatorAccountId, segment, text } = BroadcastSchema.parse(payload);

    const accountId = await resolveCreatorAccountId(userId, creatorAccountId);
    if (!accountId) {
      return NextResponse.json({ error: "Creator account not found" }, { status: 404 });
    }

    const channel = await prisma.telegramChannel.findFirst({
      where: {
        creatorAccountId: accountId,
        segment: resolveSegmentValue(segment),
      },
    });

    if (!channel) {
      return NextResponse.json(
        { error: `No Telegram channel configured for ${segment}` },
        { status: 400 },
      );
    }

    await sendTelegramMessage(channel.chatId, text);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[telegram.broadcast]", error);
    const message = error instanceof Error ? error.message : "Failed to send Telegram message.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function resolveCreatorAccountId(userId: string, accountId?: string | null) {
  if (accountId) {
    const creatorAccount = await prisma.creatorAccount.findFirst({
      where: { id: accountId, userId },
      select: { id: true },
    });
    if (creatorAccount) return creatorAccount.id;
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

