"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DancerCustomerTier } from "@prisma/client";
import {
  OnboardingNudge,
  type NudgeStats,
} from "@/components/dashboard/OnboardingNudge";
import { getQuickTemplatesForRole, QuickTemplate } from "@/lib/quickTemplates";

type Tier = "WHALE" | "REGULAR" | "OCCASIONAL" | "TEST";
type ActivityStatus = "ACTIVE" | "AT_RISK" | "COLD" | "UNKNOWN";

type DancerCustomer = {
  id: string;
  displayName: string;
  phone?: string | null;
  telegramHandle?: string | null;
  instagramHandle?: string | null;
  totalSpendCents: number;
  lastVisitAt?: string | null;
  lastContactAt?: string | null;
  visitsCount: number;
  favoriteNights?: string | null;
  tier: Tier;
  recommendedTier: Tier;
  activityStatus: ActivityStatus;
  notes?: string | null;
};

type CustomersResponse = {
  creatorAccountId?: string;
  customers?: DancerCustomer[];
};

const TIER_LABELS: Record<Tier, string> = {
  WHALE: "Whale",
  REGULAR: "Regular",
  OCCASIONAL: "Occasional",
  TEST: "Test",
};
const DANCER_TIER_OPTIONS = ["WHALE", "REGULAR", "OCCASIONAL", "TEST"] as const;

const STATUS_LABELS: Record<ActivityStatus, string> = {
  ACTIVE: "Active",
  AT_RISK: "At risk",
  COLD: "Cold",
  UNKNOWN: "—",
};

