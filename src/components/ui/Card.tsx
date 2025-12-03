import clsx from "clsx";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: string;
  hoverEffect?: boolean;
}

export function Card({
  children,
  className,
  padding = "p-6",
  hoverEffect = false,
}: CardProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-xl border border-border bg-card",
        hoverEffect && "transition-transform duration-300 hover:-translate-y-1 hover:border-white/20",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-magenta/40 to-transparent opacity-50" />
      <div className={clsx("relative z-10 h-full", padding)}>{children}</div>
    </div>
  );
}

