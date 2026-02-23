"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Workflow,
  ScrollText,
  Newspaper,
  BarChart3,
  Users,
  FileText,
  ExternalLink,
  LogOut,
  Activity,
  Kanban,
  PhoneCall,
  CalendarCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { name: "Command Center", href: "/dashboard", icon: LayoutGrid },
  { name: "AI Assets", href: "/dashboard/assets", icon: Activity },
  { name: "Automations", href: "/dashboard/automations", icon: Workflow },
  { name: "Audit Logs", href: "/dashboard/logs", icon: ScrollText },
  { name: "Market Intel", href: "/dashboard/market", icon: Newspaper },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { divider: true } as const,
  { name: "Pipeline", href: "/dashboard/pipeline", icon: Kanban },
  { name: "AI Calling", href: "/dashboard/calling", icon: PhoneCall },
  { name: "Appointments", href: "/dashboard/appointments", icon: CalendarCheck2 },
  { divider: true } as const,
  { name: "Leads", href: "/dashboard/leads", icon: Users },
  { name: "Content", href: "/dashboard/content", icon: FileText },
];

interface HubSidebarProps {
  realtorSlug?: string;
}

export function HubSidebar({ realtorSlug }: HubSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside className="w-60 bg-[#0a0a0a] border-r border-neutral-800/50 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-neutral-800/50">
        <Link href="/" className="block">
          <h1 className="text-xs font-bold tracking-[0.15em] text-neutral-300 uppercase">
            GEM MINE
          </h1>
          <p className="text-[10px] font-medium text-neutral-600 tracking-[0.25em] uppercase mt-0.5">
            Command Center
          </p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item, i) => {
          if ("divider" in item) {
            return (
              <div
                key={`divider-${i}`}
                className="my-3 border-t border-neutral-800/50"
              />
            );
          }
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-md transition-colors",
                isActive
                  ? "bg-[#00FF88]/10 text-[#00FF88] font-medium"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-3 py-4 border-t border-neutral-800/50 space-y-0.5">
        {realtorSlug && (
          <Link
            href={`/r/${realtorSlug}`}
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 rounded-md transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Public Page
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 rounded-md transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
