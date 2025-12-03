"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, ChevronLeft, Send, Sparkles } from "lucide-react";
import type { SegmentKey } from "@/lib/segments";

interface SegmentOption {
  key: SegmentKey;
  label: string;
  description: string;
  count: number;
}

interface SegmentsApiResponse {
  creatorAccountId: string;
  segments: Array<{
    key: SegmentKey;
    label: string;
    description: string;
    count: number;
  }>;
}

type Template = {
  id: string;
  name: string;
  segment: SegmentKey | null;
  body: string;
  isDefault: boolean;
};

type TemplatesResponse = {
  templates: Template[];
};

type TelegramChannel = {
  id: string;
  segment: SegmentKey | null;
  chatId: string;
  title?: string | null;
};

export default function CampaignNewPage() {
  return (
    <Suspense fallback={<div className="text-silver/60 text-sm">Loading…</div>}>
      <CampaignComposer />
    </Suspense>
  );
}

function CampaignComposer() {
  const searchParams = useSearchParams();
  const [segments, setSegments] = useState<SegmentOption[]>([]);
  const [segmentKey, setSegmentKey] = useState<SegmentKey | null>(null);
  const [message, setMessage] = useState("");
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [loadingSegments, setLoadingSegments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    searchParams.get("templateId"),
  );
  const [creatorAccountId, setCreatorAccountId] = useState<string | null>(null);
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [useTelegram, setUseTelegram] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/segments/summary")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to load segments");
        }
        return res.json();
      })
      .then((json: SegmentsApiResponse) => {
        if (!mounted) return;
        setCreatorAccountId(json.creatorAccountId);
        const options: SegmentOption[] = json.segments.map((segment) => ({
          key: segment.key,
          label: `${segment.label} (${segment.count} fans)`,
          description: segment.description,
          count: segment.count,
        }));
        setSegments(options);
        const preferred = searchParams.get("segment") as SegmentKey | null;
        setSegmentKey(
          options.find((o) => o.key === preferred)?.key ??
            options[0]?.key ??
            null,
        );
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoadingSegments(false);
      });

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const selectedSegment = useMemo(
    () => segments.find((segment) => segment.key === segmentKey),
    [segments, segmentKey],
  );

  useEffect(() => {
    let mounted = true;
    fetch("/api/templates")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load templates");
        }
        return res.json();
      })
      .then((json: TemplatesResponse) => {
        if (!mounted) return;
        setTemplates(json.templates ?? []);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
      })
      .finally(() => mounted && setTemplatesLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/telegram/channels")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load Telegram channels");
        }
        return res.json();
      })
      .then((json: { channels: TelegramChannel[] }) => {
        if (!mounted) return;
        setChannels(json.channels ?? []);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
      })
      .finally(() => mounted && setChannelsLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTemplateId) return;
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (template) {
      setMessage(template.body);
    }
  }, [selectedTemplateId, templates]);

  const availableTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (!segmentKey) return true;
      if (template.segment == null) return true;
      return template.segment === segmentKey;
    });
  }, [templates, segmentKey]);

  useEffect(() => {
    if (!selectedTemplateId) return;
    const exists = availableTemplates.some(
      (template) => template.id === selectedTemplateId,
    );
    if (!exists) {
      setSelectedTemplateId(null);
    }
  }, [availableTemplates, selectedTemplateId]);

  const selectedChannel = useMemo(() => {
    if (!segmentKey) return null;
    return channels.find((channel) => channel.segment === segmentKey) ?? null;
  }, [channels, segmentKey]);

  useEffect(() => {
    if (!selectedChannel) {
      setUseTelegram(false);
    }
  }, [selectedChannel]);

  const handleSend = async () => {
    if (!segmentKey) {
      setSendStatus("Choose a segment before sending.");
      return;
    }
    if (!message.trim()) {
      setSendStatus("Write a message before sending.");
      return;
    }
    if (!creatorAccountId) {
      setSendStatus("No creator account found. Connect OnlyFans first.");
      return;
    }
    if (useTelegram && !selectedChannel) {
      setSendStatus("Add a Telegram channel for this segment to broadcast.");
      return;
    }

    setSending(true);
    setSendStatus(null);

    try {
      if (useTelegram && selectedChannel) {
        const res = await fetch("/api/telegram/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorAccountId,
            segment: segmentKey,
            text: message,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to send Telegram broadcast");
        }
      }
      setSendStatus(
        useTelegram
          ? "Telegram broadcast sent. Campaign logging coming next."
          : "Campaign saved locally.",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to send this campaign.";
      setSendStatus(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <Link href="/dashboard/campaigns" className="text-xs text-silver/60 hover:text-white">
        <ChevronLeft className="mr-1 inline h-3 w-3" />
        Back to campaigns
      </Link>

      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-silver/60">Compose</p>
        <h1 className="font-heading text-2xl font-semibold text-white">New campaign</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium text-silver/70">Audience</label>
                {error && (
                  <p className="mt-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                    {error}
                  </p>
                )}
                <select
                  disabled={!segments.length}
                  value={segmentKey ?? ""}
                  onChange={(event) =>
                    setSegmentKey(event.target.value as SegmentKey)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-midnight-alt px-4 py-3 text-sm text-white focus:outline-none focus:border-magenta disabled:opacity-50"
                >
                  {segments.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-silver/60">
                  {loadingSegments
                    ? "Loading segments..."
                    : selectedSegment?.description ?? "No segments found yet."}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-silver/70">
                    Template
                  </label>
                  <Link
                    href="/dashboard/templates"
                    className="text-[11px] text-magenta hover:text-white"
                  >
                    Manage templates
                  </Link>
                </div>
                {templatesLoading ? (
                  <div className="mt-2 h-11 animate-pulse rounded-xl border border-white/10 bg-white/5" />
                ) : availableTemplates.length === 0 ? (
                  <p className="mt-2 text-xs text-silver/60">
                    No templates for this segment yet. Save one from the Templates
                    page.
                  </p>
                ) : (
                  <select
                    value={selectedTemplateId ?? ""}
                    onChange={(event) =>
                      setSelectedTemplateId(
                        event.target.value === ""
                          ? null
                          : event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-midnight-alt px-4 py-3 text-sm text-white focus:outline-none focus:border-magenta"
                  >
                    <option value="">Start from scratch</option>
                    {availableTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                        {template.isDefault ? " • RepurpX" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-silver/70">Message</label>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-magenta hover:text-white"
                    onClick={() =>
                      setMessage(
                        "Hey {first_name} ✨ I just dropped something special for my VIP list. Want your unlock link?",
                      )
                    }
                  >
                    <Sparkles className="h-3 w-3" />
                    AI rewrite
                  </button>
                </div>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  placeholder="Share the drop, tease the offer, personalize with {first_name}..."
                  className="w-full rounded-xl border border-white/10 bg-midnight-alt p-4 text-sm text-white placeholder:text-silver/60 focus:outline-none focus:border-magenta"
                />
                <div className="mt-2 flex gap-2 text-[10px] text-silver/70">
                  <span className="rounded-md border border-white/10 px-2 py-1">
                    {"{first_name}"}
                  </span>
                  <span className="rounded-md border border-white/10 px-2 py-1">
                    {"{last_tip}"}
                  </span>
                  <span className="rounded-md border border-white/10 px-2 py-1">
                    {"{username}"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-silver/70">Schedule</label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm font-medium">
                    <input
                      type="radio"
                      checked={schedule === "now"}
                      onChange={() => setSchedule("now")}
                      className="text-magenta"
                    />
                    Send immediately
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-midnight-alt px-4 py-3 text-sm text-silver/70 hover:border-white/30">
                    <input
                      type="radio"
                      checked={schedule === "later"}
                      onChange={() => setSchedule("later")}
                      className="text-magenta"
                    />
                    Schedule for later
                  </label>
                </div>
                {schedule === "later" && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-midnight-alt px-4 py-3 text-sm text-silver/80">
                    <Calendar className="h-4 w-4" />
                    Pick a date/time in the next release.
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-silver/70">
                  Automations
                </label>
                <div className="mt-3 rounded-xl border border-white/10 bg-midnight-alt/60 p-4 text-sm text-silver/80">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-white">Send via Telegram</p>
                      <p className="text-xs text-silver/60">
                        Broadcast this campaign directly to your Telegram segment.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        className="accent-magenta"
                        checked={useTelegram}
                        onChange={(event) => setUseTelegram(event.target.checked)}
                        disabled={!selectedChannel || channelsLoading || sending}
                      />
                      <span className="text-silver/70">
                        {channelsLoading
                          ? "Checking channels…"
                          : selectedChannel
                            ? selectedChannel.title ?? "Channel connected"
                            : "No channel yet"}
                      </span>
                    </label>
                  </div>
                  {!selectedChannel && !channelsLoading && (
                    <p className="mt-3 text-[11px] text-silver/60">
                      Set up Telegram channels in Settings → Telegram broadcasts.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="ghost">Save draft</Button>
            <Button
              icon={<Send className="h-4 w-4" />}
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? "Sending…" : "Review & send"}
            </Button>
            {sendStatus && (
              <p className="text-xs text-silver/60 sm:ml-3 sm:text-right">{sendStatus}</p>
            )}
          </div>
        </div>

        <Card className="bg-black/30">
          <h3 className="font-heading text-lg font-semibold text-white">Preview</h3>
          <p className="text-xs text-silver/60">Example fan view (auto-personalized).</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl rounded-tl-none bg-white/10 p-4 text-sm text-silver">
              {message
                ? message
                    .replace("{first_name}", "Aria")
                    .replace("{last_tip}", "$55")
                    .replace("{username}", "@aria88")
                : "Your message preview will appear here..."}
            </div>
            <p className="text-center text-[10px] text-silver/70">
              Estimated reach:{" "}
              <span className="font-heading text-white">
                {selectedSegment?.count ?? 0} fans
              </span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

