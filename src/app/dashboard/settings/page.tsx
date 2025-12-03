"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { SegmentKey } from "@/lib/segments";
import type { AccountRole } from "@prisma/client";

type TelegramSegment = SegmentKey | "CUSTOM";

const SEGMENT_OPTIONS: TelegramSegment[] = ["WHALE", "NEW", "EXPIRING", "GHOST", "MID", "LOW", "CUSTOM"];
const SEGMENT_LABELS: Record<TelegramSegment, string> = {
  WHALE: "Whales",
  NEW: "New subs",
  EXPIRING: "Expiring soon",
  GHOST: "Ghosts",
  MID: "Mid spenders",
  LOW: "Low spenders",
  CUSTOM: "Custom audience",
};

type TelegramChannel = {
  id: string;
  segment: SegmentKey | null;
  chatId: string;
  title?: string | null;
};

type DancerChannel = {
  id: string;
  dancerTier: "WHALE" | "REGULAR" | "OCCASIONAL" | "TEST" | null;
  chatId: string;
  title?: string | null;
};

const DANCER_TIER_OPTIONS = ["WHALE", "REGULAR", "OCCASIONAL", "TEST"] as const;
const DANCER_TIER_LABELS: Record<
  (typeof DANCER_TIER_OPTIONS)[number],
  string
> = {
  WHALE: "Whales",
  REGULAR: "Regulars",
  OCCASIONAL: "Occasional",
  TEST: "Test / new",
};

export default function SettingsPage() {
  const [connected, setConnected] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-silver/60">Settings</p>
        <h1 className="font-heading text-2xl font-semibold text-white">Workspace & billing</h1>
        <p className="text-sm text-silver/70">
          Manage your OnlyFans connection, billing, and notification preferences.
        </p>
      </div>

      <RolePreferencesCard />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="font-heading text-lg font-semibold text-white">OnlyFans connection</h3>
          <p className="mt-2 text-sm text-silver/70">
            Securely sync fans, tips, rebills, and DMs. RepurpX never sends without your
            explicit approval.
          </p>
          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-silver/80">
            <p className="font-semibold text-white">
              Status:{" "}
              <span className={connected ? "text-success" : "text-warning"}>
                {connected ? "Connected" : "Not connected"}
              </span>
            </p>
            <p className="mt-2 text-xs">
              {connected
                ? "Last synced 12 minutes ago."
                : "Connect to start importing fans and sending campaigns."}
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => setConnected(true)}>
              {connected ? "Reconnect account" : "Connect OnlyFans"}
            </Button>
            {connected && (
              <Button variant="secondary" onClick={() => setConnected(false)}>
                Disconnect
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold text-white">Plan & billing</h3>
          <p className="mt-2 text-sm text-silver/70">
            You’re on the <strong className="text-white">Pro</strong> plan.
          </p>
          <div className="mt-4 space-y-2 text-sm text-silver/70">
            <p>• 10k fan limit</p>
            <p>• Unlimited campaigns + templates</p>
            <p>• AI rewrites & insights</p>
          </div>
          <p className="text-xs text-silver/60">Next charge: Nov 30</p>
          <div className="mt-4 flex gap-3">
            <Button variant="secondary">Manage billing</Button>
            <Button variant="ghost">Upgrade</Button>
          </div>
        </Card>
      </div>

      <TelegramSettingsSection />
      <DancerTelegramSettingsSection />
    </div>
  );
}

