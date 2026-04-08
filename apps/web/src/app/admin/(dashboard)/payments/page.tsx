"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Receipt, Activity, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import {
  fetchAdminPayments,
  type AdminPayment,
  type PaginatedResponse,
} from "@/lib/admin-api";

const LIMIT = 20;

const STATUS_FILTERS = [
  { label: "Tất cả", value: "" },
  { label: "Chờ xử lý", value: "pending" },
  { label: "Hoàn tất", value: "completed" },
  { label: "Thất bại", value: "failed" },
  { label: "Đã huỷ", value: "cancelled" },
];

const STATUS_BADGE: Record<
  string,
  { label: string; classes: string }
> = {
  completed: {
    label: "Hoàn tất",
    classes:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  pending: {
    label: "Chờ xử lý",
    classes: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  failed: {
    label: "Thất bại",
    classes: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
  cancelled: {
    label: "Đã huỷ",
    classes: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  },
};

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGE[status] ?? {
    label: status,
    classes: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}
    >
      {badge.label}
    </span>
  );
}

function formatAmount(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<PaginatedResponse<AdminPayment> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setApiError(null);
    fetchAdminPayments({
      page,
      limit: LIMIT,
      status: statusFilter || undefined,
    })
      .then(setData)
      .catch((err: unknown) => {
        console.error("Failed to fetch payments:", err);
        setApiError(
          "Không thể kết nối API server.",
        );
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 when filter changes
  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  const payments = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="p-8">
      <PageHeader
        title="Thanh toán"
        description="Quản lý lịch sử thanh toán và đơn hàng"
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-1.5 text-sm text-zinc-400">
            <Receipt className="h-4 w-4 text-primary-400" />
            <span>
              {loading ? "..." : total} giao dịch
            </span>
          </div>
        }
      />

      {/* API Error */}
      {apiError && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <Activity className="mb-1 inline h-4 w-4" /> {apiError}
        </div>
      )}

      {/* Main Card */}
      <motion.div
        className="glass-strong rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4">
          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleStatusChange(f.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-primary-500/20 text-primary-400"
                    : "border border-white/8 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Result count */}
          <p className="text-xs text-zinc-600">
            {loading ? "Đang tải..." : `${total} kết quả`}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {[
                  "Người dùng",
                  "Mã đơn hàng",
                  "Số tiền",
                  "Gói",
                  "Trạng thái",
                  "Ngày tạo",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-zinc-600">
                      <Search className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Không có thanh toán nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment, i) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/3"
                  >
                    {/* User */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-zinc-200">
                          {payment.user?.displayName ?? "—"}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-600">
                          {payment.user?.email ?? "—"}
                        </p>
                      </div>
                    </td>

                    {/* Order ID */}
                    <td className="px-6 py-4">
                      {payment.stripeSessionId ? (
                        <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-zinc-400">
                          {payment.stripeSessionId}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-400">
                        {formatAmount(payment.amount)}
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="px-6 py-4">
                      {payment.subscription?.plan ? (
                        <span className="rounded-md bg-primary-500/10 px-2 py-0.5 text-xs font-medium capitalize text-primary-400">
                          {payment.subscription.plan}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} />
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4">
                      <span className="text-zinc-500">
                        {formatDate(payment.createdAt)}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && payments.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
