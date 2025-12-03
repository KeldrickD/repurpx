import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { AccountRole, CreatorPlatform } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCreatorAccount } from "@/lib/accounts";

const RoleSchema = z.object({
  roles: z.array(z.enum(["CREATOR", "DANCER", "CLUB"])).min(1),
  primaryRole: z.enum(["CREATOR", "DANCER", "CLUB"]),
});

const ROLE_PLATFORM_MAP: Record<AccountRole, CreatorPlatform> = {
  CREATOR: "ONLYFANS",
  DANCER: "DANCER",
  CLUB: "CLUB",
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = RoleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { roles, primaryRole } = parsed.data;

  if (!roles.includes(primaryRole)) {
    return NextResponse.json(
      { error: "Primary role must be one of the selected roles." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      roles,
      primaryRole,
    },
  });

  await Promise.all(
    roles.map((role) => ensureCreatorAccount(userId, ROLE_PLATFORM_MAP[role])),
  );

  return NextResponse.json({ ok: true });
}

