import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import OverviewClient from "./_components/OverviewClient";

const CAMPAIGNS = [
  { name: "Whale Upsell #4", segment: "Whales", status: "Sent", sentAt: "2 hours ago", recipients: 19, openRate: "82%" },
  { name: "Weekend Boost", segment: "Active fans", status: "Sent", sentAt: "Yesterday", recipients: 245, openRate: "57%" },
  { name: "Rebill Save", segment: "Expiring", status: "Scheduled", sentAt: "Tomorrow", recipients: 27, openRate: "—" },
];

export default async function DashboardPage() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session) {
    redirect("/signin?callbackUrl=/dashboard");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: (session.user as { id?: string })?.id ?? "" },
    select: { primaryRole: true, hasCompletedOnboarding: true },
  });

  if (dbUser && !dbUser.hasCompletedOnboarding) {
    redirect("/onboarding");
  }

  if (dbUser?.primaryRole === "CREATOR") {
    redirect("/dashboard/segments");
  }
  if (dbUser?.primaryRole === "DANCER") {
    redirect("/dashboard/dancer/customers");
  }
  if (dbUser?.primaryRole === "CLUB") {
    redirect("/dashboard/club/patrons");
  }

  return (
    <div className="space-y-8">
      <OverviewClient />
      <RecentCampaigns />
    </div>
  );
}

function RecentCampaigns() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-2 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Recent campaigns</h3>
          <p className="text-xs text-silver/60">
            A quick look at what you’ve shipped in the last week.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/campaigns">
            <Button variant="secondary" size="sm">
              View all
            </Button>
          </Link>
          <Link href="/dashboard/campaigns/new">
            <Button size="sm">New campaign</Button>
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-silver/70">
            <tr>
              <th className="px-6 py-3 font-medium">Campaign</th>
              <th className="px-6 py-3 font-medium">Segment</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Sent at</th>
              <th className="px-6 py-3 font-medium">Recipients</th>
              <th className="px-6 py-3 text-right font-medium">Open rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {CAMPAIGNS.map((campaign) => (
              <tr key={campaign.name} className="hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">{campaign.name}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-silver">
                    {campaign.segment}
                  </span>
                </td>
                <td className="px-6 py-4 text-silver">{campaign.status}</td>
                <td className="px-6 py-4 text-silver/80">{campaign.sentAt}</td>
                <td className="px-6 py-4 font-mono text-silver">{campaign.recipients}</td>
                <td className="px-6 py-4 text-right font-mono text-silver/70">
                  {campaign.openRate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

