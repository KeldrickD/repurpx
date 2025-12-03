import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const QuerySchema = z.object({
  creatorAccountId: z.string().optional(),
  cursor: z.string().optional(),
  take: z.coerce.number().optional(),
});

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    creatorAccountId: searchParams.get("creatorAccountId") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    take: searchParams.get("take") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { creatorAccountId, cursor, take } = parsed.data;

  const resolvedAccount = await resolveCreatorAccountId(
    userId,
    creatorAccountId,
  );
  if (!resolvedAccount) {
    return NextResponse.json({ error: "No creator account found" }, { status: 404 });
  }

  const pageSize = Math.min(
    Math.max(take ?? PAGE_SIZE_DEFAULT, 1),
    PAGE_SIZE_MAX,
  );

  const logs = await prisma.outboundSms.findMany({
    where: { creatorAccountId: resolvedAccount },
    orderBy: { createdAt: "desc" },
    take: pageSize + 1,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
  });

  let nextCursor: string | null = null;
  if (logs.length > pageSize) {
    const nextItem = logs.pop();
    nextCursor = nextItem?.id ?? null;
  }

  return NextResponse.json({
    creatorAccountId: resolvedAccount,
    logs,
    nextCursor,
  });
}

async function resolveCreatorAccountId(
  userId: string,
  requestedId?: string,
) {
  if (requestedId) {
    const account = await prisma.creatorAccount.findFirst({
      where: { id: requestedId, userId },
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

