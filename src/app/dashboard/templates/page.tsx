"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { SegmentKey } from "@/lib/segments";

type TemplateSegment = SegmentKey | "CUSTOM";

type Template = {
  id: string;
  name: string;
  segment: SegmentKey | null;
  body: string;
  isDefault: boolean;
};

type TemplatesResponse = {
  creatorAccountId: string;
  templates: Template[];
};

const SEGMENT_LABELS: Record<TemplateSegment, string> = {
  WHALE: "Whales",
  MID: "Mid spenders",
  LOW: "Low spenders",
  NEW: "New subs",
  EXPIRING: "Expiring",
  GHOST: "Ghosts",
  CUSTOM: "Custom",
};

const SEGMENT_FILTERS: Array<TemplateSegment | "ALL"> = [
  "ALL",
  "WHALE",
  "NEW",
  "EXPIRING",
  "GHOST",
  "MID",
  "LOW",
  "CUSTOM",
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [creatorAccountId, setCreatorAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [segmentFilter, setSegmentFilter] = useState<TemplateSegment | "ALL">(
    "ALL",
  );
  const [name, setName] = useState("");
  const [segment, setSegment] = useState<TemplateSegment>("WHALE");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/templates")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Unable to load templates");
        }
        return res.json();
      })
      .then((json: TemplatesResponse) => {
        if (!mounted) return;
        setCreatorAccountId(json.creatorAccountId);
        setTemplates(json.templates ?? []);
        setStatus(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setStatus(err.message);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return templates.filter((template) => {
      if (segmentFilter === "ALL") return true;
      if (segmentFilter === "CUSTOM") return template.segment == null;
      return template.segment === segmentFilter;
    });
  }, [templates, segmentFilter]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!creatorAccountId) return;
    setSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          name,
          segment,
          body,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Unable to save template");
      }

      setTemplates((prev) => [json.template, ...prev]);
      setName("");
      setBody("");
      setSegment("WHALE");
      setStatus("Template saved.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save template.";
      setStatus(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-silver/60">
            Templates
          </p>
          <h1 className="font-heading text-2xl font-semibold text-white">
            Templates that sell for you
          </h1>
          <p className="text-sm text-silver/70">
            Save and reuse scripts that convert—by segment, tone, or occasion.
          </p>
        </div>
      </div>

      <Card>
        <h2 className="font-heading text-lg font-semibold text-white">
          Create a template
        </h2>
        <p className="text-sm text-silver/70">
          Give it a name, choose the segment, and drop in your best copy.
        </p>
        <form className="mt-4 space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="text-xs font-medium text-silver/70">Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-midnight-alt px-4 py-3 text-sm text-white focus:outline-none focus:border-magenta"
              placeholder="Whale Upsell #1"
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-silver/70">
                Segment
              </label>
              <select
                value={segment}
                onChange={(event) =>
                  setSegment(event.target.value as TemplateSegment)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-midnight-alt px-4 py-3 text-sm text-white focus:outline-none focus:border-magenta"
              >
                {(Object.keys(SEGMENT_LABELS) as TemplateSegment[]).map(
                  (key) => (
                    <option key={key} value={key}>
                      {SEGMENT_LABELS[key]}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-silver/70">
                Personalization tokens
              </label>
              <p className="mt-2 text-xs text-silver/60">
                Use tokens like{" "}
                <span className="rounded border border-white/10 px-1">
                  {"{first_name}"}
                </span>{" "}
                and{" "}
                <span className="rounded border border-white/10 px-1">
                  {"{last_tip}"}
                </span>{" "}
                to auto-fill fan context.
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-silver/70">
              Message body
            </label>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              placeholder="Hey {first_name}..."
              className="mt-2 w-full rounded-xl border border-white/10 bg-midnight-alt p-4 text-sm text-white placeholder:text-silver/60 focus:outline-none focus:border-magenta"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-silver/60">
              Make it personal, add scarcity, and keep CTAs clear.
            </p>
            <Button type="submit" disabled={submitting || !creatorAccountId}>
              {submitting ? "Saving..." : "Save template"}
            </Button>
          </div>
          {status && (
            <p className="text-xs text-silver/60">
              {status}
            </p>
          )}
        </form>
      </Card>

      <Card>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold text-white">
              Your template library
            </h2>
            <p className="text-sm text-silver/70">
              Filter by segment and drop them straight into a campaign.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SEGMENT_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() =>
                  setSegmentFilter(filter as TemplateSegment | "ALL")
                }
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  segmentFilter === filter
                    ? "border-magenta/60 bg-magenta/10 text-magenta"
                    : "border-white/10 text-silver hover:border-magenta/40 hover:text-white"
                }`}
              >
                {filter === "ALL"
                  ? "All"
                  : SEGMENT_LABELS[filter as TemplateSegment]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-silver/70">
            No templates yet. Save your best-performing scripts to reuse them in
            a click.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((template) => (
              <div
                key={template.id}
                className="rounded-xl border border-white/10 bg-card p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-lg font-semibold text-white">
                        {template.name}
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-silver">
                        {template.segment
                          ? SEGMENT_LABELS[template.segment]
                          : "Custom"}
                      </span>
                      {template.isDefault && (
                        <span className="text-[10px] text-emerald-400">
                          RepurpX default
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-silver/80 whitespace-pre-wrap">
                      {template.body}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/campaigns/new?segment=${
                        template.segment ?? "CUSTOM"
                      }&templateId=${template.id}`}
                    >
                      <Button variant="secondary" size="sm">
                        Use in campaign
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
