"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { fetchTransactions, type DashboardTransaction } from "@/lib/api";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    fetchTransactions({
      page,
      limit,
      type: filter === "all" ? undefined : filter,
    })
      .then((res) => {
        setTransactions(res.data);
        setTotal(res.total);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu"),
      )
      .finally(() => setLoading(false));
  }, [page, filter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">
          Giao dịch
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Lịch sử thu chi của bạn.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {(["all", "income", "expense"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              filter === f
                ? "bg-primary-500/15 text-primary-400"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {f === "all" ? "Tất cả" : f === "income" ? "Thu nhập" : "Chi tiêu"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <ArrowUpDown size={48} className="text-zinc-600" />
          <p className="text-zinc-400">Chưa có giao dịch nào.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl">
                    {tx.category?.icon ?? (tx.type === "income" ? "📥" : "📤")}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {tx.category?.name ?? "Chưa phân loại"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {tx.note ? `${tx.note} · ` : ""}
                      {tx.wallet?.name ?? ""} · {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    tx.type === "income" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/[0.04] disabled:opacity-40"
              >
                Trước
              </button>
              <span className="text-sm text-zinc-500">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/[0.04] disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
