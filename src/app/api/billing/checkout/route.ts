import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingPlan } from "@prisma/client";
import { stripe } from "@/lib/stripe";

const BodySchema = z.object({
  creatorAccountId: z.string(),
  plan: z.enum(["STARTER", "GROWTH", "CLUB"]),
});

const PLAN_TO_PRICE_ID: Record<BillingPlan, string | null> = {
  FREE: null,
  STARTER: process.env.STRIPE_PRICE_STARTER ?? null,
  GROWTH: process.env.STRIPE_PRICE_GROWTH ?? null,
  CLUB: process.env.STRIPE_PRICE_CLUB ?? null,
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { creatorAccountId, plan } = parsed.data;

  const creator = await prisma.creatorAccount.findFirst({
    where: { id: creatorAccountId, userId },
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator account not found" }, { status: 404 });
  }

  const priceId = PLAN_TO_PRICE_ID[plan as BillingPlan];
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price ID not configured for this plan." },
      { status: 400 },
    );
  }

  let stripeCustomerId = creator.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email || undefined,
      metadata: {
        userId,
        creatorAccountId,
      },
    });

    stripeCustomerId = customer.id;

    await prisma.creatorAccount.update({
      where: { id: creatorAccountId },
      data: { stripeCustomerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        creatorAccountId,
        plan,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=1`,
    metadata: {
      creatorAccountId,
      plan,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

