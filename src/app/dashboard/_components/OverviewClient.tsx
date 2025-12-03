"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  DollarSign,
  Sparkles,
  Clock,
  Ghost,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { SegmentKey } from "@/lib/segments";

type SegmentSummary = {
  key: SegmentKey;
  label: string;
  description: string;
  count: number;
};

type SegmentResponse = {
  totalFans: number;
  segments: SegmentSummary[];
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  total: Users,
  whales: DollarSign,
  new: Sparkles,
  expiring: Clock,
  ghosts: Ghost,
  active: TrendingUp,
};

export default function OverviewClient() {
  const [data, setData] = useState<SegmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/segments/summary")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Unable to load fans");
        }
        return res.json();
      })
      .then((json) => {
        if (!mounted) return;
        setData(json);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const segmentMap = useMemo(() => {
    const map = new Map<SegmentKey, SegmentSummary>();
    data?.segments.forEach((segment) => map.set(segment.key, segment));
    return map;
  }, [data]);

  const totalFans = data?.totalFans ?? 0;
  const whales = segmentMap.get("WHALE")?.count ?? 0;
  const newSubs = segmentMap.get("NEW")?.count ?? 0;
  const expiring = segmentMap.get("EXPIRING")?.count ?? 0;
  const ghosts = segmentMap.get("GHOST")?.count ?? 0;

  const priorities = buildPriorities({
    whales,
    expiring,
    ghosts,
    totalFans,
  });

  return (
    <div className="space-y-8">
      {error && (
        <Card className="border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          loading={loading}
          label="Total fans"
          value={totalFans}
          helper="Across all segments"
          Icon={ICONS.total}
        />
        <StatCard
          loading={loading}
          label="Whales"
          value={whales}
          helper="≥ $500 lifetime"
          Icon={ICONS.whales}
        />
        <StatCard
          loading={loading}
          label="New subs"
          value={newSubs}
          helper="Joined in last 7 days"
          Icon={ICONS.new}
        />
        <StatCard
          loading={loading}
          label="Expiring"
          value={expiring}
          helper="Rebill in < 3 days"
          Icon={ICONS.expiring}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-silver/60">
                Segment snapshot
              </p>
              <h2 className="font-heading text-xl font-semibold text-white">
                Where your attention is needed
              </h2>
            </div>
            <Link href="/dashboard/segments">
              <Button variant="secondary" size="sm">
                View segments
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {loading && !priorities.length && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="h-3 w-24 rounded bg-white/10" />
                    <div className="mt-2 h-3 w-full rounded bg-white/5" />
                  </div>
                ))}
              </div>
            )}
            {priorities.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-magenta/30"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-silver/70">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-silver">{item.detail}</p>
                <div className="mt-4 flex justify-end">
                  {item.href ? (
                    <Link href={item.href}>
                      <Button size="sm" variant="secondary">
                        {item.cta}
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" variant="secondary" disabled>
                      {item.cta}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!loading && !priorities.length && (
              <p className="text-sm text-silver/70">
                Segments look healthy. Keep an eye on your expiring and ghost
                fans to stay ahead of churn.
              </p>
            )}
          </div>
        </Card>

        <Card className="bg-gradient-to-b from-magenta/15 via-card to-midnight-alt">
          <h3 className="font-heading text-lg font-semibold text-white">
            Live stats
          </h3>
          <p className="mt-2 text-sm text-silver/70">
            Pulled from your latest fan sync.
          </p>
          <div className="mt-6 space-y-3 text-sm text-silver/90">
            <LiveRow
              label="Expiring rebills"
              value={expiring}
              loading={loading}
            />
            <LiveRow
              label="Ghosts (30d+)"
              value={ghosts}
              loading={loading}
            />
            <LiveRow
              label="New subs (7d)"
              value={newSubs}
              loading={loading}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function buildPriorities({
  whales,
  expiring,
  ghosts,
}: {
  whales: number;
  expiring: number;
  ghosts: number;
  totalFans: number;
}) {
  const items: {
    title: string;
    detail: string;
    cta: string;
    href?: string;
  }[] = [];

  if (whales > 0) {
    items.push({
      title: "Whales",
      detail: `${whales} whales haven’t had a touchpoint in a while. Send them something special.`,
      cta: "Message whales",
      href: "/dashboard/campaigns/new?segment=WHALE",
    });
  }
  if (expiring > 0) {
    items.push({
      title: "Expiring",
      detail: `${expiring} fans will rebill soon. Queue a save script to lock them in.`,
      cta: "Send save campaign",
      href: "/dashboard/campaigns/new?segment=EXPIRING",
    });
  }
  if (ghosts > 0) {
    items.push({
      title: "Ghosts",
      detail: `${ghosts} fans have gone silent for 30+ days. Try a recovery script.`,
      cta: "Recover ghosts",
      href: "/dashboard/campaigns/new?segment=GHOST",
    });
  }

  return items.slice(0, 3);
}

function StatCard({
  loading,
  label,
  value,
  helper,
  Icon,
}: {
  loading: boolean;
  label: string;
  value: number;
  helper: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card padding="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-silver/60">
          {label}
        </p>
        <Icon className="h-4 w-4 text-silver/60" />
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-white/10" />
      ) : (
        <p className="mt-3 font-heading text-2xl font-bold text-white">
          {value}
        </p>
      )}
      <p className="text-xs text-silver/60">{helper}</p>
    </Card>
  );
}

function LiveRow({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      {loading ? (
        <span className="h-4 w-10 animate-pulse rounded bg-white/10" />
      ) : (
        <span className="font-heading text-white">{value}</span>
      )}
    </div>
  );
}

