"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Pickaxe,
  Users,
  FileText,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Overview",   href: "/dashboard",        icon: LayoutDashboard },
  { name: "Leads",      href: "/dashboard/leads",   icon: Users },
  { name: "Mining",     href: "/dashboard/mining",  icon: Pickaxe },
  { name: "Content",    href: "/dashboard/content", icon: FileText },
];

const ownerNav = [
  { name: "Sales",      href: "/dashboard/sales",      icon: TrendingUp },
];

interface SidebarProps {
  businessName?: string;
}

export function Sidebar({ businessName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-neutral-800/50 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-neutral-800/50">
        <Link href="/" className="block">
          <h1 className="text-xs font-bold tracking-[0.15em] text-neutral-300 uppercase">
            Lead Mine
          </h1>
          <p className="text-[10px] font-medium text-neutral-600 tracking-[0.25em] uppercase mt-0.5">
            AI Lead Generation
          </p>
        </Link>
        {businessName && (
          <p className="text-[11px] text-neutral-500 mt-2 truncate">
            {businessName}
          </p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
              pathname === item.href
                ? "bg-emerald-500/10 text-emerald-400 font-medium"
                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </Link>
        ))}

        {/* Owner-only section */}
        <div className="pt-3 mt-3 border-t border-neutral-800/50">
          <p className="px-3 mb-1 text-[10px] uppercase tracking-widest text-neutral-700">Owner</p>
          {ownerNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                  active
                    ? "bg-emerald-500/10 text-emerald-400 font-medium"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-neutral-800/50 space-y-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 rounded-lg transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
