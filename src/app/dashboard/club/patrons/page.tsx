"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  OnboardingNudge,
  type NudgeStats,
} from "@/components/dashboard/OnboardingNudge";
import { getQuickTemplatesForRole, QuickTemplate } from "@/lib/quickTemplates";

type VipStatus = "NONE" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

type ClubPatron = {
  id: string;
  displayName: string;
  phone?: string | null;
  email?: string | null;
  telegramHandle?: string | null;
  instagramHandle?: string | null;
  totalSpendCents: number;
  visitsCount: number;
  lastVisitAt?: string | null;
  vipStatus: VipStatus;
  birthday?: string | null;
  preferredNights?: string | null;
  preferredDancer?: string | null;
  notes?: string | null;
  recommendedVipStatus: VipStatus;
  activityStatus: "ACTIVE" | "AT_RISK" | "COLD" | "UNKNOWN";
  upcomingBirthday: boolean;
};

type PatronsResponse = {
  creatorAccountId?: string;
  patrons?: ClubPatron[];
};

const VIP_LABELS: Record<VipStatus, string> = {
  NONE: "None",
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
};

const VIP_COLORS: Record<VipStatus, string> = {
  PLATINUM: "border-violet-300 text-violet-200",
  GOLD: "border-amber-400 text-amber-200",
  SILVER: "border-slate-300 text-slate-200",
  BRONZE: "border-orange-400 text-orange-200",
  NONE: "border-white/15 text-silver/80",
};

