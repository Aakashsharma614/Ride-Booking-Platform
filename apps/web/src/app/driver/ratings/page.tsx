import { Star, TrendingUp, Award, ThumbsUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Progress } from "@/components/ui/progress";

const REVIEWS = [
  { id: "1", rider: "Sarah M.", rating: 5, comment: "Ahmed was super professional and knew all the shortcuts!", date: "Today", badges: ["Clean Car", "Great Music"] },
  { id: "2", rider: "John D.", rating: 5, comment: "Perfect ride, very smooth driver", date: "Yesterday", badges: ["On Time"] },
  { id: "3", rider: "Maria G.", rating: 4, comment: "Good driver, arrived a bit late", date: "2 days ago", badges: [] },
  { id: "4", rider: "Alex K.", rating: 5, comment: "Amazing experience! Would book again.", date: "3 days ago", badges: ["Friendly", "Clean Car"] },
  { id: "5", rider: "Priya S.", rating: 4, comment: "Decent ride, got a bit lost", date: "4 days ago", badges: [] },
];

const BADGES = [
  { label: "Clean Car",    icon: "✨", count: 94 },
  { label: "On Time",      icon: "⏰", count: 87 },
  { label: "Friendly",     icon: "😊", count: 76 },
  { label: "Great Music",  icon: "🎵", count: 43 },
  { label: "Safe Driver",  icon: "🛡️", count: 112 },
  { label: "Professional", icon: "💼", count: 65 },
];

const DIST = [
  { stars: 5, pct: 84 },
  { stars: 4, pct: 11 },
  { stars: 3, pct: 3 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 1 },
];

export default function RatingsPage() {
  return (
    <div className="p-4 animate-fade-in space-y-5">
      <PageHeader title="Ratings & Reviews" />

      {/* Big rating */}
      <div className="text-center p-6 rounded-2xl border border-gray-800 bg-gray-900/50">
        <p className="text-6xl font-black text-white mb-1">4.92</p>
        <div className="flex justify-center gap-1 mb-2">
          {[1,2,3,4,5].map((s) => <Star key={s} className={`w-5 h-5 ${s <= 5 ? "fill-amber-400 text-amber-400" : "text-gray-700"}`} />)}
        </div>
        <p className="text-sm text-gray-400">Based on 2,841 ratings</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Overall Rating" value="4.92" change={0.04} accent="amber" />
        <KpiCard label="Top Rated" value="Top 5%" accent="purple" />
      </div>

      {/* Distribution */}
      <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50 space-y-2">
        <p className="text-sm font-semibold text-gray-400 mb-3">Rating Distribution</p>
        {DIST.map((d) => (
          <div key={d.stars} className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 w-3 text-right">{d.stars}</span>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <Progress value={d.pct} className="h-2" indicatorClassName="bg-amber-400" />
            </div>
            <span className="text-gray-400 w-8 text-right">{d.pct}%</span>
          </div>
        ))}
      </div>

      {/* Compliment badges */}
      <div>
        <p className="text-sm font-semibold text-gray-400 mb-3">Compliment Badges</p>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((b) => (
            <div key={b.label} className="p-3 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
              <p className="text-xl mb-1">{b.icon}</p>
              <p className="text-xs font-medium text-white">{b.label}</p>
              <p className="text-xs text-gray-500">{b.count}×</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div>
        <p className="text-sm font-semibold text-gray-400 mb-3">Recent Reviews</p>
        <div className="space-y-3">
          {REVIEWS.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-white text-sm">{r.rider}</p>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-700"}`} />)}
                </div>
              </div>
              {r.comment && <p className="text-sm text-gray-300 mb-2">&quot;{r.comment}&quot;</p>}
              <div className="flex items-center justify-between">
                {r.badges.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {r.badges.map((b) => (
                      <span key={b} className="px-2 py-0.5 rounded-full bg-gray-800 text-xs text-gray-400">{b}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-600 ml-auto">{r.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
