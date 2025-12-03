import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { creatorAccountId } = await req.json();
    if (!creatorAccountId) {
      return NextResponse.json({ error: "Missing creatorAccountId" }, { status: 400 });
    }

    // Placeholder: this would call OnlyFans API. For now we insert mock fans.
    await prisma.fan.createMany({
      data: [
        {
          creatorAccountId,
          platformFanId: "fan_1",
          username: "whale_aria",
          displayName: "Aria",
          lifetimeSpend: 750,
          segment: "WHALE",
          tags: ["top"],
        },
        {
          creatorAccountId,
          platformFanId: "fan_2",
          username: "ghost_ben",
          displayName: "Ben",
          lifetimeSpend: 20,
          segment: "GHOST",
          tags: [],
        },
      ],
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync fans error", error);
    return NextResponse.json({ error: "Unable to sync fans." }, { status: 500 });
  }
}

