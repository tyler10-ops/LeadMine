import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime } from "@/lib/utils";
import type { Lead } from "@/types";

interface RecentLeadsProps {
  leads: Lead[];
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  return (
    <Card className="col-span-2">
      <CardTitle>Recent Leads</CardTitle>
      {leads.length === 0 ? (
        <p className="text-sm text-neutral-400 mt-4">
          No leads captured yet. Share your page to start generating leads.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-neutral-100">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600">
                  {(lead.name || lead.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {lead.name || lead.email}
                  </p>
                  {lead.name && (
                    <p className="text-xs text-neutral-500">{lead.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={lead.intent}>{lead.intent}</Badge>
                <span className="text-xs text-neutral-400">
                  {getRelativeTime(lead.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