const STATUS_CLASSES: Record<ActivityStatus, string> = {
  ACTIVE: "text-emerald-400",
  AT_RISK: "text-amber-300",
  COLD: "text-danger",
  UNKNOWN: "text-silver/60",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function DancerCustomersPage() {
  const [customers, setCustomers] = useState<DancerCustomer[]>([]);
  const [creatorAccountId, setCreatorAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState<{ smsUsed: number; smsLimit: number } | null>(
    null,
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState<Tier>("REGULAR");
  const [favoriteNights, setFavoriteNights] = useState("");
  const [notes, setNotes] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dancers/customers");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Unable to load customers");
      }
      const json: CustomersResponse = await res.json();
      setCreatorAccountId(json.creatorAccountId ?? null);
      setCustomers(json.customers ?? []);
      setStatus(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

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

  const whales = useMemo(
    () => customers.filter((customer) => customer.tier === "WHALE"),
    [customers],
  );

  const inactiveCount = useMemo(
    () =>
      customers.filter(
        (customer) => customer.activityStatus === "COLD",
      ).length,
    [customers],
  );

  const atRiskCount = useMemo(
    () =>
      customers.filter(
        (customer) => customer.activityStatus === "AT_RISK",
      ).length,
    [customers],
  );

  const totalSpend = useMemo(() => {
    return customers.reduce((sum, customer) => sum + customer.totalSpendCents, 0);
  }, [customers]);

  const nudgeStats: NudgeStats = {
    atRisk: atRiskCount,
    cold: inactiveCount,
    smsUsed: usage?.smsUsed,
    smsLimit: usage?.smsLimit,
  };

  const handleAddCustomer = async () => {
    if (!name.trim() || !creatorAccountId) {
      setStatus(
        creatorAccountId
          ? "Enter at least a name or nickname."
          : "Create a dancer account first.",
      );
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch("/api/dancers/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          displayName: name.trim(),
          phone: phone.trim() || undefined,
          favoriteNights: favoriteNights.trim() || undefined,
          tier,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save customer.");
      }
      setCustomers((prev) => [json.customer, ...prev]);
      setName("");
      setPhone("");
      setFavoriteNights("");
      setNotes("");
      setTier("REGULAR");
      setStatus("Customer saved.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save customer.";
      setStatus(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <OnboardingNudge role="DANCER" stats={nudgeStats} />
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-silver/60">Dancer CRM</p>
        <h1 className="font-heading text-2xl font-semibold text-white">
          Know your regulars
        </h1>
        <p className="text-sm text-silver/70">
          Track VIPs, whales, and loyal guests so you know who to text before every shift.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total customers" value={customers.length} />
        <StatCard label="Whales" value={whales.length} />
        <StatCard label="At risk (21d+)" value={atRiskCount} />
        <StatCard label="Cold (45d+)" value={inactiveCount} />
      </div>

      {creatorAccountId && (
        <>
          <DancerBroadcastCard
            creatorAccountId={creatorAccountId}
            whalesCount={whales.length}
          />
          <DancerImportCard
            creatorAccountId={creatorAccountId}
            onImported={loadCustomers}
          />
        </>
      )}

      <Card>
        <h2 className="font-heading text-lg font-semibold text-white">
          Add a regular
        </h2>
        <p className="text-sm text-silver/70">
          Quick note who they are, where to reach them, and what makes them spend. You can
          flesh it out later.
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
              value={favoriteNights}
              onChange={(event) => setFavoriteNights(event.target.value)}
              placeholder="Favorite nights"
              className="rounded-xl border border-white/10 bg-midnight-alt px-3 py-2 text-sm text-white"
            />
            <select
              value={tier}
              onChange={(event) => setTier(event.target.value as Tier)}
              className="rounded-xl border border-white/10 bg-midnight-alt px-3 py-2 text-sm text-white"
            >
              {(["WHALE", "REGULAR", "OCCASIONAL", "TEST"] as Tier[]).map((value) => (
                <option key={value} value={value}>
                  {TIER_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Notes — bottle habits, VIP preferences, reminders..."
            className="w-full rounded-xl border border-white/10 bg-midnight-alt px-3 py-2 text-sm text-white"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleAddCustomer} disabled={saving || !creatorAccountId}>
              {saving ? "Saving…" : "Save customer"}
            </Button>
            {status && (
              <p className="text-xs text-silver/70 border border-white/10 rounded-lg px-3 py-1">
                {status}
              </p>
            )}
          </div>
          {!creatorAccountId && (
            <p className="text-xs text-warning">
              No dancer account connected yet. Create one in Settings to start tracking
              regulars.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-white">Customers</h2>
            <p className="text-sm text-silver/70">
              Your VIP list ranked by segment and lifetime spend.
            </p>
          </div>
          <p className="text-xs text-silver/60">
            Lifetime spend: <span className="font-semibold text-white">{currency.format(totalSpend / 100)}</span>
          </p>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-silver/60">Loading customers…</p>
        ) : customers.length === 0 ? (
          <p className="mt-4 text-sm text-silver/60">
            No customers yet. Add the people who tip, book VIP, or consistently show up.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-silver/80">
              <thead className="text-xs uppercase tracking-wide text-silver/60">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Tier</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Last visit</th>
                  <th className="py-2 pr-4">Visits</th>
                  <th className="py-2 pr-4">Spend</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-white/5">
                    <td className="py-3 pr-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{customer.displayName}</span>
                        {customer.favoriteNights && (
                          <span className="text-xs text-silver/60">
                            Likes {customer.favoriteNights}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-center">
                          {TIER_LABELS[customer.tier]}
                        </span>
                        {customer.recommendedTier !== customer.tier && (
                          <span className="text-[10px] text-amber-300">
                            Suggests {TIER_LABELS[customer.recommendedTier]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      <div className="flex flex-col">
                        <span>{customer.phone || "—"}</span>
                        {customer.telegramHandle && (
                          <span className="text-silver/60">@{customer.telegramHandle}</span>
                        )}
                        {customer.instagramHandle && (
                          <span className="text-silver/60">IG @{customer.instagramHandle}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {customer.lastVisitAt
                        ? new Date(customer.lastVisitAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-xs">{customer.visitsCount ?? 0}</td>
                    <td className="py-3 pr-4 text-xs">
                      {customer.totalSpendCents
                        ? currency.format(customer.totalSpendCents / 100)
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      <span className={STATUS_CLASSES[customer.activityStatus]}>
                        {STATUS_LABELS[customer.activityStatus]}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs max-w-xs">
                      <span className="line-clamp-2">{customer.notes || "—"}</span>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-midnight-alt/40 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-silver/60">{label}</p>
      <p className="mt-1 text-2xl font-heading font-semibold text-white">{value}</p>
    </div>
  );
}

function DancerBroadcastCard({
  creatorAccountId,
  whalesCount,
}: {
  creatorAccountId: string;
  whalesCount: number;
}) {
  const [tier, setTier] =
    useState<(typeof DANCER_TIER_OPTIONS)[number]>("WHALE");
  const [message, setMessage] = useState("");
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const dancerTemplates = getQuickTemplatesForRole("DANCER");

  function applyDancerTemplate(tpl: QuickTemplate) {
    setMessage(tpl.body);
    setStatus(null);
  }

  const sendTelegramBroadcast = async () => {
    if (!message.trim()) return;
    setSendingTelegram(true);
    setStatus(null);
    try {
      const res = await fetch("/api/telegram/dancers/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          tier,
          text: message.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to send broadcast.");
      }
      setStatus("Telegram broadcast sent.");
      setMessage("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send broadcast.";
      setStatus(message);
    } finally {
      setSendingTelegram(false);
    }
  };

  const sendSmsBroadcast = async () => {
    if (!message.trim()) return;
    setSendingSms(true);
    setStatus(null);
    try {
      const res = await fetch("/api/sms/dancers/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          tier,
          text: message.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 402 && json.code) {
          setStatus(
            json.code === "SMS_LIMIT_EXCEEDED"
              ? "You’ve used all SMS credits for this plan. Upgrade to send more."
              : "SMS access isn’t included on your plan yet.",
          );
          return;
        }
        throw new Error(json.error || "Failed to send SMS broadcast.");
      }
      setStatus(
        `SMS sent to ${json.successCount}/${json.toCount} ${tier.toLowerCase()}s.`,
      );
      setMessage("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send SMS.";
      setStatus(message);
    } finally {
      setSendingSms(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-midnight-alt/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-white">Message your VIPs</p>
          <p className="text-xs text-silver/70">
            Send a Telegram blast to a tier (e.g. whales) using your mapped channel.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-silver/70">
          {whalesCount} whale{whalesCount === 1 ? "" : "s"}
        </span>
      </div>

      {/* Quick templates */}
      {dancerTemplates.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Quick templates
          </p>
          <div className="flex flex-wrap gap-2">
            {dancerTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyDancerTemplate(tpl)}
                className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] text-slate-100 hover:border-fuchsia-500/60 hover:bg-fuchsia-500/10"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 md:flex-row">
        <select
          value={tier}
          onChange={(event) =>
            setTier(event.target.value as (typeof DANCER_TIER_OPTIONS)[number])
          }
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-magenta md:w-48"
        >
          {DANCER_TIER_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {TIER_LABELS[value]}
            </option>
          ))}
        </select>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={2}
          placeholder="“I’m on tonight 10–2, VIP rooms open. Text me here if you want me to reserve a table.”"
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-magenta"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={sendTelegramBroadcast}
          disabled={sendingTelegram || !message.trim()}
        >
          {sendingTelegram ? "Sending…" : "Send via Telegram"}
        </Button>
        <Button
          variant="secondary"
          onClick={sendSmsBroadcast}
          disabled={sendingSms || !message.trim()}
        >
          {sendingSms ? "Texting…" : "Send via SMS"}
        </Button>
        {status && (
          <p className="text-xs text-silver/60 border border-white/10 rounded-lg px-3 py-1">
            {status}
          </p>
        )}
      </div>
      <p className="text-[11px] text-silver/60">
        <Link href="/dashboard/messaging/logs" className="text-magenta hover:text-white">
          View SMS history →
        </Link>
      </p>
      <p className="text-[11px] text-silver/50">
        Need to set up tiers? Head to Settings → Dancer Telegram/SMS tiers.
      </p>
    </section>
  );
}

type ImportFieldKey =
  | "displayName"
  | "phone"
  | "tier"
  | "totalSpendCents"
  | "visitsCount"
  | "lastVisitAt"
  | "notes";

const DANCER_IMPORT_FIELDS: {
  key: ImportFieldKey;
  label: string;
  required?: boolean;
}[] = [
  { key: "displayName", label: "Name", required: true },
  { key: "phone", label: "Phone number" },
  { key: "tier", label: "Tier (Whale / Regular / Occasional / Test)" },
  { key: "totalSpendCents", label: "Lifetime spend ($)" },
  { key: "visitsCount", label: "Visits" },
  { key: "lastVisitAt", label: "Last visit date" },
  { key: "notes", label: "Notes" },
];

function DancerImportCard({
  creatorAccountId,
  onImported,
}: {
  creatorAccountId: string;
  onImported: () => void;
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowObjects, setRowObjects] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<ImportFieldKey, string | undefined>>({
    displayName: undefined,
    phone: undefined,
    tier: undefined,
    totalSpendCents: undefined,
    visitsCount: undefined,
    lastVisitAt: undefined,
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
      setRowObjects(parsed.rows);
      setStatus(
        parsed.rows.length
          ? `Loaded ${parsed.rows.length} rows. Map your columns below.`
          : "No rows detected—double-check your CSV.",
      );
    } catch (error) {
      setHeaders([]);
      setRowObjects([]);
      setStatus(error instanceof Error ? error.message : "Unable to read that CSV.");
    }
  };

  const handleImport = async () => {
    if (!mapping.displayName) {
      setStatus("Map at least a name column before importing.");
      return;
    }
    if (!rowObjects.length) {
      setStatus("Upload a CSV first.");
      return;
    }

    const preparedRows = rowObjects
      .map((row) => transformDancerRow(row, mapping))
      .filter((row): row is NonNullable<ReturnType<typeof transformDancerRow>> =>
        Boolean(row),
      );

    if (!preparedRows.length) {
      setStatus("No usable rows detected after mapping.");
      return;
    }

    setImporting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/dancers/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          rows: preparedRows,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to import customers.");
      }
      setStatus(`Imported ${json.imported} customers.`);
      setHeaders([]);
      setRowObjects([]);
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
        <h3 className="text-sm font-semibold text-white">Import VIP list</h3>
        <p className="text-xs text-silver/70">
          Upload a CSV of your regulars. We’ll map names, phones, spend, visits, and notes.
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
            {DANCER_IMPORT_FIELDS.map((field) => (
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
          disabled={!rowObjects.length || importing}
        >
          {importing ? "Importing..." : "Import customers"}
        </Button>
        {status && (
          <p className="text-xs text-silver/60 border border-white/10 rounded-lg px-3 py-1">
            {status}
          </p>
        )}
      </div>
      <p className="text-[11px] text-silver/50">
        Supported columns: name, phone, tier, spend, visits, last visit date, notes. Any
        extra columns are ignored.
      </p>
    </section>
  );
}

function transformDancerRow(
  row: Record<string, string>,
  mapping: Record<ImportFieldKey, string | undefined>,
) {
  const nameHeader = mapping.displayName;
  if (!nameHeader) return null;
  const displayName = row[nameHeader]?.trim();
  if (!displayName) return null;

  const phone = mapping.phone ? row[mapping.phone]?.trim() : undefined;
  const tierValue = mapping.tier ? row[mapping.tier]?.trim() : undefined;
  const spendValue = mapping.totalSpendCents ? row[mapping.totalSpendCents] : undefined;
  const visitsValue = mapping.visitsCount ? row[mapping.visitsCount] : undefined;
  const lastVisitValue = mapping.lastVisitAt ? row[mapping.lastVisitAt] : undefined;
  const notesValue = mapping.notes ? row[mapping.notes] : undefined;

  return {
    displayName,
    phone: phone || undefined,
    tier: tierValue ? normalizeTier(tierValue) : undefined,
    totalSpendCents: spendValue ? parseCurrency(spendValue) : undefined,
    visitsCount: visitsValue ? parseInt(visitsValue, 10) || undefined : undefined,
    lastVisitAt: parseDate(lastVisitValue),
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

function normalizeTier(value: string): DancerCustomerTier {
  const normalized = value.toLowerCase();
  if (normalized.startsWith("whale")) return DancerCustomerTier.WHALE;
  if (normalized.startsWith("reg")) return DancerCustomerTier.REGULAR;
  if (normalized.startsWith("occ")) return DancerCustomerTier.OCCASIONAL;
  return DancerCustomerTier.TEST;
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

