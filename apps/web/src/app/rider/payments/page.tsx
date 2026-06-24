"use client";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusChip } from "@/components/shared/StatusChip";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function PaymentsPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ["myPayments"],
    queryFn: () => api.getMyPayments(user!.accessToken, 1),
    enabled: !!user,
  });

  const payments = data?.payments ?? [];
  const totalSpend = payments.filter((p) => p.status !== "REFUNDED").reduce((s, p) => s + p.amountCents, 0);

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-gray-900 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 animate-fade-in space-y-6">
      <PageHeader title="Payments" />

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
          <p className="text-2xl font-black text-white">{payments.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Transactions</p>
        </div>
        <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
          <p className="text-2xl font-black text-white">{formatCurrency(totalSpend)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Spent</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-gray-400 font-medium">No payments yet</p>
          <p className="text-sm text-gray-600 mt-1">Payment history will appear here after your first ride</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400">Transaction History</h3>
            <p className="text-xs text-gray-500">Total: {formatCurrency(totalSpend)}</p>
          </div>
          <div className="space-y-1">
            {payments.map((p) => (
              <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-900 transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${p.status === "REFUNDED" ? "bg-emerald-500/10" : "bg-gray-800"}`}>
                  {p.status === "REFUNDED"
                    ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    : <ArrowUpRight className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Ride payment</p>
                  <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
                <div className="text-right">
                  <span className={`font-bold text-sm ${p.status === "REFUNDED" ? "text-emerald-400" : "text-white"}`}>
                    {p.status === "REFUNDED" ? "+" : "-"}{formatCurrency(p.amountCents)}
                  </span>
                  <div className="mt-0.5">
                    <StatusChip status={p.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
