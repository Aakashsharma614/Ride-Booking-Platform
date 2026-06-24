import Link from "next/link";
import { Car, Shield, BarChart3, ArrowRight, Zap, Globe, Lock } from "lucide-react";

const portals = [
  {
    href: "/rider/home",
    icon: Car,
    label: "Rider App",
    desc: "Book rides, track drivers, manage payments",
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/30 hover:border-emerald-500/60",
    iconColor: "text-emerald-400",
    tag: "Passenger",
  },
  {
    href: "/driver/dashboard",
    icon: Zap,
    label: "Driver App",
    desc: "Accept rides, track earnings, manage availability",
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/30 hover:border-blue-500/60",
    iconColor: "text-blue-400",
    tag: "Driver",
  },
  {
    href: "/admin",
    icon: BarChart3,
    label: "Admin Dashboard",
    desc: "Operations center — live map, analytics, fleet management",
    color: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/30 hover:border-purple-500/60",
    iconColor: "text-purple-400",
    tag: "Enterprise",
  },
];

const features = [
  { icon: Globe, label: "10 Microservices", desc: "Kafka-driven distributed architecture" },
  { icon: Zap, label: "Real-time Updates", desc: "WebSocket events across all portals" },
  { icon: Lock, label: "JWT Auth + RBAC", desc: "Role-based access control" },
  { icon: Shield, label: "Outbox Pattern", desc: "Guaranteed event delivery" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Production-ready SaaS Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
          <span className="text-white">Ride</span>
          <span className="text-gradient">X</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-12">
          Enterprise-grade ride-hailing platform built on 10 microservices with Kafka event streaming, Redis geospatial matching, and MongoDB.
        </p>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-16">
          {portals.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`group relative flex flex-col gap-4 p-6 rounded-2xl border bg-gradient-to-b ${p.color} ${p.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl bg-gray-900/80 ${p.iconColor}`}>
                  <p.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-500 border border-gray-700 rounded-full px-2 py-0.5">{p.tag}</span>
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold text-lg mb-1">{p.label}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${p.iconColor} mt-auto`}>
                Open portal <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-3">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/50 text-sm">
              <f.icon className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium text-gray-300">{f.label}</span>
              <span className="text-gray-500 hidden sm:inline">— {f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center py-6 text-gray-600 text-xs border-t border-gray-900">
        RideX Platform · Built with Next.js 15 · Express Microservices · Kafka · Redis · MongoDB
      </footer>
    </main>
  );
}
