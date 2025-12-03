import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await prisma.waitlistEntry.upsert({
      where: { email },
      update: { source },
      create: { email, source },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist error", error);
    return NextResponse.json({ error: "Unable to join waitlist." }, { status: 500 });
  }
}

