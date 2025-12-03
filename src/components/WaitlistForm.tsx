"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Unable to join waitlist right now.");
      }

      setStatus("success");
      setMessage("You're on the list! We'll be in touch soon.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter your email"
        className="flex-1 rounded-full border border-white/10 bg-midnight-alt px-6 py-3 text-sm text-white placeholder:text-silver/60 focus:outline-none focus:border-magenta"
      />
      <Button
        type="submit"
        disabled={status === "loading"}
        className="whitespace-nowrap"
      >
        {status === "loading" ? "Joining..." : "Join waitlist"}
      </Button>
      {message && (
        <p className={`text-xs ${status === "success" ? "text-success" : "text-danger"}`}>
          {message}
        </p>
      )}
    </form>
  );
}

