import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// @ts-expect-error - NextJS page component types
export default async function CheckoutPage(props) {
  const { searchParams } = props
  const session = await getServerSession()
  if (!session?.user) {
    redirect('/signin')
  }

  const plan = searchParams.plan as string
  if (!plan) {
    redirect('/pricing')
  }

  // Get or create Stripe customer
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { subscription: true },
  })

  if (!user) {
    redirect('/signin')
  }

  let stripeCustomerId = user.subscription?.stripeCustomerId

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: {
        userId: user.id,
      },
    })
    stripeCustomerId = customer.id

    // Create or update subscription record
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stripeCustomerId: customer.id,
        plan,
        status: 'incomplete',
      },
      update: {
        stripeCustomerId: customer.id,
        plan,
        status: 'incomplete',
      },
    })
  }

  // Create Stripe Checkout Session
  const priceId = {
    basic: process.env.STRIPE_BASIC_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
    agency: process.env.STRIPE_AGENCY_PRICE_ID,
  }[plan]

  if (!priceId) {
    throw new Error('Invalid plan selected')
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    subscription_data: {
      metadata: {
        userId: user.id,
      },
    },
  })

  if (!checkoutSession.url) {
    throw new Error('Failed to create checkout session')
  }

  redirect(checkoutSession.url)
} 