"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  LayoutGrid,
  Users,
  Send,
  Settings,
  LogOut,
  Menu,
  X,
  PlusCircle,
  FileText,
  HeartHandshake,
  Building2,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AccountRole } from "@prisma/client";

type NavLink = {
  href: string;
  label: string;
  icon: ElementType<{ className?: string }>;
  roles?: AccountRole[];
};

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  {
    href: "/dashboard/segments",
    label: "Segments",
    icon: Users,
    roles: ["CREATOR"],
  },
  {
    href: "/dashboard/campaigns",
    label: "Campaigns",
    icon: Send,
    roles: ["CREATOR"],
  },
  {
    href: "/dashboard/templates",
    label: "Templates",
    icon: FileText,
    roles: ["CREATOR"],
  },
  {
    href: "/dashboard/dancer/customers",
    label: "Dancer CRM",
    icon: HeartHandshake,
    roles: ["DANCER"],
  },
  {
    href: "/dashboard/club/patrons",
    label: "Club CRM",
    icon: Building2,
    roles: ["CLUB"],
  },
  { href: "/dashboard/messaging/logs", label: "SMS Activity", icon: MessageSquare },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const ROLE_HOME: Record<AccountRole, { label: string; href: string }> = {
  CREATOR: { label: "Online fans", href: "/dashboard/segments" },
  DANCER: { label: "Dancer CRM", href: "/dashboard/dancer/customers" },
  CLUB: { label: "Club CRM", href: "/dashboard/club/patrons" },
};

function resolveTitle(path: string) {
  if (path.startsWith("/dashboard/segments")) return "Segments";
  if (path.startsWith("/dashboard/campaigns")) return "Campaigns";
  if (path.startsWith("/dashboard/templates")) return "Templates";
  if (path.startsWith("/dashboard/dancer")) return "Dancer CRM";
  if (path.startsWith("/dashboard/club")) return "Club CRM";
  if (path.startsWith("/dashboard/messaging")) return "SMS Activity";
  if (path.startsWith("/dashboard/billing")) return "Billing";
  if (path.startsWith("/dashboard/settings")) return "Settings";
  return "Dashboard";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRoles = useMemo(
    () => (session?.user?.roles ?? []) as AccountRole[],
    [session?.user?.roles],
  );
  const primaryRole = session?.user?.primaryRole as AccountRole | null | undefined;
  const [open, setOpen] = useState(false);

  const allowedLinks = useMemo(() => {
    if (!userRoles.length) return NAV_LINKS;
    return NAV_LINKS.filter((link) => {
      if (!link.roles) return true;
      return link.roles.some((role) => userRoles.includes(role));
    });
  }, [userRoles]);

  return (
    <div className="min-h-screen bg-midnight text-white flex">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-midnight lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-magenta to-violet font-heading text-lg font-bold shadow-[0_0_15px_rgba(255,29,206,0.3)]">
            X
          </div>
          <span className="text-xl font-semibold tracking-tight">RepurpX</span>
        </div>

        {userRoles.length > 0 && (
          <div className="space-y-2 px-6 pb-4">
            <p className="text-[11px] uppercase tracking-wide text-silver/50">
              Workspaces
            </p>
            <div className="space-y-2">
              {userRoles.map((role) => {
                const config = ROLE_HOME[role];
                return (
                  <Link
                    key={role}
                    href={config.href}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                      pathname.startsWith(config.href)
                        ? "border-magenta/40 bg-magenta/10 text-white"
                        : "border-white/10 text-silver hover:border-white/30"
                    }`}
                  >
                    <span>{config.label}</span>
                    {primaryRole === role && (
                      <span className="text-[10px] uppercase text-magenta">
                        Primary
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 px-4">
          {allowedLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors
                  ${
                    active
                      ? "border-magenta/30 bg-magenta/10 text-magenta"
                      : "border-transparent text-silver hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-silver">Current Plan</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-heading font-semibold">Pro</span>
              <span className="rounded-full bg-magenta/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-magenta">
                Active
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-magenta" />
            </div>
            <p className="mt-1 text-right text-[10px] text-silver/60">
              6.5k / 10k fans
            </p>
          </div>
          <button className="mt-4 flex w-full items-center gap-2 text-xs text-silver/70 hover:text-white">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-midnight/90 px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-magenta to-violet font-heading text-sm font-bold">
            X
          </div>
          <span className="text-lg font-semibold">RepurpX</span>
        </div>
        <button onClick={() => setOpen((prev) => !prev)} className="text-silver">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 bg-midnight/95 px-4 pt-20 pb-6 lg:hidden">
          <nav className="space-y-2">
            {allowedLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-xl border px-4 py-3 text-base font-medium
                    ${
                      active
                        ? "border-magenta/30 bg-magenta/10 text-magenta"
                        : "border-white/10 text-white"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-border bg-midnight/80 px-6 py-4 backdrop-blur lg:flex">
          <h1 className="text-xl font-heading font-semibold">{resolveTitle(pathname)}</h1>
          <div className="flex items-center gap-4">
            {userRoles.includes("CREATOR") && (
              <Link href="/dashboard/campaigns/new">
                <Button size="sm" icon={<PlusCircle className="h-4 w-4" />}>
                  New campaign
                </Button>
              </Link>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold text-silver">
              JD
            </div>
          </div>
        </header>
        <div className="px-4 pb-12 pt-24 sm:px-6 lg:px-10 lg:pt-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </div>
    </div>
  );
}

