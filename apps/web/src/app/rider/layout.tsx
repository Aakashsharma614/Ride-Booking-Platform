"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, CreditCard, Bell, User, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/rider/home",          icon: Home,       label: "Home" },
  { href: "/rider/history",       icon: Clock,      label: "Rides" },
  { href: "/rider/payments",      icon: CreditCard, label: "Payments" },
  { href: "/rider/notifications", icon: Bell,       label: "Alerts" },
  { href: "/rider/profile",       icon: User,       label: "Profile" },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.includes("/login") || pathname.includes("/signup");

  return (
    <div className="min-h-screen bg-black flex flex-col max-w-md mx-auto relative">
      {/* Top bar */}
      {!isAuth && (
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-gray-800 bg-black/90 backdrop-blur-sm">
          <Link href="/" className="p-1 text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-lg">Ride<span className="text-gradient">X</span></span>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> NYC
          </div>
        </header>
      )}

      <main className={cn("flex-1 overflow-y-auto", !isAuth && "pb-20")}>{children}</main>

      {/* Bottom nav */}
      {!isAuth && (
        <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-30 flex items-center border-t border-gray-800 bg-black/95 backdrop-blur-sm">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={cn("flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors", active ? "text-emerald-400" : "text-gray-500 hover:text-gray-300")}>
                <t.icon className="w-5 h-5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
