"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/dashboard/leads", icon: Users },
  { name: "Content", href: "/dashboard/content", icon: FileText },
];

interface SidebarProps {
  realtorSlug?: string;
}

export function Sidebar({ realtorSlug }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside className="w-64 border-r border-neutral-200 bg-white flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-neutral-100">
        <Link href="/" className="block">
          <h1 className="text-sm font-bold tracking-tight text-neutral-900">
            REAL ESTATE
          </h1>
          <p className="text-[10px] font-medium text-neutral-400 tracking-[0.2em] uppercase">
            Autopilot
          </p>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
              pathname === item.href
                ? "bg-brand-50 text-brand-600 font-medium"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-neutral-100 space-y-1">
        {realtorSlug && (
          <Link
            href={`/r/${realtorSlug}`}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Public Page
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
