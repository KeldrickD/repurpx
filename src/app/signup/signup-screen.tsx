"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { AccountRole } from "@prisma/client";

type RoleOption = {
  value: AccountRole;
  label: string;
  description: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "CREATOR",
    label: "OnlyFans / online creator",
    description: "Segment fans, send campaigns, use AI templates.",
  },
  {
    value: "DANCER",
    label: "Dancer / entertainer",
    description: "Track regulars, VIP tiers, SMS your whales.",
  },
  {
    value: "CLUB",
    label: "Club / venue",
    description: "Manage VIP patrons, birthdays, bottle buyers.",
  },
];

interface Props {
  plan?: string;
}

export default function SignUpScreen({ plan }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<AccountRole[]>(["CREATOR"]);
  const [primaryRole, setPrimaryRole] = useState<AccountRole>("CREATOR");

  const toggleRole = (role: AccountRole) => {
    setSelectedRoles((prev) => {
      let next: AccountRole[];
      if (prev.includes(role)) {
        if (prev.length === 1) {
          return prev;
        }
        next = prev.filter((r) => r !== role);
      } else {
        next = [...prev, role];
      }
      if (!next.includes(primaryRole)) {
        setPrimaryRole(next[0]);
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (selectedRoles.length === 0) {
        throw new Error("Select at least one role to get started.");
      }

      if (!selectedRoles.includes(primaryRole)) {
        setPrimaryRole(selectedRoles[0]);
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          plan,
          roles: selectedRoles,
          primaryRole: selectedRoles.includes(primaryRole)
            ? primaryRole
            : selectedRoles[0],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to create account.");
      }

      window.location.href = "/signin?callbackUrl=/dashboard";
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-midnight px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card/85 p-10 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-magenta to-violet font-heading text-lg font-bold shadow-[0_0_20px_rgba(255,29,206,0.3)]">
            X
          </div>
          <h1 className="font-heading text-3xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-silver/70">
            {plan
              ? `You’re starting with the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`
              : "Pick a plan later—get building now."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div>
            <label htmlFor="name" className="text-xs font-medium text-silver/70">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-midnight-alt px-4 py-3 text-sm text-white placeholder:text-silver/60 focus:outline-none focus:border-magenta"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-xs font-medium text-silver/70">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-midnight-alt px-4 py-3 text-sm text-white placeholder:text-silver/60 focus:outline-none focus:border-magenta"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-medium text-silver/70">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-midnight-alt px-4 py-3 text-sm text-white placeholder:text-silver/60 focus:outline-none focus:border-magenta"
              placeholder="At least 8 characters"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-silver/70">
                Who is RepurpX for?
              </p>
              <p className="text-sm text-silver/60">
                Select every role that applies—you can switch between them anytime.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {ROLE_OPTIONS.map((role) => {
                const active = selectedRoles.includes(role.value);
                return (
                  <button
                    type="button"
                    key={role.value}
                    onClick={() => toggleRole(role.value)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-magenta/50 bg-magenta/10 text-white"
                        : "border-white/10 text-silver hover:border-white/30"
                    }`}
                  >
                    <p className="text-sm font-semibold">{role.label}</p>
                    <p className="mt-1 text-xs text-silver/70">{role.description}</p>
                  </button>
                );
              })}
            </div>

            {selectedRoles.length > 1 && (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-silver/70">
                  Where should we start?
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {selectedRoles.map((value) => {
                    const role = ROLE_OPTIONS.find((opt) => opt.value === value);
                    if (!role) return null;
                    return (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                          primaryRole === value
                            ? "border-magenta/50 bg-magenta/10"
                            : "border-white/10"
                        }`}
                      >
                        <input
                          type="radio"
                          name="primaryRole"
                          value={value}
                          checked={primaryRole === value}
                          onChange={() => setPrimaryRole(value)}
                        />
                        <span>{role.label.split(" / ")[0]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-silver/60">
          Already using RepurpX?{" "}
          <Link href="/signin" className="text-magenta hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