function RolePreferencesCard() {
  const { data: session, update } = useSession();
  const roles = (session?.user?.roles ?? []) as AccountRole[];
  const [primary, setPrimary] = useState<AccountRole>(
    (session?.user?.primaryRole as AccountRole | undefined) ?? roles[0] ?? "CREATOR",
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (!roles.length) {
    return null;
  }

  const updatePrimary = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryRole: primary }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Unable to update primary workspace.");
      }
      await update?.();
      setStatus("Primary workspace updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update role.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h3 className="font-heading text-lg font-semibold text-white">Workspaces</h3>
      <p className="mt-2 text-sm text-silver/70">
        You can enable multiple roles—creator, dancer, and club—and jump between them in
        the sidebar. Choose which one loads first after you log in.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {roles.map((role) => (
          <label
            key={role}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              primary === role
                ? "border-magenta/40 bg-magenta/10 text-white"
                : "border-white/10 text-silver/80"
            }`}
          >
            <input
              type="radio"
              name="primary-role"
              value={role}
              checked={primary === role}
              onChange={() => setPrimary(role)}
            />
            <div>
              <p className="font-semibold text-white">{ROLE_LABELS[role].title}</p>
              <p className="text-[11px] text-silver/60">{ROLE_LABELS[role].description}</p>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={updatePrimary} disabled={saving}>
          {saving ? "Saving..." : "Set as primary"}
        </Button>
        {status && <p className="text-xs text-silver/70">{status}</p>}
      </div>
      <p className="mt-3 text-[11px] text-silver/50">
        Want to add another role? Contact support and we’ll unlock the workspace for you.
      </p>
    </Card>
  );
}

const ROLE_LABELS: Record<AccountRole, { title: string; description: string }> = {
  CREATOR: {
    title: "Online fans",
    description: "Segments, campaigns, templates, and Telegram.",
  },
  DANCER: {
    title: "Dancer CRM",
    description: "VIP tiers, SMS blasts, and regular tracking.",
  },
  CLUB: {
    title: "Club CRM",
    description: "VIP patrons, birthdays, and bottle follow-ups.",
  },
};

function TelegramSettingsSection() {
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [creatorAccountId, setCreatorAccountId] = useState<string | null>(null);
  const [segment, setSegment] = useState<TelegramSegment>("WHALE");
  const [chatId, setChatId] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/telegram/channels")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Unable to load Telegram channels");
        }
        return res.json();
      })
      .then((json: { channels: TelegramChannel[]; creatorAccountId?: string }) => {
        if (!mounted) return;
        setChannels(json.channels ?? []);
        if (json.creatorAccountId) {
          setCreatorAccountId(json.creatorAccountId);
        }
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

  const saveChannel = async () => {
    if (!creatorAccountId) {
      setStatus("No creator account found. Connect OnlyFans first.");
      return;
    }
    if (!chatId.trim()) {
      setStatus("Enter the Telegram chat ID for this segment.");
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/telegram/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          segment,
          chatId,
          title,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save channel.");
      }
      setChannels(json.channels ?? []);
      setStatus("Telegram channel saved.");
      setChatId("");
      setTitle("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save Telegram channel.";
      setStatus(message);
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async (channel: TelegramChannel) => {
    if (!creatorAccountId) {
      setStatus("No creator account found.");
      return;
    }
    setTestingChannelId(channel.id);
    setStatus(null);
    try {
      const res = await fetch("/api/telegram/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          segment: channel.segment ?? "CUSTOM",
          text: "🔔 Test message from RepurpX — your Telegram channel is connected.",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Unable to send test.");
      }
      setStatus("Test message sent.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send test message.";
      setStatus(message);
    } finally {
      setTestingChannelId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-midnight-alt/40 p-6">
      <div>
        <h3 className="font-heading text-lg font-semibold text-white">
          Telegram broadcasts
        </h3>
        <p className="text-sm text-silver/70">
          Map segments to Telegram channels so RepurpX can broadcast to your whales,
          new subs, and ghost lists in one click.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-silver/60">Loading channels…</p>
      ) : channels.length === 0 ? (
        <p className="text-sm text-silver/60">
          No Telegram channels yet. Add one below to start sending broadcasts.
        </p>
      ) : (
        <div className="space-y-3">
          {channels.map((channel) => {
            const key = channel.segment ?? "CUSTOM";
            return (
              <div
                key={channel.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-silver/80 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-white">
                    {SEGMENT_LABELS[key]}
                  </p>
                  <p className="text-[11px] text-silver/60">
                    chatId: <span className="font-mono">{channel.chatId}</span>
                  </p>
                  {channel.title && (
                    <p className="text-[11px] text-silver/50">{channel.title}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => sendTest(channel)}
                  disabled={testingChannelId === channel.id}
                >
                  {testingChannelId === channel.id ? "Testing…" : "Send test"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="h-px w-full bg-white/10" />

      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">Add / update channel</p>
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={segment}
            onChange={(event) => setSegment(event.target.value as TelegramSegment)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-magenta"
          >
            {SEGMENT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {SEGMENT_LABELS[value]}
              </option>
            ))}
          </select>
          <input
            value={chatId}
            onChange={(event) => setChatId(event.target.value)}
            placeholder="Telegram chat ID"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-magenta"
          />
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Label (optional)"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-magenta"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={saveChannel} disabled={saving}>
            {saving ? "Saving…" : "Save channel"}
          </Button>
          {status && <p className="text-xs text-silver/60">{status}</p>}
        </div>
        <p className="text-[11px] text-silver/50">
          Tip: Create a Telegram channel/group, add the RepurpX bot as an admin, send a
          message, then use a helper bot (like @RawDataBot) to grab the chat ID.
        </p>
      </div>
    </section>
  );
}

function DancerTelegramSettingsSection() {
  const [channels, setChannels] = useState<DancerChannel[]>([]);
  const [creatorAccountId, setCreatorAccountId] = useState<string | null>(null);
  const [tier, setTier] =
    useState<(typeof DANCER_TIER_OPTIONS)[number]>("WHALE");
  const [chatId, setChatId] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/telegram/dancer-channels")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Unable to load dancer channels");
        }
        return res.json();
      })
      .then(
        (json: { channels: DancerChannel[]; creatorAccountId?: string }) => {
          if (!mounted) return;
          setChannels(json.channels ?? []);
          setCreatorAccountId(json.creatorAccountId ?? null);
          setStatus(null);
        },
      )
      .catch((err) => {
        if (!mounted) return;
        setStatus(err.message);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const saveChannel = async () => {
    if (!creatorAccountId) {
      setStatus("No dancer account found yet.");
      return;
    }
    if (!chatId.trim()) {
      setStatus("Enter the Telegram chat ID for this tier.");
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/telegram/dancer-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          dancerTier: tier,
          chatId,
          title,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save dancer channel.");
      }
      setChannels(json.channels ?? []);
      setStatus("Dancer Telegram channel saved.");
      setChatId("");
      setTitle("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save Telegram channel.";
      setStatus(message);
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async (channel: DancerChannel) => {
    if (!creatorAccountId) {
      setStatus("No dancer account found.");
      return;
    }
    if (!channel.dancerTier) {
      setStatus("Channel is missing a dancer tier.");
      return;
    }
    setTestingChannelId(channel.id);
    setStatus(null);
    try {
      const res = await fetch("/api/telegram/dancers/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId,
          tier: channel.dancerTier,
          text: "🔔 Test broadcast from RepurpX — your dancer channel is connected.",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Unable to send test.");
      }
      setStatus("Test message sent to that dancer tier.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send test.";
      setStatus(message);
    } finally {
      setTestingChannelId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-midnight-alt/40 p-6">
      <div>
        <h3 className="font-heading text-lg font-semibold text-white">
          Dancer Telegram tiers
        </h3>
        <p className="text-sm text-silver/70">
          Map dancer tiers (whales, regulars, occasional) to Telegram channels to send
          pre-shift broadcasts.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-silver/60">Loading dancer channels…</p>
      ) : !creatorAccountId ? (
        <p className="text-sm text-silver/60">
          No dancer workspace detected yet. Create a dancer account to unlock these
          controls.
        </p>
      ) : channels.length === 0 ? (
        <p className="text-sm text-silver/60">
          No tiers mapped yet. Add one below to start messaging your whales and VIPs.
        </p>
      ) : (
        <div className="space-y-3">
          {channels.map((channel) => {
            const tierKey =
              (channel.dancerTier as (typeof DANCER_TIER_OPTIONS)[number]) ??
              "TEST";
            return (
              <div
                key={channel.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-silver/80 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-white">
                    {DANCER_TIER_LABELS[tierKey]}
                  </p>
                  <p className="text-[11px] text-silver/60">
                    chatId: <span className="font-mono">{channel.chatId}</span>
                  </p>
                  {channel.title && (
                    <p className="text-[11px] text-silver/50">{channel.title}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => sendTest(channel)}
                  disabled={testingChannelId === channel.id}
                >
                  {testingChannelId === channel.id ? "Testing…" : "Send test"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="h-px w-full bg-white/10" />

      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">
          Add / update dancer tier channel
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={tier}
            onChange={(event) =>
              setTier(event.target.value as (typeof DANCER_TIER_OPTIONS)[number])
            }
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-magenta"
          >
            {DANCER_TIER_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {DANCER_TIER_LABELS[value]}
              </option>
            ))}
          </select>
          <input
            value={chatId}
            onChange={(event) => setChatId(event.target.value)}
            placeholder="Telegram chat ID"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-magenta"
          />
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Label (optional)"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-magenta"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={saveChannel} disabled={saving || !creatorAccountId}>
            {saving ? "Saving…" : "Save tier channel"}
          </Button>
          {status && <p className="text-xs text-silver/60">{status}</p>}
        </div>
        <p className="text-[11px] text-silver/50">
          Each tier can have one Telegram destination. Add the RepurpX bot as admin, grab
          the chat ID, and paste it here.
        </p>
      </div>
    </section>
  );
}

