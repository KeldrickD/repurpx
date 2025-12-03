import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { AccountRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpdateSchema = z.object({
  primaryRole: z.enum(["CREATOR", "DANCER", "CLUB"]),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: true,
      primaryRole: true,
      hasCompletedOnboarding: true,
      creatorAccounts: {
        select: {
          id: true,
          platform: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    userId,
    roles: user.roles ?? [],
    primaryRole: user.primaryRole,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
    accounts: user.creatorAccounts ?? [],
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();
  const parsed = UpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const roles = user.roles ?? [];
  if (!roles.includes(parsed.data.primaryRole as AccountRole)) {
    return NextResponse.json(
      { error: "Role not enabled for this account." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { primaryRole: parsed.data.primaryRole as AccountRole },
  });

  return NextResponse.json({ success: true });
}

