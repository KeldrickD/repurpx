import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import {
  DancerCustomerTier,
  TelegramChannelKind,
} from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

const BroadcastSchema = z.object({
  creatorAccountId: z.string(),
  tier: z.enum(["WHALE", "REGULAR", "OCCASIONAL", "TEST"]),
  text: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const { creatorAccountId, tier, text } = BroadcastSchema.parse(json);

    const creatorAccount = await prisma.creatorAccount.findFirst({
      where: { id: creatorAccountId, userId },
      select: { id: true },
    });
    if (!creatorAccount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const channel = await prisma.telegramChannel.findFirst({
      where: {
        creatorAccountId,
        kind: TelegramChannelKind.DANCER_TIER,
        dancerTier: tier as DancerCustomerTier,
      },
    });

    if (!channel) {
      return NextResponse.json(
        { error: `No Telegram channel configured for ${tier}` },
        { status: 400 },
      );
    }

    await sendTelegramMessage(channel.chatId, text);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[telegram.dancerBroadcast]", error);
    const message =
      error instanceof Error ? error.message : "Failed to send Telegram message.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

