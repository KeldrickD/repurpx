"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "CREATOR" | "DANCER" | "CLUB";

export type NudgeStats = {
  atRisk?: number;
  cold?: number;
  birthdaysThisWeek?: number;
  smsUsed?: number;
  smsLimit?: number;
  whales?: number;
  ghosts?: number;
};

type NudgeContent = {
  title: string;
  body: string;
  bullets: string[];
  primaryCtaLabel?: string;
  primaryCtaAction?: () => void;
  secondaryCtaLabel?: string;
  secondaryCtaAction?: () => void;
};

type Props = {
  role: Role;
  stats?: NudgeStats;
};

export function OnboardingNudge({ role, stats }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const storageKey = `rx-onboarding-nudge-${role.toLowerCase()}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(storageKey);
    if (!dismissed) {
      setVisible(true);
    }
  }, [storageKey]);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, "dismissed");
    }
    setVisible(false);
  };

  if (!visible) return null;

  const {
    title,
    body,
    bullets,
    primaryCtaLabel,
    primaryCtaAction,
    secondaryCtaLabel,
    secondaryCtaAction,
  } = getContentForRole(role, router, stats);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-fuchsia-500/10 via-black to-indigo-500/10 p-4 shadow-lg shadow-black/50">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-200">
            You&apos;re all set — here&apos;s your next move
          </p>
          <h2 className="text-sm font-semibold text-slate-50">{title}</h2>
          <p className="text-xs text-slate-200">{body}</p>
          {bullets.length > 0 && (
            <ul className="mt-1 space-y-1 text-[11px] text-slate-300">
              {bullets.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <div className="flex flex-wrap gap-2">
            {primaryCtaLabel && primaryCtaAction && (
              <button
                type="button"
                onClick={primaryCtaAction}
                className="rounded-full bg-white px-4 py-2 text-[11px] font-semibold text-black shadow hover:bg-slate-100"
              >
                {primaryCtaLabel}
              </button>
            )}
            {secondaryCtaLabel && secondaryCtaAction && (
              <button
                type="button"
                onClick={secondaryCtaAction}
                className="rounded-full border border-white/30 px-4 py-2 text-[11px] text-slate-100 hover:bg-white/5"
              >
                {secondaryCtaLabel}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-[10px] text-slate-400 hover:text-slate-200"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function getContentForRole(
  role: Role,
  router: ReturnType<typeof useRouter>,
  stats?: NudgeStats,
): NudgeContent {
  if (role === "DANCER") {
    const atRisk = stats?.atRisk ?? 0;
    const cold = stats?.cold ?? 0;
    const smsUsed = stats?.smsUsed;
    const smsLimit = stats?.smsLimit;

    const bullets: string[] = [];

    if (atRisk || cold) {
      bullets.push(
        `You’ve got ${atRisk} at-risk and ${cold} cold regulars you can warm back up with one text.`,
      );
    } else {
      bullets.push("Even a small list of regulars can turn into steady money.");
    }

    if (smsUsed !== undefined && smsLimit !== undefined) {
      bullets.push(`You’ve used ${smsUsed}/${smsLimit} SMS on your current plan.`);
    }

    bullets.push(
      "Use the quick templates in “Message your VIPs” to send your next text in seconds.",
    );

    return {
      title: "Nice first blast. Now, talk to your best regulars.",
      body:
        "Your VIP list is live. Use the Dancer CRM to keep whales warm and bring back people who haven’t pulled up in a while.",
      bullets,
      primaryCtaLabel: "Open Dancer CRM",
      primaryCtaAction: () => router.push("/dashboard/dancer/customers"),
      secondaryCtaLabel: "View SMS activity",
      secondaryCtaAction: () => router.push("/dashboard/messaging/logs"),
    };
  }

  if (role === "CLUB") {
    const atRisk = stats?.atRisk ?? 0;
    const cold = stats?.cold ?? 0;
    const birthdays = stats?.birthdaysThisWeek ?? 0;
    const smsUsed = stats?.smsUsed;
    const smsLimit = stats?.smsLimit;

    const bullets: string[] = [];

    if (atRisk || cold) {
      bullets.push(
        `You’ve got ${atRisk} at-risk and ${cold} cold VIPs you can warm back up with one text.`,
      );
    } else {
      bullets.push("Even a few warm VIPs can turn a slow night into a stack.");
    }

    if (birthdays) {
      bullets.push(
        `${birthdays} VIP${birthdays === 1 ? "" : "s"} have birthdays this week — perfect excuse to invite them out.`,
      );
    }

    if (smsUsed !== undefined && smsLimit !== undefined) {
      bullets.push(`You’ve used ${smsUsed}/${smsLimit} SMS on your current plan.`);
    }

    return {
      title: "Fill tables with birthdays and at-risk VIPs.",
      body:
        "Your Club CRM is tracking who spends, who’s going cold, and whose birthday is coming up. A couple of targeted texts can turn a slow night into a busy one.",
      bullets,
      primaryCtaLabel: "Go to Club CRM",
      primaryCtaAction: () => router.push("/dashboard/club/patrons"),
      secondaryCtaLabel: "View SMS history",
      secondaryCtaAction: () => router.push("/dashboard/messaging/logs"),
    };
  }

  const whales = stats?.whales ?? 0;
  const ghosts = stats?.ghosts ?? 0;
  const smsUsed = stats?.smsUsed;
  const smsLimit = stats?.smsLimit;

  const bullets: string[] = [];

  if (whales || ghosts) {
    bullets.push(
      `You’ve got ${whales} whales and ${ghosts} ghosts sitting in your fanbase right now.`,
    );
  } else {
    bullets.push("Even a small list of fans can turn into consistent paydays.");
  }

  bullets.push(
    "Creators who consistently ping whales and win back ghosts make way more than those who just post and hope.",
  );

  if (smsUsed !== undefined && smsLimit !== undefined) {
    bullets.push(`You’ve used ${smsUsed}/${smsLimit} SMS on your current plan.`);
  }

  return {
    title: "You’ve messaged your whales. Next up: win-backs.",
    body:
      "Your fan segments are ready. Instead of blasting everyone the same way, hit whales and ghosts with different offers.",
    bullets,
    primaryCtaLabel: "Open Segments",
    primaryCtaAction: () => router.push("/dashboard/segments"),
    secondaryCtaLabel: "Create win-back campaign",
    secondaryCtaAction: () =>
      router.push("/dashboard/campaigns/new?segment=GHOSTS"),
  };
}


