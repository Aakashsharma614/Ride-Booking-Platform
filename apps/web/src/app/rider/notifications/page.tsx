"use client";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => api.getNotifications(user!.id, user!.accessToken),
    enabled: !!user?.id,
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-900 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 animate-fade-in space-y-4">
      <PageHeader title="Notifications" />

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">No notifications</p>
          <p className="text-sm text-gray-600 mt-1">You&apos;ll be notified about ride updates here</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <div key={n._id} className="flex gap-3 p-4 rounded-2xl bg-gray-900 border border-gray-800">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white font-mono">{n.template}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${n.status === "SENT" ? "bg-emerald-500/10 text-emerald-400" : n.status === "FAILED" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {n.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{n.channel} notification</p>
                <p className="text-xs text-gray-600 mt-1.5">
                  {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
