import { randomUUID } from "crypto";
import { CreatorPlatform } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PLATFORM_LABELS: Record<CreatorPlatform, string> = {
  ONLYFANS: "Creator workspace",
  DANCER: "Dancer CRM",
  CLUB: "Club CRM",
};

export async function ensureCreatorAccount(
  userId: string,
  platform: CreatorPlatform,
) {
  const existing = await prisma.creatorAccount.findFirst({
    where: { userId, platform },
    select: { id: true },
  });

  if (existing?.id) {
    return existing.id;
  }

  const account = await prisma.creatorAccount.create({
    data: {
      userId,
      platform,
      platformUserId: randomUUID(),
      displayName: PLATFORM_LABELS[platform],
    },
    select: { id: true },
  });

  return account.id;
}

export async function resolveAccountId(
  userId: string,
  platform: CreatorPlatform,
  requestedId?: string | null,
) {
  if (requestedId) {
    const account = await prisma.creatorAccount.findFirst({
      where: { id: requestedId, userId, platform },
      select: { id: true },
    });
    if (account?.id) return account.id;
  }

  return ensureCreatorAccount(userId, platform);
}

