"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlusCircle, CheckCircle, Clock } from "lucide-react";

const DATA = [
  { name: "Whale Upsell – Friday", segment: "Whales", status: "Sent", sentAt: "Oct 24 · 8:00 PM", recipients: 19, openRate: "82%" },
  { name: "Ghost Reactivation", segment: "Ghosts", status: "Scheduled", sentAt: "Oct 26 · 10:00 AM", recipients: 112, openRate: "—" },
  { name: "New Sub Welcome", segment: "New subs", status: "Draft", sentAt: "—", recipients: 45, openRate: "—" },
];

export default function CampaignsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-silver/60">Campaigns</p>
          <h1 className="font-heading text-2xl font-semibold text-white">Targeted DM blasts</h1>
          <p className="text-sm text-silver/70">
            Track every mass message, from whales-only drops to full-list pushes.
          </p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button icon={<PlusCircle className="h-4 w-4" />}>New campaign</Button>
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-silver/70">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Segment</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Sent at</th>
              <th className="px-6 py-4 font-medium">Recipients</th>
              <th className="px-6 py-4 text-right font-medium">Open rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {DATA.map((campaign) => (
              <tr key={campaign.name} className="hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">{campaign.name}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-silver">
                    {campaign.segment}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-silver">
                    {campaign.status === "Sent" && <CheckCircle className="h-4 w-4 text-success" />}
                    {campaign.status === "Scheduled" && <Clock className="h-4 w-4 text-warning" />}
                    <span className="text-sm">{campaign.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-silver/80">{campaign.sentAt}</td>
                <td className="px-6 py-4 font-mono text-silver">{campaign.recipients}</td>
                <td className="px-6 py-4 text-right font-mono text-silver/70">{campaign.openRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

