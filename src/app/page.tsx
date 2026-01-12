import Link from "next/link";
import { ArrowRight, Check, MessageSquare, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WaitlistForm } from "@/components/WaitlistForm";

const AUDIENCE_SECTIONS = [
  {
    title: "OnlyFans / online creators",
    description: "Turn your fan list into a revenue engine. Auto-segment whales, new subs, and ghosts.",
    bullets: [
      "One-click campaigns with personalization tokens",
      "Telegram + SMS follow-ups that feel manual",
      "AI script library for upsells, rebills, reactivations",
    ],
  },
  {
    title: "Dancers & entertainers",
    description: "Keep your regulars warm. Log every whale and text your best spenders before every shift.",
    bullets: [
      "VIP CRM with spend, visits, and notes",
      "At-risk / cold alerts + 30-day inactivity flags",
      "Dedicated SMS + Telegram rails with templates",
    ],
  },
  {
    title: "Strip clubs & venues",
    description: "A VIP program that runs itself. Bring VIPs back with bottle buyers, birthdays, and event promos.",
    bullets: [
      "At-risk and cold segmentation automatically",
      "Birthday week + bottle service templates",
      "Dedicated phone numbers per location",
    ],
  },
];

const PRICING_PLANS = [
  {
    name: "Free",
    price: "$0",
    tagline: "Start with CRM + Telegram",
    includes: [
      "Fan + VIP CRM",
      "AI template library",
      "Telegram broadcasts",
      "SMS logs (read-only)",
    ],
  },
  {
    name: "Starter",
    price: "$49/mo",
    badge: "Most popular",
    tagline: "Creators & dancers adding SMS",
    includes: [
      "500 SMS credits / mo",
      "Segments + campaign builder",
      "Dancer CRM + VIP tiers",
      "Stripe billing & usage limits",
    ],
  },
  {
    name: "Club",
    price: "$199/mo",
    tagline: "Clubs & teams with VIP programs",
    includes: [
      "2,000 SMS credits / mo (upgrade anytime)",
      "Club CRM + birthdays + bottle tracking",
      "At-risk + cold filters built in",
      "Dedicated Twilio number per workspace",
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-midnight text-white">
      <nav className="sticky top-0 z-50 border-b border-border bg-midnight/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-magenta to-violet font-heading text-sm font-bold shadow-[0_0_15px_rgba(255,29,206,0.3)]">
              X
            </div>
            <span className="font-heading text-xl font-semibold tracking-tight">
              RepurpX
            </span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-silver md:flex">
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a href="#audiences" className="transition-colors hover:text-white">
              For who
            </a>
            <a href="#pricing" className="transition-colors hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition-colors hover:text-white">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="px-3 py-2 text-sm font-medium text-silver hover:text-white"
            >
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm">Start free trial</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pb-32 pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-hero-glow" />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-magenta/20 bg-magenta/5 px-3 py-1 text-xs font-medium text-magenta">
              <span className="h-1.5 w-1.5 rounded-full bg-magenta animate-pulse" />
              Built for creators. Not agencies.
            </div>
            <h1 className="font-heading text-5xl font-bold leading-[1.1] lg:text-6xl">
              Your fan list is a goldmine.
              <br />
              <span className="text-gradient">We help you tap it.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-silver">
              RepurpX is the control center for creators, dancers, and clubs. Segment
              whales, text VIPs, and fill calendars without living in your DMs.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" icon={<Zap className="h-4 w-4" />}>
                  Start free trial
                </Button>
              </Link>
              <a
                href="#pricing"
                className="flex items-center justify-center rounded-full border border-white/20 px-6 py-3.5 text-sm font-medium text-white hover:border-white/40"
              >
                View pricing <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-silver/70">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                No revenue share
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Cancel anytime
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-magenta/25 to-violet/25 blur-3xl opacity-60" />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-2xl">
              <div className="flex h-10 items-center gap-2 border-b border-border px-4">
                <span className="h-3 w-3 rounded-full bg-red-400/50" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/50" />
                <span className="h-3 w-3 rounded-full bg-green-400/50" />
              </div>
              <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-silver/60">
                      Total revenue
                    </p>
                    <p className="font-heading text-2xl font-bold">$12,450</p>
                  </div>
                  <span className="rounded-full border border-magenta/30 bg-magenta/10 px-3 py-1 text-xs font-semibold text-magenta">
                    +24% this week
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Card padding="p-4">
                    <p className="text-xs text-silver/60">Whales</p>
                    <p className="font-mono text-xl font-semibold text-magenta">
                      19
                    </p>
                  </Card>
                  <Card padding="p-4">
                    <p className="text-xs text-silver/60">New subs</p>
                    <p className="font-mono text-xl font-semibold">142</p>
                  </Card>
                </div>
                <Card padding="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet/15 text-violet">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Whale Upsell</p>
                      <p className="text-xs text-silver/70">19 fans · 45% open rate</p>
                    </div>
                    <Button size="sm" variant="secondary">
                      Send
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="audiences" className="py-24">
        <div className="mx-auto max-w-6xl space-y-10 px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-silver/60">
              Multi-role onboarding
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold">
              Pick every role that makes you money.
            </h2>
            <p className="mt-3 text-silver">
              RepurpX adapts to creators, dancers, and clubs automatically. Choose your
              roles on signup, set your primary workspace, and jump straight into the
              right dashboard.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {AUDIENCE_SECTIONS.map((audience) => (
              <Card key={audience.title} hoverEffect padding="p-6">
                <h3 className="font-heading text-xl font-semibold">{audience.title}</h3>
                <p className="mt-2 text-sm text-silver">{audience.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-silver/80">
                  {audience.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-magenta" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-border bg-surface/40 py-24">
        <div className="mx-auto max-w-6xl space-y-10 px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-silver/60">Pricing</p>
            <h2 className="mt-3 font-heading text-3xl font-bold">
              Start for free. Add SMS when you’re ready to profit.
            </h2>
            <p className="mt-3 text-silver">
              Every plan includes multi-role workspaces, segmentation, AI templates, and
              role-specific dashboards. Add SMS credits when you need them.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border bg-midnight/60 p-6 ${
                  plan.badge ? "border-magenta/40 shadow-[0_0_40px_rgba(255,29,206,0.1)]" : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-silver/60">
                      {plan.name}
                    </p>
                    <p className="font-heading text-3xl font-bold text-white">
                      {plan.price}
                    </p>
                  </div>
                  {plan.badge && (
                    <span className="rounded-full bg-magenta/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-magenta">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm text-silver/80">{plan.tagline}</p>
                <ul className="mt-5 space-y-2 text-sm text-silver/80">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-magenta" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/signup?plan=${plan.name.toLowerCase()}`}>
                  <Button className="mt-6 w-full" variant={plan.name === "Free" ? "secondary" : "primary"}>
                    {plan.name === "Free" ? "Start for free" : "Start trial"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-border bg-surface/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold">
              Your fanlist is a revenue engine.
            </h2>
            <p className="mt-4 text-silver">
              Talk to whales, new subs, ghosts, and expiring fans differently—all from one
              clean control center.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card hoverEffect>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-magenta">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl font-semibold">Auto-segmentation</h3>
              <p className="mt-3 text-sm text-silver">
                Whales, new subs, ghosts, and expiring fans—organized automatically based on
                spend, activity, and recency.
              </p>
            </Card>
            <Card hoverEffect>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-violet">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl font-semibold">Smarter mass DMs</h3>
              <p className="mt-3 text-sm text-silver">
                Launch targeted campaigns with personalization tokens like {"{first_name}"},
                {" {last_tip}"} and {"{username}"} in a single click.
              </p>
            </Card>
            <Card hoverEffect>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-blue-400">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl font-semibold">Templates that sell</h3>
              <p className="mt-3 text-sm text-silver">
                Use proven scripts for whales, rebill saves, weekend boosts, and ghost
                recoveries—or save your own.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
          <h2 className="font-heading text-4xl font-bold">
            Ready to automate every audience you own?
          </h2>
          <p className="max-w-2xl text-silver">
            Join the waitlist to unlock multi-role onboarding, role-aware dashboards, and
            early access pricing for creators, dancers, and clubs.
          </p>
          <div className="w-full max-w-xl">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-midnight-alt py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-silver/60 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-magenta to-violet font-heading text-xs font-bold">
              X
            </div>
            RepurpX
          </div>
          <p>&copy; {new Date().getFullYear()} RepurpX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

