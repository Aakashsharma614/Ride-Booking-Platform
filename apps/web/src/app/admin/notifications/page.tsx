"use client";
import { useQuery } from "@tanstack/react-query";
import { Bell, Send, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusChip } from "@/components/shared/StatusChip";
import { useAuthStore } from "@/store/authStore";
import { api, type NotificationDoc } from "@/lib/api";

const cols: Column<NotificationDoc>[] = [
  { key: "_id",         header: "ID",          render: (n) => <span className="font-mono text-xs text-gray-400">#{n._id.slice(-8)}</span> },
  { key: "recipientId", header: "Recipient",   render: (n) => <span className="text-gray-300 text-xs">{n.recipientId.slice(-8)}</span> },
  { key: "channel",     header: "Channel",     render: (n) => <span className="font-semibold text-blue-400">{n.channel}</span> },
  { key: "template",    header: "Template",    render: (n) => <span className="font-mono text-xs text-purple-400">{n.template}</span> },
  { key: "status",      header: "Status",      render: (n) => <StatusChip status={n.status} /> },
  { key: "createdAt",   header: "Sent At",     render: (n) => <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span> },
];

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: () => api.listNotifications(user!.accessToken, 1),
    enabled: !!user,
    refetchInterval: 15_000,
  });

  const notifications = data?.notifications ?? [];
  const sent   = notifications.filter((n) => n.status === "SENT").length;
  const failed = notifications.filter((n) => n.status === "FAILED").length;
  const queued = notifications.filter((n) => n.status === "QUEUED").length;
  const rate   = notifications.length > 0 ? Math.round((sent / notifications.length) * 100) : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Notifications" subtitle="Delivery status and channel metrics" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Sent"    value={sent.toLocaleString()} icon={<Send className="w-4 h-4" />}        accent="emerald" />
        <KpiCard label="Failed"        value={failed}                icon={<XCircle className="w-4 h-4" />}     accent="red" />
        <KpiCard label="Queued"        value={queued}                icon={<Bell className="w-4 h-4" />}        accent="amber" />
        <KpiCard label="Delivery Rate" value={`${rate}%`}           icon={<CheckCircle className="w-4 h-4" />} accent="blue" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <DataTable columns={cols} data={notifications} />
      )}
    </div>
  );
}
