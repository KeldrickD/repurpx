import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { AccountRole, CreatorPlatform, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  plan: z.string().optional(),
  roles: z
    .array(z.enum(["CREATOR", "DANCER", "CLUB"]))
    .min(1, "Select at least one role"),
  primaryRole: z.enum(["CREATOR", "DANCER", "CLUB"]),
});

const ROLE_PLATFORM_MAP: Record<AccountRole, CreatorPlatform> = {
  CREATOR: "ONLYFANS",
  DANCER: "DANCER",
  CLUB: "CLUB",
};

const ROLE_LABEL: Record<AccountRole, string> = {
  CREATOR: "Creator workspace",
  DANCER: "Dancer CRM",
  CLUB: "Club CRM",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Signup request body:", JSON.stringify(body, null, 2));

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      console.log("Signup validation error:", JSON.stringify(parsed.error.flatten(), null, 2));
      return NextResponse.json(
        { error: "Invalid signup data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, email, password, plan, roles, primaryRole } = parsed.data;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Account already exists. Try signing in." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const normalizedRoles = Array.from(new Set<AccountRole>([...roles, primaryRole]));

    const normalizedPlan =
      plan && Object.prototype.hasOwnProperty.call(SubscriptionPlan, plan.toUpperCase())
        ? (plan.toUpperCase() as SubscriptionPlan)
        : undefined;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        roles: normalizedRoles,
        primaryRole,
        subscription: plan
          ? {
            create: {
              plan: normalizedPlan ?? SubscriptionPlan.STARTER,
              status: SubscriptionStatus.active,
            },
          }
          : undefined,
      },
    });

    for (const role of normalizedRoles) {
      const platform = ROLE_PLATFORM_MAP[role];
      await prisma.creatorAccount.create({
        data: {
          userId: user.id,
          platform,
          platformUserId: randomUUID(),
          displayName:
            role === "CREATOR" && name
              ? `${name.split(" ")[0]}'s studio`
              : ROLE_LABEL[role],
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: process.env.NODE_ENV === "development"
          ? `Unable to create account: ${errorMessage}`
          : "Unable to create account."
      },
      { status: 500 }
    );
  }
}

