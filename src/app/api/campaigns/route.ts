import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { creatorAccountId, name, segmentFilter, messageBody, sendAt } = await req.json();

    if (!creatorAccountId || !name || !messageBody) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        creatorAccountId,
        userId,
        name,
        segmentFilter,
        messageBody,
        status: sendAt ? "scheduled" : "draft",
        sendAt,
      },
    });

    // For now we don't resolve actual fans; this is where fan matching would occur.
    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Campaign create error", error);
    return NextResponse.json({ error: "Unable to create campaign." }, { status: 500 });
  }
}

