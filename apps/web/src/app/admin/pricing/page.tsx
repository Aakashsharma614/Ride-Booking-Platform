"use client";
import { TrendingUp, MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapView } from "@/components/shared/MapView";
import { formatCurrency } from "@/lib/utils";

const surgeData = [
  { city: "New York", cityId: "nyc", activeDrivers: 284, openRequests: 341, surge: 1.8, zones: 3 },
  { city: "Los Angeles", cityId: "la", activeDrivers: 198, openRequests: 142, surge: 1.2, zones: 1 },
  { city: "Chicago", cityId: "chi", activeDrivers: 156, openRequests: 312, surge: 2.4, zones: 4 },
  { city: "Mumbai", cityId: "mum", activeDrivers: 512, openRequests: 890, surge: 2.9, zones: 6 },
  { city: "Delhi", cityId: "del", activeDrivers: 421, openRequests: 680, surge: 2.1, zones: 5 },
];

const fareExamples = [
  { vehicleClass: "economy", distance: "5 km", baseCents: 325, distanceCents: 725, surge: 1.0, total: 1050 },
  { vehicleClass: "comfort", distance: "5 km", baseCents: 455, distanceCents: 1015, surge: 1.4, total: 2058 },
  { vehicleClass: "premium", distance: "5 km", baseCents: 650, distanceCents: 1450, surge: 2.0, total: 4200 },
  { vehicleClass: "economy", distance: "5 km", baseCents: 325, distanceCents: 725, surge: 2.4, total: 2520 },
];

function surgeColor(s: number) {
  if (s < 1.5) return "text-emerald-400";
  if (s < 2.0) return "text-amber-400";
  return "text-red-400";
}

export default function PricingPage() {
  const avgSurge = surgeData.reduce((s, d) => s + d.surge, 0) / surgeData.length;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Pricing & Surge" subtitle="Real-time demand and fare configuration" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Avg Surge Multiplier" value={`${avgSurge.toFixed(1)}×`} change={5.2} trend="up" icon={<TrendingUp className="w-4 h-4" />} accent="amber" />
        <KpiCard label="Base Fare" value={formatCurrency(325)} icon={<TrendingUp className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Rate per km" value="$1.45" icon={<MapPin className="w-4 h-4" />} accent="emerald" />
        <KpiCard label="Max Surge Cap" value="3.0×" icon={<TrendingUp className="w-4 h-4" />} accent="red" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Live Surge by City</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {surgeData.map((d) => (
              <div key={d.cityId} className="flex items-center gap-4 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-white text-sm">{d.city}</p>
                    <span className={`text-xl font-black ${surgeColor(d.surge)}`}>{d.surge}×</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${d.surge < 1.5 ? "bg-emerald-500" : d.surge < 2 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${(d.surge / 3) * 100}%` }} />
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                    <span>{d.activeDrivers} drivers</span>
                    <span>{d.openRequests} requests</span>
                    <span>{d.zones} surge zones</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHeader className="p-4"><CardTitle className="text-base">Surge Heatmap — NYC</CardTitle></CardHeader>
          <MapView height="h-64" showSurge driverCount={18} />
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Fare Calculator Examples</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-gray-500 text-xs font-medium">
                  {["Class", "Distance", "Base", "Distance Fee", "Surge", "Total"].map((h) => <th key={h} className="pb-3 pr-6">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {fareExamples.map((f, i) => (
                  <tr key={i} className="text-gray-300">
                    <td className="py-2.5 pr-6 capitalize font-medium text-white">{f.vehicleClass}</td>
                    <td className="py-2.5 pr-6">{f.distance}</td>
                    <td className="py-2.5 pr-6">{formatCurrency(f.baseCents)}</td>
                    <td className="py-2.5 pr-6">{formatCurrency(f.distanceCents)}</td>
                    <td className={`py-2.5 pr-6 font-semibold ${surgeColor(f.surge)}`}>{f.surge}×</td>
                    <td className="py-2.5 font-bold text-emerald-400">{formatCurrency(f.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
