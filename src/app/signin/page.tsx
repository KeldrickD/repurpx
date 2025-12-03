"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else if (result?.ok) {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-midnight px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-magenta to-violet font-heading text-lg font-bold shadow-[0_0_20px_rgba(255,29,206,0.3)]">
            X
          </div>
          <h1 className="font-heading text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-silver/70">
            Log in to your RepurpX workspace to keep the DMs flowing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-midnight-alt px-4 py-3 text-sm text-white placeholder:text-silver/60 focus:outline-none focus:border-magenta"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Log in"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-silver/60">
          Need an account?{" "}
          <Link href="/signup" className="text-magenta hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

