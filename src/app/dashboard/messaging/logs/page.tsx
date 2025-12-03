"use client";

import { useEffect, useState } from "react";

type SmsAudienceType = "DANCER_TIER" | "CLUB_VIP";
type SmsTargetType = "DANCER_CUSTOMER" | "CLUB_PATRON";

type OutboundSmsLog = {
  id: string;
  audienceType: SmsAudienceType;
  audienceKey: string;
  targetType: SmsTargetType;
  body: string;
  toCount: number;
  successCount: number;
  failedCount: number;
  provider: string | null;
  createdAt: string;
  sentAt: string | null;
  errorSummary: string | null;
};

type LogsResponse = {
  creatorAccountId?: string;
  logs?: OutboundSmsLog[];
  nextCursor?: string | null;
};

export default function SmsLogsPage() {
  const [creatorAccountId, setCreatorAccountId] = useState<string | null>(null);
  const [logs, setLogs] = useState<OutboundSmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async (cursor?: string | null) => {
    const params = new URLSearchParams();
    if (creatorAccountId) {
      params.set("creatorAccountId", creatorAccountId);
    }
    if (cursor) {
      params.set("cursor", cursor);
    }

    const res = await fetch(
      `/api/sms/logs${params.toString() ? `?${params.toString()}` : ""}`,
    );
    const json: LogsResponse & { error?: string } = await res.json();
    if (!res.ok) {
      setError(json?.error ?? "Unable to load SMS logs.");
      return;
    }

    if (json.creatorAccountId) {
      setCreatorAccountId(json.creatorAccountId);
    }

    if (cursor) {
      setLogs((prev) => [...prev, ...(json.logs ?? [])]);
    } else {
      setLogs(json.logs ?? []);
    }
    setNextCursor(json.nextCursor ?? null);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchLogs();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    if (!nextCursor) return;
    setFetchingMore(true);
    await fetchLogs(nextCursor);
    setFetchingMore(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-silver/60">
            Messaging
          </p>
          <h1 className="font-heading text-2xl font-semibold text-white">
            SMS Activity
          </h1>
          <p className="text-sm text-silver/70">
            Every dancer or club broadcast, logged with delivery stats and audience
            details.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-midnight-alt/40 p-4">
        {error && (
          <p className="mb-4 text-sm text-danger">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-silver/60">Loading messages…</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-silver/60">
            No SMS broadcasts yet. Send one from your Dancer or Club CRM to see
            it appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-silver/80">
              <thead className="text-[11px] uppercase tracking-wide text-silver/60">
                <tr>
                  <th className="py-2 pr-4">Sent at</th>
                  <th className="py-2 pr-4">Audience</th>
                  <th className="py-2 pr-4">Target</th>
                  <th className="py-2 pr-4">Message</th>
                  <th className="py-2 pr-4">Delivery</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-white/10">
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-white">
                          {new Date(log.sentAt ?? log.createdAt).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-silver/50">
                          {log.provider ?? "twilio"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1">
                        <span>{formatAudienceType(log.audienceType)}</span>
                        <span className="text-[10px] text-silver/60">
                          {log.audienceKey}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{formatTargetType(log.targetType)}</td>
                    <td className="py-3 pr-4 max-w-xl">
                      <span className="line-clamp-3 text-slate-100">{log.body}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1">
                        <span>
                          {log.successCount}/{log.toCount} delivered
                        </span>
                        {log.failedCount > 0 && (
                          <span className="text-[10px] text-amber-300">
                            {log.failedCount} failed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          log.failedCount > 0
                            ? "bg-amber-500/20 text-amber-200"
                            : "bg-emerald-500/20 text-emerald-200"
                        }`}
                      >
                        {log.failedCount > 0 ? "Partial" : "Sent"}
                      </span>
                      {log.errorSummary && (
                        <p className="mt-1 text-[10px] text-silver/60">
                          {log.errorSummary}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {nextCursor && !loading && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={loadMore}
              disabled={fetchingMore}
              className="rounded-full bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-50"
            >
              {fetchingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function formatAudienceType(type: SmsAudienceType) {
  switch (type) {
    case "DANCER_TIER":
      return "Dancer tier";
    case "CLUB_VIP":
      return "Club VIP tier";
    default:
      return type;
  }
}

function formatTargetType(type: SmsTargetType) {
  switch (type) {
    case "DANCER_CUSTOMER":
      return "Dancer customers";
    case "CLUB_PATRON":
      return "Club patrons";
    default:
      return type;
  }
}

