import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import type { SegmentKey } from "@/lib/segments";
import { CreatorPlatform } from "@prisma/client";
import { resolveAccountId } from "@/lib/accounts";

const segmentInput = z.enum([
  "WHALE",
  "MID",
  "LOW",
  "NEW",
  "EXPIRING",
  "GHOST",
  "CUSTOM",
]);

const TemplateCreateSchema = z.object({
  creatorAccountId: z.string().optional(),
  name: z.string().min(1),
  segment: segmentInput,
  body: z.string().min(1),
  isDefault: z.boolean().optional(),
});

type SessionUser = { id: string };

async function resolveCreatorAccount(
  user: SessionUser,
  creatorAccountId?: string | null,
) {
  return resolveAccountId(user.id, CreatorPlatform.ONLYFANS, creatorAccountId);
}

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const creatorAccountIdParam = url.searchParams.get("creatorAccountId");
  const creatorAccountId = await resolveCreatorAccount(
    { id: userId },
    creatorAccountIdParam,
  );

  if (!creatorAccountId) {
    return NextResponse.json(
      { error: "No creator account found" },
      { status: 404 },
    );
  }

  const templates = await prisma.template.findMany({
    where: {
      OR: [
        { creatorAccountId },
        { creatorAccountId: null, isDefault: true },
      ],
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ creatorAccountId, templates });
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const data = TemplateCreateSchema.parse(payload);

    const creatorAccountId = await resolveCreatorAccount(
      { id: userId },
      data.creatorAccountId,
    );

    if (!creatorAccountId) {
      return NextResponse.json(
        { error: "No creator account found" },
        { status: 404 },
      );
    }

    const template = await prisma.template.create({
      data: {
        creatorAccountId,
        name: data.name,
        segment: data.segment === "CUSTOM" ? null : (data.segment as SegmentKey),
        body: data.body,
        isDefault: false,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("[templates.POST]", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 400 },
    );
  }
}

