"use client";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, DollarSign, RefreshCw, XCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusChip } from "@/components/shared/StatusChip";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { api, type PaymentDoc } from "@/lib/api";

const cols: Column<PaymentDoc>[] = [
  { key: "_id",         header: "Payment ID", render: (p) => <span className="font-mono text-xs text-gray-400">#{p._id.slice(-8)}</span> },
  { key: "rideId",      header: "Ride",       render: (p) => <span className="font-mono text-xs text-gray-400">#{p.rideId.slice(-6)}</span> },
  { key: "riderId",     header: "Rider",      render: (p) => <span className="text-xs text-gray-300">{p.riderId.slice(-8)}</span> },
  { key: "amountCents", header: "Amount",     render: (p) => <span className="text-emerald-400 font-semibold">{formatCurrency(p.amountCents)}</span> },
  { key: "status",      header: "Status",     render: (p) => <StatusChip status={p.status} /> },
  { key: "createdAt",   header: "Date",       render: (p) => <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</span> },
];

export default function PaymentsPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ["adminPayments"],
    queryFn: () => api.listPayments(user!.accessToken, 1),
    enabled: !!user,
  });

  const payments  = data?.payments ?? [];
  const captured  = payments.filter((p) => p.status === "CAPTURED");
  const authorized= payments.filter((p) => p.status === "AUTHORIZED");
  const refunded  = payments.filter((p) => p.status === "REFUNDED");
  const failed    = payments.filter((p) => p.status === "FAILED");

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Payments" subtitle="Transaction history and payment health" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Captured"   value={formatCurrency(captured.reduce((s, p) => s + p.amountCents, 0))}   icon={<CreditCard className="w-4 h-4" />} accent="emerald" />
        <KpiCard label="Authorized" value={formatCurrency(authorized.reduce((s, p) => s + p.amountCents, 0))} icon={<DollarSign className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Refunded"   value={formatCurrency(refunded.reduce((s, p) => s + p.amountCents, 0))}   icon={<RefreshCw className="w-4 h-4" />}  accent="amber" />
        <KpiCard label="Failed"     value={failed.length}                                                       icon={<XCircle className="w-4 h-4" />}    accent="red" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-gray-400">No payments yet</p>
        </div>
      ) : (
        <DataTable columns={cols} data={payments} />
      )}
    </div>
  );
}
