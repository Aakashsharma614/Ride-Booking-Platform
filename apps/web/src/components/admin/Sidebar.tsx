"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Car, Map, CreditCard, TrendingUp,
  Bell, Activity, Settings, Zap, ChevronRight, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin",               label: "Overview",       icon: LayoutDashboard, exact: true },
  { href: "/admin/riders",        label: "Riders",         icon: Users },
  { href: "/admin/drivers",       label: "Drivers",        icon: Car },
  { href: "/admin/rides",         label: "Rides",          icon: Map },
  { href: "/admin/payments",      label: "Payments",       icon: CreditCard },
  { href: "/admin/pricing",       label: "Pricing",        icon: TrendingUp },
  { href: "/admin/notifications", label: "Notifications",  icon: Bell },
  { href: "/admin/analytics",     label: "Analytics",      icon: Activity },
  { href: "/admin/system",        label: "System Health",  icon: Zap },
  { href: "/admin/settings",      label: "Settings",       icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (item: typeof navItems[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-64 border-r border-gray-800 bg-black">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-brand">
          <span className="text-black font-black text-sm">RX</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm">RideX Admin</p>
          <p className="text-gray-500 text-xs">Operations Center</p>
        </div>
      </div>

      {/* Live indicator */}
      <div className="mx-4 mt-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400 text-xs font-semibold">System Operational</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin px-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all group",
              isActive(item)
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-900"
            )}
          >
            <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive(item) ? "text-emerald-400" : "text-gray-500 group-hover:text-gray-300")} />
            <span className="flex-1">{item.label}</span>
            {isActive(item) && <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white">A</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin User</p>
            <p className="text-xs text-gray-500 truncate">admin@ridex.com</p>
          </div>
        </div>
        <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
          <LogOut className="w-3.5 h-3.5" /> Exit to Portal
        </Link>
      </div>
    </aside>
  );
}
