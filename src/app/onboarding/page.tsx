"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getQuickTemplatesForRole, QuickTemplate } from "@/lib/quickTemplates";

type AccountRole = "CREATOR" | "DANCER" | "CLUB";
type CreatorPlatform = "ONLYFANS" | "DANCER" | "CLUB";

type CreatorAccountSummary = {
  id: string;
  platform: CreatorPlatform;
};

type Profile = {
  userId: string;
  roles: AccountRole[];
  primaryRole: AccountRole | null;
  hasCompletedOnboarding: boolean;
  accounts: CreatorAccountSummary[];
};

type DancerImportPayload = {
  displayName: string;
  phone?: string;
  tier?: "WHALE" | "REGULAR" | "OCCASIONAL" | "TEST";
  totalSpendCents?: number;
  visitsCount?: number;
  lastVisitAt?: string;
  notes?: string;
};

type ClubImportPayload = {
  displayName: string;
  phone?: string;
  vipStatus?: "NONE" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  totalSpendCents?: number;
  visitsCount?: number;
  lastVisitAt?: string;
  birthday?: string;
  notes?: string;
};

type StepId = "roles" | "data" | "campaign";

const ROLE_TO_PLATFORM: Record<AccountRole, CreatorPlatform> = {
  CREATOR: "ONLYFANS",
  DANCER: "DANCER",
  CLUB: "CLUB",
};

const ROLE_OPTIONS: {
  id: AccountRole;
  label: string;
  description: string;
}[] = [
  {
    id: "CREATOR",
    label: "Online creator / OnlyFans",
    description: "Segment fans, send DM campaigns, and reuse AI templates.",
  },
  {
    id: "DANCER",
    label: "Dancer / entertainer",
    description: "Track whales, text VIPs, and keep regulars warm.",
  },
  {
    id: "CLUB",
    label: "Club / venue",
    description: "Manage VIP patrons, birthdays, and bottle buyers.",
  },
];

