"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Inbox,
  SlidersHorizontal,
  Wallet,
  User,
  Tag,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import {
  fetchAdminTransactions,
  type AdminTransaction,
  type PaginatedResponse,
} from "@/lib/admin-api";

const LIMIT = 20;

type TypeFilter = "all" | "income" | "expense";

const TYPE_FILTERS: { label: string; value: TypeFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Thu nhập", value: "income" },
  { label: "Chi tiêu", value: "expense" },
];

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + " ₫";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TransactionsPage() {
  const [data, setData] = useState<PaginatedResponse<AdminTransaction> | null>(
    null,
  );
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchAdminTransactions({
      page,
      limit: LIMIT,
      type: typeFilter === "all" ? undefined : typeFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((res) => {
        setData(res);
        setTransactions(res.data);
      })
      .catch((err: unknown) => {
        console.error("Failed to fetch transactions:", err);
        setError(
          "Không thể tải dữ liệu giao dịch. Hãy đảm bảo API server đang chạy.",
        );
      })
      .finally(() => setLoading(false));
  }, [page, typeFilter, startDate, endDate]);

  // Reset page when filters change
  const handleTypeFilter = (val: TypeFilter) => {
    setPage(1);
    setTypeFilter(val);
  };
  const handleStartDate = (val: string) => {
    setPage(1);
    setStartDate(val);
  };
  const handleEndDate = (val: string) => {
    setPage(1);
    setEndDate(val);
  };

  const incomeCount = transactions.filter((t) => t.type === "income").length;
  const expenseCount = transactions.filter((t) => t.type === "expense").length;
  const totalAmount = transactions.reduce(
    (acc, t) =>
      acc + (t.type === "income" ? t.amount : -t.amount),
    0,
  );

  return (
    <div className="p-8">
      <PageHeader
        title="Giao dịch"
        description="Quản lý toàn bộ giao dịch thu chi của người dùng"
      />

      {/* Summary strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-6 grid grid-cols-3 gap-4"
      >
        <div className="glass-strong flex items-center gap-3 rounded-2xl p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15">
            <ArrowUpDown className="h-4 w-4 text-primary-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Hiển thị trang này</p>
            <p className="text-lg font-bold text-white">
              {loading ? "…" : transactions.length}
            </p>
          </div>
        </div>

        <div className="glass-strong flex items-center gap-3 rounded-2xl p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Thu nhập</p>
            <p className="text-lg font-bold text-emerald-400">
              {loading ? "…" : incomeCount}
            </p>
          </div>
        </div>

        <div className="glass-strong flex items-center gap-3 rounded-2xl p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15">
            <TrendingDown className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Chi tiêu</p>
            <p className="text-lg font-bold text-red-400">
              {loading ? "…" : expenseCount}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-strong mb-6 rounded-2xl p-5"
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Icon */}
          <div className="flex items-center gap-2 text-zinc-400">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm font-medium">Bộ lọc</span>
          </div>

          {/* Type filter tabs */}
          <div className="flex gap-1 rounded-xl border border-white/8 bg-white/3 p-1">
            {TYPE_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleTypeFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  typeFilter === value
                    ? "bg-primary-500/25 text-primary-300 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/8" />

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <span className="text-xs text-zinc-500">Từ</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDate(e.target.value)}
              className="rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
            />
            <span className="text-xs text-zinc-500">đến</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDate(e.target.value)}
              className="rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
            />
          </div>

          {/* Clear dates */}
          {(startDate || endDate) && (
            <button
              onClick={() => {
                handleStartDate("");
                handleEndDate("");
              }}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
            >
              Xóa ngày
            </button>
          )}

          {/* Total net (right side) */}
          {!loading && transactions.length > 0 && (
            <div className="ml-auto text-sm">
              <span className="text-zinc-500">Ròng trang này: </span>
              <span
                className={
                  totalAmount >= 0 ? "font-semibold text-emerald-400" : "font-semibold text-red-400"
                }
              >
                {totalAmount >= 0 ? "+" : ""}
                {formatVND(totalAmount)}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Table card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="glass-strong rounded-2xl p-6"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            <p className="text-sm text-zinc-500">Đang tải giao dịch…</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Inbox className="h-10 w-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">Không có giao dịch nào</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Ngày
                      </div>
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        Người dùng
                      </div>
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        Danh mục
                      </div>
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5" />
                        Ví
                      </div>
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Số tiền
                    </th>
                    <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Loại
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Ghi chú
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {transactions.map((tx, i) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.025 }}
                      className="group bg-white/3 transition-colors hover:bg-white/5"
                    >
                      {/* Date */}
                      <td className="py-3 pr-4">
                        <span className="whitespace-nowrap text-zinc-300">
                          {formatDate(tx.date)}
                        </span>
                      </td>

                      {/* User */}
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-zinc-200">
                            {tx.user?.displayName ?? "—"}
                          </p>
                          {tx.user?.email && (
                            <p className="text-xs text-zinc-600">
                              {tx.user.email}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 pr-4">
                        {tx.category ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded-md text-xs"
                              style={{
                                backgroundColor: tx.category.color + "33",
                                color: tx.category.color,
                              }}
                            >
                              {tx.category.icon}
                            </span>
                            <span className="text-zinc-300">
                              {tx.category.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Wallet */}
                      <td className="py-3 pr-4">
                        {tx.wallet ? (
                          <div>
                            <p className="text-zinc-300">{tx.wallet.name}</p>
                            <p className="text-xs capitalize text-zinc-600">
                              {tx.wallet.type}
                            </p>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 pr-4 text-right">
                        <span
                          className={`whitespace-nowrap font-semibold tabular-nums ${
                            tx.type === "income"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {formatVND(tx.amount)}
                        </span>
                      </td>

                      {/* Type badge */}
                      <td className="py-3 pr-4">
                        <div className="flex justify-center">
                          {tx.type === "income" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
                              <TrendingUp className="h-3 w-3" />
                              Thu nhập
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400">
                              <TrendingDown className="h-3 w-3" />
                              Chi tiêu
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Note */}
                      <td className="py-3">
                        {tx.note ? (
                          <span
                            className="block max-w-[180px] truncate text-zinc-400"
                            title={tx.note}
                          >
                            {tx.note}
                          </span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between border-t border-white/6 pt-4">
              <p className="text-xs text-zinc-600">
                Tổng{" "}
                <span className="font-semibold text-zinc-400">
                  {data?.total ?? 0}
                </span>{" "}
                giao dịch
              </p>
              <Pagination
                page={page}
                totalPages={data?.totalPages ?? 1}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
