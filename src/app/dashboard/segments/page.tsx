"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Ghost,
  DollarSign,
  Clock,
  Sparkles,
  Users,
  Mail,
} from "lucide-react";
import type { SegmentKey } from "@/lib/segments";
import {
  OnboardingNudge,
  type NudgeStats,
} from "@/components/dashboard/OnboardingNudge";

interface SegmentResponse {
  creatorAccountId: string;
  totalFans: number;
  segments: Array<{
    key: SegmentKey;
    label: string;
    description: string;
    threshold?: string;
    count: number;
    fans: Array<{
      id: string;
      name: string;
      username: string | null;
      lifetimeSpend: number;
      lastMessageAt: string | null;
    }>;
  }>;
}

const RECOMMENDATION_MAP: Record<SegmentKey, string> = {
  WHALE: "Best for premium drops",
  MID: "Nurture spenders",
  LOW: "Increase conversion",
  NEW: "Welcome gifts",
  EXPIRING: "Prevent churn",
  GHOST: "Win-back opportunity",
};

const ICON_MAP: Record<SegmentKey, ComponentType<{ className?: string }>> = {
  WHALE: DollarSign,
  MID: Users,
  LOW: Mail,
  NEW: Sparkles,
  EXPIRING: Clock,
  GHOST: Ghost,
};

export default function SegmentsPage() {
  const [data, setData] = useState<SegmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<SegmentKey | null>(null);
  const [usage, setUsage] = useState<{ smsUsed: number; smsLimit: number } | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/api/segments/summary")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to load segments");
        }
        return res.json();
      })
      .then((json: SegmentResponse) => {
        if (!mounted) return;
        setData(json);
        // Do not auto-select first segment
        setError(null);
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

  useEffect(() => {
    let cancelled = false;
    const loadUsage = async () => {
      try {
        const res = await fetch("/api/billing/usage", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setUsage({
            smsUsed: json.smsUsed ?? 0,
            smsLimit: json.monthlySmsLimit ?? json.smsLimit ?? 0,
          });
        }
      } catch (err) {
        console.warn("Failed to load billing usage", err);
      }
    };
    loadUsage();
    return () => {
      cancelled = true;
    };
  }, []);

  const segments = useMemo(() => data?.segments ?? [], [data?.segments]);
  const selectedSegment =
    segments.find((segment) => segment.key === selectedKey) ?? segments[0];

  const stats: NudgeStats = useMemo(() => {
    const whales =
      segments.find((segment) => segment.key === "WHALE")?.count ?? 0;
    const ghosts =
      segments.find((segment) => segment.key === "GHOST")?.count ?? 0;
    return {
      whales,
      ghosts,
      smsUsed: usage?.smsUsed,
      smsLimit: usage?.smsLimit,
    };
  }, [segments, usage]);

  return (
    <div className="space-y-8">
      <OnboardingNudge role="CREATOR" stats={stats} />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-white">
            Segments — choose who to message
          </h1>
          <p className="text-sm text-silver/70">
            Every fan is auto-sorted so you always know who to talk to next.
          </p>
        </div>
        <Button variant="secondary" size="sm" disabled>
          Custom segments (soon)
        </Button>
      </div>

      {error && (
        <Card className="border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading &&
          !segments.length &&
          Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} padding="p-5" className="animate-pulse">
              <div className="h-4 w-24 rounded bg-white/10" />
              <div className="mt-4 h-6 w-32 rounded bg-white/10" />
              <div className="mt-3 h-3 w-full rounded bg-white/5" />
            </Card>
          ))}

        {segments.map((segment) => {
          const Icon = ICON_MAP[segment.key];
          const isSelected = segment.key === selectedSegment?.key;
          return (
            <Card
              key={segment.key}
              hoverEffect
              padding="p-5"
              className={isSelected ? "border-magenta/50" : ""}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-lg bg-white/5 p-2 text-magenta">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-mono text-silver/70">
                  {segment.count} fans
                </span>
              </div>
              <h3 className="font-heading text-lg font-semibold">
                {segment.label}
              </h3>
              <p className="mt-1 text-xs font-medium text-magenta/80">
                {RECOMMENDATION_MAP[segment.key]}
              </p>
              <p className="mt-1 text-[11px] text-silver/50">
                {segment.threshold ?? segment.description}
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/dashboard/campaigns/new?segment=${segment.key}`}
                  className="flex-1"
                >
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={!segment.count}
                  >
                    Message
                  </Button>
                </Link>
                <Button
                  variant={isSelected ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedKey(segment.key)}
                >
                  {isSelected ? "Viewing" : "View fans"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        {!selectedKey ? (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-white/10" />
            <h2 className="text-lg font-semibold text-white">
              Select a segment above to see fans
            </h2>
            <p className="text-sm text-silver/60">
              Choose a group to see individual fan details and history.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold text-white">
                  {selectedSegment?.label ?? "Segment fans"}
                </h2>
                <p className="text-sm text-silver/70">
                  {selectedSegment?.description ??
                    "Select a segment to preview matching fans."}
                </p>
              </div>
              <div className="text-right text-xs text-silver/60">
                {selectedSegment?.count ?? 0} of {data?.totalFans ?? 0} fans
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-silver/60">
                  <tr>
                    <th className="py-3 font-medium">Fan</th>
                    <th className="py-3 font-medium">Lifetime spend</th>
                    <th className="py-3 font-medium">Last message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {selectedSegment?.fans?.length ? (
                    selectedSegment.fans.map((fan) => (
                      <tr key={fan.id} className="hover:bg-white/5">
                        <td className="py-4">
                          <p className="font-medium text-white">{fan.name}</p>
                          {fan.username && (
                            <p className="text-xs text-silver/70">
                              @{fan.username}
                            </p>
                          )}
                        </td>
                        <td className="py-4 font-mono text-silver">
                          ${fan.lifetimeSpend.toFixed(2)}
                        </td>
                        <td className="py-4 text-silver/80">
                          {fan.lastMessageAt
                            ? new Date(fan.lastMessageAt).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-silver/60">
                        {loading
                          ? "Loading fans..."
                          : "Fans will appear here as soon as data is synced or imported."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