export default function ClubPatronsPage() {
  const [patrons, setPatrons] = useState<ClubPatron[]>([]);
  const [creatorAccountId, setCreatorAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<{ smsUsed: number; smsLimit: number } | null>(
    null,
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vipStatus, setVipStatus] = useState<VipStatus>("NONE");
  const [preferredNights, setPreferredNights] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPatrons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clubs/patrons");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Unable to load patrons");
      }
      const json: PatronsResponse = await res.json();
      setCreatorAccountId(json.creatorAccountId ?? null);
      setPatrons(json.patrons ?? []);
      setStatus(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to load patrons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatrons();
  }, [loadPatrons]);

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
      } catch (error) {
        console.warn("Failed to fetch billing usage", error);
      }
    };
    loadUsage();
    return () => {
      cancelled = true;
    };
  }, []);

  const vipCount = useMemo(
    () => patrons.filter((patron) => patron.vipStatus !== "NONE").length,
    [patrons],
  );

  const atRiskCount = useMemo(
    () =>
      patrons.filter((patron) => patron.activityStatus === "AT_RISK").length,
    [patrons],
  );

  const coldCount = useMemo(
    () => patrons.filter((patron) => patron.activityStatus === "COLD").length,
    [patrons],
  );

  const birthdaySoonCount = useMemo(
    () => patrons.filter((patron) => patron.upcomingBirthday).length,
    [patrons],
  );

  const totalSpend = useMemo(
    () =>
      patrons.reduce((sum, patron) => sum + (patron.totalSpendCents ?? 0), 0) /
      100,
    [patrons],
  );

  const totalVisits = useMemo(
    () =>
      patrons.reduce((sum, patron) => sum + (patron.visitsCount ?? 0), 0),
    [patrons],
  );

  const nudgeStats: NudgeStats = {
    atRisk: atRiskCount,
    cold: coldCount,
    birthdaysThisWeek: birthdaySoonCount,
    smsUsed: usage?.smsUsed,
    smsLimit: usage?.smsLimit,
  };

  const handleAddPatron = async () => {
    if (!creatorAccountId) {
      setStatus("No club workspace detected yet.");
      return;
    }
    if (!name.trim()) {
      setStatus("Enter at least a name or nickname.");
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/clubs/patrons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          displayName: name.trim(),
          phone: phone.trim() || undefined,
          vipStatus,
          preferredNights: preferredNights.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save patron.");
      }
      setPatrons((prev) => [json.patron, ...prev]);
      setName("");
      setPhone("");
      setPreferredNights("");
      setNotes("");
      setVipStatus("NONE");
      setStatus("Patron saved.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save patron.";
      setStatus(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <OnboardingNudge role="CLUB" stats={nudgeStats} />
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-silver/60">Club CRM</p>
        <h1 className="font-heading text-2xl font-semibold text-white">
          Keep your VIP list warm
        </h1>
        <p className="text-sm text-silver/70">
          Track bottle buyers, high-value patrons, birthdays, and preferred nights so
          you know who to invite for every big night.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total patrons" value={patrons.length} />
        <StatCard label="VIPs (Bronze+)" value={vipCount} />
        <StatCard label="At-risk patrons" value={atRiskCount} />
        <StatCard label="Cold patrons" value={coldCount} />
        <StatCard label="Birthdays this week" value={birthdaySoonCount} />
        <StatCard label="Lifetime spend" value={`$${totalSpend.toFixed(0)}`} />
        <StatCard label="Visits logged" value={totalVisits} />
      </div>

      {creatorAccountId && (
        <>
          <ClubBroadcastCard
            creatorAccountId={creatorAccountId}
            vipCount={vipCount}
          />
          <ClubImportCard
            creatorAccountId={creatorAccountId}
            onImported={loadPatrons}
          />
        </>
      )}

      <Card>
        <h2 className="font-heading text-lg font-semibold text-white">
          Add a patron
        </h2>
        <p className="text-sm text-silver/70">
          Drop them into the CRM so you can text, invite, and prioritize your biggest
          spenders.
        </p>
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name or nickname"
              className="rounded-xl border border-white/10 bg-midnight-alt px-3 py-2 text-sm text-white"
            />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone number"
              className="rounded-xl border border-white/10 bg-midnight-alt px-3 py-2 text-sm text-white"
            />
            <input
              value={preferredNights}
              onChange={(event) => setPreferredNights(event.target.value)}
              placeholder="Preferred nights"
              className="rounded-xl border border-white/10 bg-midnight-alt px-3 py-2 text-sm text-white"
            />
            <select
              value={vipStatus}
              onChange={(event) => setVipStatus(event.target.value as VipStatus)}
              className="rounded-xl border border-white/10 bg-midnight-alt px-3 py-2 text-sm text-white"
            >
              {(["NONE", "BRONZE", "SILVER", "GOLD", "PLATINUM"] as VipStatus[]).map(
                (value) => (
                  <option key={value} value={value}>
                    {VIP_LABELS[value]}
                  </option>
                ),
              )}
            </select>
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Notes—bottle preferences, table size, favorite dancers..."
            className="w-full rounded-xl border border-white/10 bg-midnight-alt px-3 py-2 text-sm text-white"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleAddPatron}
              disabled={saving || !creatorAccountId}
            >
              {saving ? "Saving…" : "Save patron"}
            </Button>
            {status && (
              <p className="text-xs text-silver/60 border border-white/10 rounded-lg px-3 py-1">
                {status}
              </p>
            )}
          </div>
          {!creatorAccountId && (
            <p className="text-xs text-warning">
              No club workspace connected yet—set one up in Settings.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-white">
              Patrons & VIPs
            </h2>
            <p className="text-sm text-silver/70">
              Ranked by VIP tier, spend, and visits so you always know who to prioritize.
            </p>
          </div>
          <p className="text-xs text-silver/60">
            Total visits logged:{" "}
            <span className="font-semibold text-white">{totalVisits}</span>
          </p>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-silver/60">Loading patrons…</p>
        ) : patrons.length === 0 ? (
          <p className="mt-4 text-sm text-silver/60">
            No patrons yet. Add your regulars to start tracking spend and outreach.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-silver/80">
              <thead className="text-xs uppercase tracking-wide text-silver/60">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">VIP</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Last visit</th>
                  <th className="py-2 pr-4">Spend</th>
                  <th className="py-2 pr-4">Visits</th>
                  <th className="py-2 pr-4">Preferred nights</th>
                  <th className="py-2 pr-4">Activity</th>
                  <th className="py-2 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {patrons.map((patron) => (
                  <tr key={patron.id} className="border-t border-white/5">
                    <td className="py-3 pr-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{patron.displayName}</span>
                        {patron.instagramHandle && (
                          <span className="text-xs text-silver/60">
                            IG @{patron.instagramHandle}
                          </span>
                        )}
                        {patron.telegramHandle && (
                          <span className="text-xs text-silver/60">
                            TG @{patron.telegramHandle}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] ${VIP_COLORS[patron.vipStatus]}`}
                        >
                          {VIP_LABELS[patron.vipStatus]}
                        </span>
                        {patron.recommendedVipStatus !== patron.vipStatus && (
                          <span className="text-[10px] text-amber-300">
                            Suggest: {VIP_LABELS[patron.recommendedVipStatus]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      <div className="flex flex-col">
                        <span>{patron.phone || "—"}</span>
                        {patron.email && (
                          <span className="text-silver/60">{patron.email}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {patron.lastVisitAt
                        ? new Date(patron.lastVisitAt).toLocaleDateString()
                        : "—"}
                      {patron.upcomingBirthday && (
                        <span className="ml-2 rounded-full bg-magenta/20 px-2 py-0.5 text-[9px] text-magenta">
                          Birthday soon 🎉
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {patron.totalSpendCents
                        ? `$${(patron.totalSpendCents / 100).toFixed(0)}`
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-xs">{patron.visitsCount ?? 0}</td>
                    <td className="py-3 pr-4 text-xs">
                      {patron.preferredNights || "—"}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      <span
                        className={
                          patron.activityStatus === "ACTIVE"
                            ? "text-emerald-400"
                            : patron.activityStatus === "AT_RISK"
                              ? "text-amber-300"
                              : patron.activityStatus === "COLD"
                                ? "text-danger"
                                : "text-silver/60"
                        }
                      >
                        {patron.activityStatus === "ACTIVE" && "Active"}
                        {patron.activityStatus === "AT_RISK" && "At risk"}
                        {patron.activityStatus === "COLD" && "Cold"}
                        {patron.activityStatus === "UNKNOWN" && "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs max-w-xs">
                      <span className="line-clamp-2">{patron.notes || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-midnight-alt/40 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-silver/60">{label}</p>
      <p className="mt-1 text-2xl font-heading font-semibold text-white">{value}</p>
    </div>
  );
}

function ClubBroadcastCard({
  creatorAccountId,
  vipCount,
}: {
  creatorAccountId: string;
  vipCount: number;
}) {
  type ClubFilter = "ALL" | "AT_RISK" | "COLD" | "BIRTHDAY_WEEK";
  const [vipStatus, setVipStatus] = useState<VipStatus>("GOLD");
  const [filter, setFilter] = useState<ClubFilter>("ALL");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const clubTemplates = getQuickTemplatesForRole("CLUB");

  function applyClubTemplate(tpl: QuickTemplate) {
    setMessage(tpl.body);
    setStatus(null);
  }

  const sendSmsBroadcast = async () => {
    if (!message.trim()) return;
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/sms/clubs/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          vipStatus,
          text: message.trim(),
          filter,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 402 && json.code) {
          setStatus(
            json.code === "SMS_LIMIT_EXCEEDED"
              ? "You’ve used all SMS credits for this plan. Upgrade to text more VIPs."
              : "SMS access isn’t enabled on your plan yet.",
          );
          return;
        }
        throw new Error(json.error || "Failed to text VIPs.");
      }
      setStatus(
        `Texted ${json.successCount}/${json.toCount} ${vipStatus.toLowerCase()} patrons.`,
      );
      setMessage("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send SMS.";
      setStatus(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#111113] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-100">Text your VIPs</p>
          <p className="text-xs text-slate-400">
            Target specific segments like at-risk VIPs or birthdays this week.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-silver/70">
          {vipCount} VIP{vipCount === 1 ? "" : "s"}
        </span>
      </div>

      {/* Quick templates */}
      {clubTemplates.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Quick templates
          </p>
          <div className="flex flex-wrap gap-2">
            {clubTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyClubTemplate(tpl)}
                className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] text-slate-100 hover:border-indigo-500/60 hover:bg-indigo-500/10"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 md:flex-row">
        <select
          value={vipStatus}
          onChange={(event) => setVipStatus(event.target.value as VipStatus)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-magenta md:w-40"
        >
          {(["BRONZE", "SILVER", "GOLD", "PLATINUM", "NONE"] as VipStatus[]).map(
            (value) => (
              <option key={value} value={value}>
                {VIP_LABELS[value]}
              </option>
            ),
          )}
        </select>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as ClubFilter)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-magenta md:w-48"
        >
          <option value="ALL">All in this tier</option>
          <option value="AT_RISK">At-risk (30+ days away)</option>
          <option value="COLD">Cold (90+ days away)</option>
          <option value="BIRTHDAY_WEEK">Birthdays this week</option>
        </select>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={2}
          placeholder='“VIP tables tonight. Text back if you want yours held. Bottle deals until midnight.”'
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-magenta"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={sendSmsBroadcast}
          disabled={sending || !message.trim()}
        >
          {sending ? "Texting…" : "Send SMS"}
        </Button>
        {status && (
          <p className="text-xs text-silver/60 border border-white/10 rounded-lg px-3 py-1">
            {status}
          </p>
        )}
      </div>
      <p className="text-[11px] text-silver/50">
        {filter === "ALL" && "All patrons in this VIP tier will be texted."}
        {filter === "AT_RISK" &&
          "Only VIPs who haven’t visited in a few weeks will be texted."}
        {filter === "COLD" &&
          "Only VIPs who have been gone for months will be texted."}
        {filter === "BIRTHDAY_WEEK" &&
          "Only VIPs with birthdays in the next week will be texted."}
      </p>
      <p className="text-[11px] text-silver/60">
        <Link href="/dashboard/messaging/logs" className="text-magenta hover:text-white">
          View SMS history →
        </Link>
      </p>
    </section>
  );
}

type ClubImportFieldKey =
  | "displayName"
  | "phone"
  | "vipStatus"
  | "totalSpendCents"
  | "visitsCount"
  | "lastVisitAt"
  | "birthday"
  | "notes";

const CLUB_IMPORT_FIELDS: {
  key: ClubImportFieldKey;
  label: string;
  required?: boolean;
}[] = [
  { key: "displayName", label: "Name", required: true },
  { key: "phone", label: "Phone number" },
  { key: "vipStatus", label: "VIP status" },
  { key: "totalSpendCents", label: "Lifetime spend ($)" },
  { key: "visitsCount", label: "Visits" },
  { key: "lastVisitAt", label: "Last visit date" },
  { key: "birthday", label: "Birthday" },
  { key: "notes", label: "Notes" },
];

function ClubImportCard({
  creatorAccountId,
  onImported,
}: {
  creatorAccountId: string;
  onImported: () => void;
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<ClubImportFieldKey, string | undefined>>({
    displayName: undefined,
    phone: undefined,
    vipStatus: undefined,
    totalSpendCents: undefined,
    visitsCount: undefined,
    lastVisitAt: undefined,
    birthday: undefined,
    notes: undefined,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setStatus(
        parsed.rows.length
          ? `Loaded ${parsed.rows.length} rows. Map your columns below.`
          : "No rows detected—double-check your CSV.",
      );
    } catch (error) {
      setHeaders([]);
      setRows([]);
      setStatus(error instanceof Error ? error.message : "Unable to read that CSV.");
    }
  };

  const handleImport = async () => {
    if (!mapping.displayName) {
      setStatus("Map at least a name column before importing.");
      return;
    }
    if (!rows.length) {
      setStatus("Upload a CSV first.");
      return;
    }

    const payloadRows = rows
      .map((row) => transformClubRow(row, mapping))
      .filter((row): row is NonNullable<ReturnType<typeof transformClubRow>> =>
        Boolean(row),
      );

    if (!payloadRows.length) {
      setStatus("No usable rows detected after mapping.");
      return;
    }

    setImporting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/clubs/patrons/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          rows: payloadRows,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to import patrons.");
      }
      setStatus(`Imported ${json.imported} patrons.`);
      setHeaders([]);
      setRows([]);
      onImported();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#111113] p-4 space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-white">Import patrons</h3>
        <p className="text-xs text-silver/70">
          Upload a CSV of your VIPs, spenders, and regulars so you can start texting them
          tonight.
        </p>
      </div>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="text-xs text-silver/70 file:mr-3 file:rounded-md file:border-0 file:bg-magenta/20 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-magenta/30"
      />
      {headers.length > 0 && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs font-semibold text-white">Map columns</p>
          <div className="grid gap-3 md:grid-cols-2">
            {CLUB_IMPORT_FIELDS.map((field) => (
              <label key={field.key} className="text-xs text-silver/70">
                {field.label}
                {field.required && <span className="text-danger">*</span>}
                <select
                  value={mapping[field.key] ?? ""}
                  onChange={(event) =>
                    setMapping((prev) => ({
                      ...prev,
                      [field.key]: event.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white"
                >
                  <option value="">Skip</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={handleImport}
          disabled={!rows.length || importing}
        >
          {importing ? "Importing..." : "Import patrons"}
        </Button>
        {status && (
          <p className="text-xs text-silver/60 border border-white/10 rounded-lg px-3 py-1">
            {status}
          </p>
        )}
      </div>
      <p className="text-[11px] text-silver/50">
        Suggested columns: name, phone, VIP status, spend, visits, last visit, birthday,
        notes. Extra columns are ignored automatically.
      </p>
    </section>
  );
}

function transformClubRow(
  row: Record<string, string>,
  mapping: Record<ClubImportFieldKey, string | undefined>,
) {
  const nameHeader = mapping.displayName;
  if (!nameHeader) return null;
  const displayName = row[nameHeader]?.trim();
  if (!displayName) return null;

  const phone = mapping.phone ? row[mapping.phone]?.trim() : undefined;
  const vipValue = mapping.vipStatus ? row[mapping.vipStatus]?.trim() : undefined;
  const spendValue = mapping.totalSpendCents ? row[mapping.totalSpendCents] : undefined;
  const visitsValue = mapping.visitsCount ? row[mapping.visitsCount] : undefined;
  const lastVisitValue = mapping.lastVisitAt ? row[mapping.lastVisitAt] : undefined;
  const birthdayValue = mapping.birthday ? row[mapping.birthday] : undefined;
  const notesValue = mapping.notes ? row[mapping.notes] : undefined;

  return {
    displayName,
    phone: phone || undefined,
    vipStatus: vipValue ? normalizeVipStatus(vipValue) : undefined,
    totalSpendCents: spendValue ? parseCurrency(spendValue) : undefined,
    visitsCount: visitsValue ? parseInt(visitsValue, 10) || undefined : undefined,
    lastVisitAt: parseDate(lastVisitValue),
    birthday: parseDate(birthdayValue),
    notes: notesValue || undefined,
  };
}

function parseCsv(text: string) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Need at least one row of data in your CSV.");
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const entry: Record<string, string> = {};
    headers.forEach((header, index) => {
      entry[header] = cols[index] ?? "";
    });
    return entry;
  });

  return { headers, rows };
}

function normalizeVipStatus(value: string): VipStatus {
  const normalized = value.toLowerCase();
  if (normalized.startsWith("plat")) return "PLATINUM";
  if (normalized.startsWith("gold")) return "GOLD";
  if (normalized.startsWith("sil")) return "SILVER";
  if (normalized.startsWith("bron")) return "BRONZE";
  return "NONE";
}

function parseCurrency(value: string) {
  const numeric = parseFloat(value.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(numeric)) {
    return undefined;
  }
  return Math.round(numeric * 100);
}

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}


