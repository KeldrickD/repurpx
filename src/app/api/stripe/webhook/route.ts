import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/billing";
import type Stripe from "stripe";
import { BillingPlan } from "@prisma/client";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? "",
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const creatorAccountId = sub.metadata?.creatorAccountId as
        | string
        | undefined;
      const planKey =
        (sub.items.data[0]?.price?.metadata?.plan_key as BillingPlan | undefined) ??
        "FREE";

      if (!creatorAccountId) break;

      const limits = PLAN_LIMITS[planKey];

      await prisma.creatorAccount.update({
        where: { id: creatorAccountId },
        data: {
          billingPlan: planKey,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer as string,
          monthlySmsLimit: limits.monthlySmsLimit,
          smsUsedThisPeriod: 0,
          smsPeriodStart: new Date(),
        },
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const creatorAccountId = sub.metadata?.creatorAccountId as
        | string
        | undefined;

      if (!creatorAccountId) break;

      await prisma.creatorAccount.update({
        where: { id: creatorAccountId },
        data: {
          billingPlan: "FREE",
          stripeSubscriptionId: null,
          monthlySmsLimit: PLAN_LIMITS.FREE.monthlySmsLimit,
          smsUsedThisPeriod: 0,
          smsPeriodStart: new Date(),
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}

