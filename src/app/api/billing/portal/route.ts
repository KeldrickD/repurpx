import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await prisma.creatorAccount.findFirst({
    where: { userId },
    select: { id: true, stripeCustomerId: true },
  });

  if (!creator?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing information found." },
      { status: 400 },
    );
  }

  const sessionStripe = await stripe.billingPortal.sessions.create({
    customer: creator.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: sessionStripe.url });
}