const CHANNEL_OPTIONS: Record<AccountRole, ("SMS" | "TELEGRAM")[]> = {
  CREATOR: ["TELEGRAM"],
  DANCER: ["SMS", "TELEGRAM"],
  CLUB: ["SMS"],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [step, setStep] = useState<StepId>("roles");

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/account/profile");
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Unable to load account profile.");
    }
    setProfile(json);
    if (json.hasCompletedOnboarding) {
      router.replace("/dashboard");
    }
    return json as Profile;
  }, [router]);

  useEffect(() => {
    loadProfile()
      .catch((error) => {
        console.error(error);
      })
      .finally(() => setInitializing(false));
  }, [loadProfile]);

  const accountIds = useMemo(() => {
    const map: Partial<Record<AccountRole, string | null>> = {};
    profile?.accounts?.forEach((account) => {
      const role = (Object.keys(ROLE_TO_PLATFORM) as AccountRole[]).find(
        (key) => ROLE_TO_PLATFORM[key] === account.platform,
      );
      if (role) {
        map[role] = account.id;
      }
    });
    return map;
  }, [profile?.accounts]);

  const totalSteps: StepId[] = ["roles", "data", "campaign"];
  const stepIndex = totalSteps.indexOf(step);

  const goNext = () => {
    if (stepIndex < totalSteps.length - 1) {
      setStep(totalSteps[stepIndex + 1]);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStep(totalSteps[stepIndex - 1]);
    }
  };

  if (initializing || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05000f] text-slate-300">
        <p className="text-sm text-slate-400">Preparing your workspace…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#05000f] to-[#050508] text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-fuchsia-500/20 text-xs font-bold text-fuchsia-200">
              RX
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                RepurpX Onboarding
              </p>
              <p className="text-xs text-slate-400">
                Let&apos;s build the fastest path to your next sale.
              </p>
            </div>
          </div>
        </header>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {totalSteps.map((id, idx) => {
            const active = id === step;
            const done = idx < stepIndex;
            return (
              <div key={id} className="flex flex-1 items-center gap-2">
                <div
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                    done
                      ? "bg-fuchsia-500 text-white"
                      : active
                        ? "bg-white text-black"
                        : "bg-white/10 text-slate-400",
                  ].join(" ")}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 max-sm:hidden">
                  {id === "roles" && "Choose roles"}
                  {id === "data" && "Add your people"}
                  {id === "campaign" && "Send first campaign"}
                </div>
                {idx < totalSteps.length - 1 && (
                  <div className="hidden h-px flex-1 bg-white/10 sm:block" />
                )}
              </div>
            );
          })}
        </div>

        <main className="flex-1">
          {step === "roles" && (
            <RolesStep
              profile={profile}
              onNext={goNext}
              onProfileRefresh={loadProfile}
            />
          )}
          {step === "data" && (
            <DataStep
              profile={profile}
              accountIds={accountIds}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === "campaign" && (
            <FirstCampaignStep
              profile={profile}
              accountIds={accountIds}
              onBack={goBack}
              onDone={async () => {
                await fetch("/api/account/onboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ hasCompletedOnboarding: true }),
                });
                router.replace("/dashboard");
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function RolesStep({
  profile,
  onNext,
  onProfileRefresh,
}: {
  profile: Profile;
  onNext: () => void;
  onProfileRefresh: () => Promise<Profile>;
}) {
  const [roles, setRoles] = useState<AccountRole[]>(profile.roles ?? []);
  const [primaryRole, setPrimaryRole] = useState<AccountRole | null>(
    profile.primaryRole ?? profile.roles[0] ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRoles(profile.roles ?? []);
    setPrimaryRole(profile.primaryRole ?? profile.roles[0] ?? null);
  }, [profile.primaryRole, profile.roles]);

  const toggleRole = (role: AccountRole) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
    if (!primaryRole) {
      setPrimaryRole(role);
    }
  };

  const handleContinue = async () => {
    if (!roles.length) {
      setError("Pick at least one role to continue.");
      return;
    }
    if (!primaryRole || !roles.includes(primaryRole)) {
      setError("Choose a primary workspace.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles, primaryRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save roles.");
      }
      const updated = await onProfileRefresh();
      setRoles(updated.roles ?? []);
      setPrimaryRole(updated.primaryRole ?? primaryRole);
      onNext();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save roles.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl shadow-black/40">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          What best describes you?
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Select every role that applies. We&apos;ll tailor your workspace and
          automations accordingly.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {ROLE_OPTIONS.map((opt) => {
          const active = roles.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleRole(opt.id)}
              className={[
                "rounded-xl border p-4 text-left transition",
                active
                  ? "border-fuchsia-500/50 bg-fuchsia-500/10"
                  : "border-white/10 bg-black/40 hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5",
              ].join(" ")}
            >
              <p className="text-sm font-semibold text-white">{opt.label}</p>
              <p className="mt-1 text-xs text-slate-400">{opt.description}</p>
            </button>
          );
        })}
      </div>

      {roles.length > 0 && (
        <div className="space-y-2 rounded-xl bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Main focus
          </p>
          <p className="text-xs text-slate-400">
            This determines which dashboard we load first. You can switch later.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setPrimaryRole(role)}
                className={[
                  "rounded-full px-3 py-1 text-xs",
                  primaryRole === role
                    ? "bg-white text-black"
                    : "bg-white/10 text-slate-200",
                ].join(" ")}
              >
                {role === "CREATOR" && "Online fans"}
                {role === "DANCER" && "Dancer VIPs"}
                {role === "CLUB" && "Club patrons"}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={handleContinue}
          className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black shadow hover:bg-slate-100 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </section>
  );
}

function DataStep({
  profile,
  accountIds,
  onNext,
  onBack,
}: {
  profile: Profile;
  accountIds: Partial<Record<AccountRole, string | null>>;
  onNext: () => void;
  onBack: () => void;
}) {
  const primary =
    profile.primaryRole ?? profile.roles[0] ?? ("DANCER" as AccountRole);
  const [status, setStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(
    primary === "CREATOR",
  );
  const [skip, setSkip] = useState(primary === "CREATOR");

  useEffect(() => {
    setStatus(null);
    if (primary === "CREATOR") {
      setImportComplete(true);
      setSkip(true);
    } else {
      setImportComplete(false);
      setSkip(false);
    }
  }, [primary]);

  const handleCsvUpload = async (role: AccountRole, file: File) => {
    const accountId = accountIds[role];
    if (!accountId) {
      setStatus("We couldn't detect a workspace for this role yet.");
      return;
    }

    setImporting(true);
    setStatus(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      let endpoint = "";
      let payloadRows: DancerImportPayload[] | ClubImportPayload[] = [];

      if (role === "DANCER") {
        payloadRows = transformDancerRows(rows);
        endpoint = "/api/dancers/customers/import";
      } else if (role === "CLUB") {
        payloadRows = transformClubRows(rows);
        endpoint = "/api/clubs/patrons/import";
      }

      if (!payloadRows.length) {
        setStatus("No usable rows found in that CSV.");
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId: accountId,
          rows: payloadRows,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to import.");
      }
      setImportComplete(true);
      setStatus(`Imported ${json.imported} contacts.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to import right now.";
      setStatus(message);
    } finally {
      setImporting(false);
    }
  };

  const canContinue = importComplete || skip;

  const renderImportCard = () => {
    if (primary === "CREATOR") {
      return (
        <div className="space-y-3 rounded-xl bg-white/5 p-4">
          <h2 className="text-sm font-semibold text-slate-100">
            Fan import coming soon
          </h2>
          <p className="text-xs text-slate-400">
            OF’s official export isn’t live yet. You can still finish onboarding
            and sync data later from Settings.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 rounded-xl bg-white/5 p-4">
        <h2 className="text-sm font-semibold text-slate-100">
          Import your {primary === "DANCER" ? "VIP list" : "club patrons"}
        </h2>
        <p className="text-xs text-slate-400">
          Upload a CSV with columns like name, phone, tier/VIP status, spend,
          visits, last visit, birthday, notes. We&apos;ll keep the rest optional.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              handleCsvUpload(primary, file);
            }
          }}
          className="text-xs text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-fuchsia-500/20 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-fuchsia-500/30"
        />
        <p className="text-[11px] text-slate-500">
          Need a template? Export your VIP list from Sheets or Excel with those
          column names and drop it here.
        </p>
      </div>
    );
  };

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl shadow-black/40">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          Let&apos;s pull in your people.
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Fans, whales, patrons, regulars—RepurpX works best when it sees who
          already spends money on you.
        </p>
      </div>

      {renderImportCard()}

      <div className="space-y-2 rounded-xl bg-amber-500/10 p-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-amber-100">
          <input
            type="checkbox"
            checked={skip}
            onChange={(event) => setSkip(event.target.checked)}
            className="h-3 w-3 rounded border border-amber-300/70 bg-transparent"
          />
          No CSV handy. I&apos;ll add people later.
        </label>
        <p className="text-[11px] text-amber-100">
          Even if you skip, we&apos;ll show you how messaging works so you can
          start making money immediately.
        </p>
      </div>

      {status && <p className="text-xs text-slate-300">{status}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/20 px-4 py-2 text-xs text-slate-200 hover:bg-white/5"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!canContinue || importing}
          onClick={onNext}
          className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black shadow hover:bg-slate-100 disabled:opacity-60"
        >
          Continue to first campaign
        </button>
      </div>
    </section>
  );
}

function FirstCampaignStep({
  profile,
  accountIds,
  onBack,
  onDone,
}: {
  profile: Profile;
  accountIds: Partial<Record<AccountRole, string | null>>;
  onBack: () => void;
  onDone: () => Promise<void>;
}) {
  const primary =
    profile.primaryRole ?? profile.roles[0] ?? ("DANCER" as AccountRole);
  const availableChannels = CHANNEL_OPTIONS[primary];
  const [channel, setChannel] = useState<"SMS" | "TELEGRAM">(
    availableChannels[0],
  );
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [recap, setRecap] = useState<{
    toCount?: number;
    channel: "SMS" | "TELEGRAM";
    role: AccountRole;
  } | null>(null);

  const quickTemplates = getQuickTemplatesForRole(primary);

  useEffect(() => {
    setChannel(CHANNEL_OPTIONS[primary][0]);
  }, [primary]);

  useEffect(() => {
    if (message || quickTemplates.length === 0) return;
    // default to first template for this role
    setMessage(quickTemplates[0].body);
  }, [message, primary, quickTemplates]);

  function applyTemplate(tpl: QuickTemplate) {
    setMessage(tpl.body);
    setStatus(null);
  }

  const sendCampaign = async () => {
    const accountId = accountIds[primary] ?? null;
    if (!accountId) {
      setStatus("We couldn’t find a workspace for this role yet.");
      return;
    }
    if (!message.trim()) {
      setStatus("Write a quick message first.");
      return;
    }

    setSending(true);
    setStatus(null);
    try {
      const payload = message.trim();
      let res: Response;

      if (primary === "DANCER") {
        if (channel === "SMS") {
          res = await fetch("/api/sms/dancers/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creatorAccountId: accountId,
              tier: "WHALE",
              text: payload,
            }),
          });
        } else {
          res = await fetch("/api/telegram/dancers/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creatorAccountId: accountId,
              tier: "WHALE",
              text: payload,
            }),
          });
        }
      } else if (primary === "CLUB") {
        if (channel === "SMS") {
          res = await fetch("/api/sms/clubs/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creatorAccountId: accountId,
              vipStatus: "GOLD",
              filter: "ALL",
              text: payload,
            }),
          });
        } else {
          // Placeholder for club telegram if needed
          res = await fetch("/api/telegram/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creatorAccountId: accountId,
              segment: "WHALE", // fallback
              text: payload,
            }),
          });
        }
      } else {
        res = await fetch("/api/telegram/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorAccountId: accountId,
            segment: "WHALE",
            text: payload,
          }),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        if (
          json.code === "SMS_LIMIT_EXCEEDED" ||
          json.code === "SMS_NOT_ALLOWED"
        ) {
          setStatus(
            "You hit the current SMS limit. Upgrade on the Billing tab to send more.",
          );
        } else {
          setStatus(json.error || "Failed to send campaign.");
        }
        return;
      }

      setRecap({
        toCount: json.toCount || json.successCount,
        channel,
        role: primary as AccountRole,
      });
      setStatus(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to send campaign right now.";
      setStatus(message);
    } finally {
      setSending(false);
    }
  };

  function recapAudienceLabel(role: AccountRole) {
    if (role === "DANCER") return "your VIP regulars";
    if (role === "CLUB") return "your club VIPs";
    return "your top online fans";
  }

  if (recap) {
    return (
      <section className="space-y-6 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl shadow-black/40">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            First campaign sent 🎉
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            You just did more outreach in a few seconds than most people do all
            week.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 via-black to-indigo-500/20 p-5 shadow-lg shadow-black/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-200">
                Campaign summary
              </p>
              <p className="mt-1 text-sm text-slate-50">
                {recap.toCount
                  ? `Sent to ${recap.toCount} contacts`
                  : "Campaign sent successfully"}
              </p>
              <p className="text-xs text-slate-200">
                Target: {recapAudienceLabel(recap.role)}
              </p>
            </div>
            <div className="rounded-xl bg-black/50 px-3 py-2 text-right">
              <p className="text-[11px] font-semibold text-slate-200">
                {recap.channel === "SMS" ? "SMS broadcast" : "Telegram broadcast"}
              </p>
              <p className="text-xs text-slate-400">
                Role:{" "}
                {recap.role === "DANCER"
                  ? "Dancer"
                  : recap.role === "CLUB"
                    ? "Club"
                    : "Creator"}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-black/60 p-3 text-xs text-slate-100">
            <p className="mb-1 font-semibold text-slate-200">
              What happens next?
            </p>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li>• You can see this blast in your SMS Activity log.</li>
              {recap.role === "DANCER" && (
                <li>
                  • From your dashboard, you can hit at-risk or cold regulars
                  next.
                </li>
              )}
              {recap.role === "CLUB" && (
                <li>
                  • From the Club CRM, try a birthday-only or at-risk VIP
                  campaign.
                </li>
              )}
              {recap.role === "CREATOR" && (
                <li>
                  • On the creator dashboard, test win-back or “whales only”
                  offers.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/20 px-4 py-2 text-xs text-slate-200 hover:bg-white/5"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black shadow hover:bg-slate-100"
          >
            Go to my dashboard
          </button>
        </div>
      </section>
    );
  }

  const channelButtons = CHANNEL_OPTIONS[primary];

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl shadow-black/40">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          Send your first campaign.
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Pick a channel, keep it conversational, and click send. You can refine
          templates later.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-4 rounded-xl bg-white/5 p-4">
          {/* Channel pills */}
          <div className="flex flex-wrap gap-2">
            {channelButtons.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setChannel(option)}
                className={[
                  "rounded-full px-3 py-1 text-[11px]",
                  channel === option
                    ? "bg-white text-black"
                    : "bg-white/10 text-slate-200",
                ].join(" ")}
              >
                {option === "SMS" ? "SMS text" : "Telegram"}
              </button>
            ))}
          </div>

          {/* Quick templates row */}
          {quickTemplates.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Quick templates
              </p>
              <div className="flex flex-wrap gap-2">
                {quickTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] text-slate-100 hover:border-fuchsia-500/60 hover:bg-fuchsia-500/10"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                Tap a template to drop it in, then edit it so it sounds like
                you.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-200">
              Message
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none ring-0 focus:border-fuchsia-500"
              placeholder="Type what you’d normally send your whales…"
            />
            <p className="text-[10px] text-slate-500">
              Start from a template or write your own. You’re talking to real
              people, so keep it in your voice.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Preview
          </p>
          <div className="rounded-2xl bg-black/70 p-4 text-sm text-slate-100 shadow-inner shadow-black/80">
            {message || "Your message will appear here."}
          </div>
          <p className="text-[11px] text-slate-500">
            RepurpX respects your plan limits. If you’re out of credits we’ll
            let you know before sending.
          </p>
        </div>
      </div>

      {status && <p className="text-xs text-slate-300">{status}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/20 px-4 py-2 text-xs text-slate-200 hover:bg-white/5"
        >
          Back
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={sendCampaign}
          className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black shadow hover:bg-slate-100 disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send & finish onboarding"}
        </button>
      </div>
    </section>
  );
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
  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const entry: Record<string, string> = {};
    headers.forEach((header, index) => {
      entry[header] = (cols[index] ?? "").trim();
    });
    return entry;
  });
}

function transformDancerRows(rows: Record<string, string>[]): DancerImportPayload[] {
  return rows
    .map<DancerImportPayload | null>((row) => {
      const name = row["displayname"] || row["name"];
      if (!name) return null;
      return {
        displayName: name,
        phone: row["phone"] || undefined,
        tier: normalizeDancerTier(row["tier"]),
        totalSpendCents: parseCurrency(row["totalspendcents"] || row["spend"]),
        visitsCount: parseInteger(row["visitscount"] || row["visits"]),
        lastVisitAt: parseDate(row["lastvisitat"] || row["lastvisit"]),
        notes: row["notes"] || undefined,
      };
    })
    .filter((row): row is DancerImportPayload => Boolean(row));
}

function transformClubRows(rows: Record<string, string>[]): ClubImportPayload[] {
  return rows
    .map<ClubImportPayload | null>((row) => {
      const name = row["displayname"] || row["name"];
      if (!name) return null;
      return {
        displayName: name,
        phone: row["phone"] || undefined,
        vipStatus: normalizeVipStatus(row["vipstatus"] || row["tier"]),
        totalSpendCents: parseCurrency(row["totalspendcents"] || row["spend"]),
        visitsCount: parseInteger(row["visitscount"] || row["visits"]),
        lastVisitAt: parseDate(row["lastvisitat"] || row["lastvisit"]),
        birthday: parseDate(row["birthday"]),
        notes: row["notes"] || undefined,
      };
    })
    .filter((row): row is ClubImportPayload => Boolean(row));
}

function normalizeDancerTier(value?: string): DancerImportPayload["tier"] {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.startsWith("whale")) return "WHALE";
  if (normalized.startsWith("reg")) return "REGULAR";
  if (normalized.startsWith("occ")) return "OCCASIONAL";
  return "TEST";
}

function normalizeVipStatus(value?: string): ClubImportPayload["vipStatus"] {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.startsWith("plat")) return "PLATINUM";
  if (normalized.startsWith("gold")) return "GOLD";
  if (normalized.startsWith("sil")) return "SILVER";
  if (normalized.startsWith("bron")) return "BRONZE";
  return "NONE";
}

function parseCurrency(value?: string) {
  if (!value) return undefined;
  const numeric = Number(value.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(numeric)) return undefined;
  return Math.round(numeric * 100);
}

function parseInteger(value?: string) {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

