"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, DollarSign, Star, Car, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/driver/dashboard", label: "Home",     icon: LayoutDashboard },
  { href: "/driver/active",    label: "Ride",      icon: Car },
  { href: "/driver/earnings",  label: "Earnings",  icon: DollarSign },
  { href: "/driver/ratings",   label: "Ratings",   icon: Star },
  { href: "/driver/profile",   label: "Profile",   icon: User },
];

const AUTH_PATHS = ["/driver/login", "/driver/register"];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuth) {
    return <div className="min-h-screen bg-black">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Top header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-black/95 backdrop-blur-md border-b border-gray-900">
        <span className="text-xl font-black text-white">RideX <span className="text-xs font-normal text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full px-2 py-0.5">DRIVER</span></span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs text-gray-400">Chicago, IL</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-md border-t border-gray-900">
        <div className="max-w-md mx-auto flex items-center">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/driver/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn("flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors", active ? "text-blue-400" : "text-gray-500 hover:text-gray-300")}>
                <item.icon className={cn("w-5 h-5", active ? "text-blue-400" : "")} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-blue-400" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
