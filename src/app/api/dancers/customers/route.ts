import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { z } from "zod";
import { CreatorPlatform, DancerCustomerTier } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getDancerActivityStatus,
  getDancerTierForCustomer,
} from "@/lib/dancerSegments";
import { resolveAccountId } from "@/lib/accounts";

const TierEnum = z.enum(["WHALE", "REGULAR", "OCCASIONAL", "TEST"]);

const CustomerCreateSchema = z.object({
  creatorAccountId: z.string().optional(),
  displayName: z.string().min(1),
  phone: z.string().optional(),
  telegramHandle: z.string().optional(),
  instagramHandle: z.string().optional(),
  totalSpendCents: z.number().int().nonnegative().optional(),
  lastVisitAt: z.string().datetime().optional(),
  lastContactAt: z.string().datetime().optional(),
  visitsCount: z.number().int().nonnegative().optional(),
  favoriteNights: z.string().optional(),
  tier: TierEnum.optional(),
  notes: z.string().optional(),
});

type SessionUser = { id: string };

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const creatorAccountIdParam = url.searchParams.get("creatorAccountId");

  const creatorAccountId = await resolveDancerAccountId(
    { id: userId },
    creatorAccountIdParam,
  );

  if (!creatorAccountId) {
    return NextResponse.json(
      { error: "No dancer account found" },
      { status: 404 },
    );
  }

  const customers = await prisma.dancerCustomer.findMany({
    where: { creatorAccountId },
    orderBy: [{ tier: "asc" }, { totalSpendCents: "desc" }, { updatedAt: "desc" }],
  });

  const enriched = customers.map((customer) => ({
    ...customer,
    recommendedTier: getDancerTierForCustomer({
      totalSpendCents: customer.totalSpendCents,
      visitsCount: customer.visitsCount,
      lastVisitAt: customer.lastVisitAt ?? undefined,
      tier: customer.tier,
    }),
    activityStatus: getDancerActivityStatus({
      totalSpendCents: customer.totalSpendCents,
      visitsCount: customer.visitsCount,
      lastVisitAt: customer.lastVisitAt ?? undefined,
    }),
  }));

  return NextResponse.json({ creatorAccountId, customers: enriched });
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const data = CustomerCreateSchema.parse(payload);

    const creatorAccountId = await resolveDancerAccountId(
      { id: userId },
      data.creatorAccountId,
    );

    if (!creatorAccountId) {
      return NextResponse.json(
        { error: "No dancer account found" },
        { status: 404 },
      );
    }

    const customer = await prisma.dancerCustomer.create({
      data: {
        creatorAccountId,
        displayName: data.displayName.trim(),
        phone: data.phone?.trim() || null,
        telegramHandle: data.telegramHandle?.trim() || null,
        instagramHandle: data.instagramHandle?.trim() || null,
        totalSpendCents: data.totalSpendCents ?? 0,
        lastVisitAt: data.lastVisitAt ? new Date(data.lastVisitAt) : null,
        lastContactAt: data.lastContactAt ? new Date(data.lastContactAt) : null,
        visitsCount: data.visitsCount ?? 0,
        favoriteNights: data.favoriteNights?.trim() || null,
        tier: data.tier ?? DancerCustomerTier.REGULAR,
        notes: data.notes?.trim() || null,
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("[dancers.customers]", error);
    const message =
      error instanceof Error ? error.message : "Failed to save customer";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function resolveDancerAccountId(
  user: SessionUser,
  requestedId?: string | null,
) {
  return resolveAccountId(user.id, CreatorPlatform.DANCER, requestedId);
}

