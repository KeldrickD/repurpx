import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { z } from "zod";
import { ClubVipStatus, CreatorPlatform } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveAccountId } from "@/lib/accounts";

const ImportRowSchema = z.object({
  displayName: z.string().min(1),
  phone: z.string().optional(),
  vipStatus: z.nativeEnum(ClubVipStatus).optional(),
  totalSpendCents: z.number().int().nonnegative().optional(),
  visitsCount: z.number().int().nonnegative().optional(),
  lastVisitAt: z.string().datetime().optional(),
  birthday: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const ImportSchema = z.object({
  creatorAccountId: z.string().optional(),
  rows: z.array(ImportRowSchema).min(1),
});

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const data = ImportSchema.parse(payload);

    const creatorAccountId = await resolveAccountId(
      userId,
      CreatorPlatform.CLUB,
      data.creatorAccountId,
    );

    const prepared = data.rows.map((row) => ({
      creatorAccountId,
      displayName: row.displayName.trim(),
      phone: row.phone?.trim() || null,
      vipStatus: row.vipStatus ?? ClubVipStatus.NONE,
      totalSpendCents: row.totalSpendCents ?? 0,
      visitsCount: row.visitsCount ?? 0,
      lastVisitAt: row.lastVisitAt ? new Date(row.lastVisitAt) : null,
      birthday: row.birthday ? new Date(row.birthday) : null,
      notes: row.notes?.trim() || null,
    }));

    const result = await prisma.clubPatron.createMany({
      data: prepared,
    });

    return NextResponse.json({ imported: result.count });
  } catch (error) {
    console.error("[clubs.patrons.import]", error);
    const message =
      error instanceof Error ? error.message : "Failed to import patrons";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

