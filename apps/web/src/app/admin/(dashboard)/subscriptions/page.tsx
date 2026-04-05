"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Crown,
  Activity,
  Calendar,
  User,
  Filter,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import {
  fetchAdminSubscriptions,
  type AdminSubscription,
  type PaginatedResponse,
} from "@/lib/admin-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "cancelled" | "expired";
type PlanFilter = "all" | "free" | "monthly" | "yearly";

// ── Badge helpers ─────────────────────────────────────────────────────────────

const PLAN_LABEL: Record<string, string> = {
  free: "Miễn phí",
  monthly: "Hàng tháng",
  yearly: "Hàng năm",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Hoạt động",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
};

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free: "bg-zinc-700/60 text-zinc-300 border-zinc-600/40",
    monthly: "bg-primary-500/15 text-primary-300 border-primary-500/30",
    yearly: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };
  const icons: Record<string, React.ReactNode> = {
    free: <CreditCard className="h-3 w-3" />,
    monthly: <CreditCard className="h-3 w-3" />,
    yearly: <Crown className="h-3 w-3" />,
  };

  const cls = styles[plan] ?? styles.free;
  const icon = icons[plan] ?? icons.free;
  const label = PLAN_LABEL[plan] ?? plan;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
    expired: "bg-zinc-700/60 text-zinc-400 border-zinc-600/40",
  };
  const dots: Record<string, string> = {
    active: "bg-emerald-400",
    cancelled: "bg-red-400",
    expired: "bg-zinc-500",
  };

  const cls = styles[status] ?? styles.expired;
  const dot = dots[status] ?? dots.expired;
  const label = STATUS_LABEL[status] ?? status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ── Filter button ─────────────────────────────────────────────────────────────

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/30"
          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white/3 px-4 py-3">
      <div className="h-4 w-40 animate-pulse rounded bg-white/8" />
      <div className="h-5 w-20 animate-pulse rounded-full bg-white/8" />
      <div className="h-5 w-20 animate-pulse rounded-full bg-white/8" />
      <div className="ml-auto h-4 w-24 animate-pulse rounded bg-white/8" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [data, setData] = useState<PaginatedResponse<AdminSubscription> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");

  const LIMIT = 20;

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);
      setApiError(null);

      try {
        const result = await fetchAdminSubscriptions({
          page,
          limit: LIMIT,
          status: statusFilter === "all" ? undefined : statusFilter,
          plan: planFilter === "all" ? undefined : planFilter,
        });
        setData(result);
      } catch (err) {
        console.error("Failed to fetch subscriptions:", err);
        setApiError(
          "Không thể tải dữ liệu đăng ký. Hãy đảm bảo API server đang chạy.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, statusFilter, planFilter],
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, planFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => load({ silent: true });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return <span className="text-zinc-600">—</span>;
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ── Summary stats from current page ───────────────────────────────────────
  const activeCount =
    data?.data.filter((s) => s.status === "active").length ?? 0;

  return (
    <div className="p-8">
      <PageHeader
        title="Đăng ký"
        description="Quản lý gói đăng ký người dùng FinGenie"
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-2 text-sm text-zinc-400 transition-all hover:bg-white/8 hover:text-zinc-300 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>
        }
      />

      {/* API Error */}
      {apiError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <Activity className="h-4 w-4 shrink-0" />
          {apiError}
        </div>
      )}

      {/* Summary strip */}
      <motion.div
        className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {[
          {
            label: "Tổng đăng ký (trang)",
            value: loading ? "…" : (data?.data.length ?? 0),
            icon: CreditCard,
            color: "text-primary-400",
            bg: "bg-primary-500/10",
          },
          {
            label: "Đang hoạt động",
            value: loading ? "…" : activeCount,
            icon: Activity,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Tổng bản ghi",
            value: loading ? "…" : (data?.total ?? 0),
            icon: Crown,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Tổng trang",
            value: loading ? "…" : (data?.totalPages ?? 0),
            icon: Filter,
            color: "text-zinc-400",
            bg: "bg-zinc-700/40",
          },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            className="glass-strong flex items-center gap-3 rounded-2xl px-4 py-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 + i * 0.05 }}
          >
            <div className={`rounded-xl p-2 ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters + Table */}
      <motion.div
        className="glass-strong rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Filter bar */}
        <div className="mb-5 flex flex-wrap items-center gap-6">
          {/* Status filters */}
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs text-zinc-600">Trạng thái:</span>
            {(
              [
                { value: "all", label: "Tất cả" },
                { value: "active", label: "Hoạt động" },
                { value: "cancelled", label: "Đã hủy" },
                { value: "expired", label: "Hết hạn" },
              ] as { value: StatusFilter; label: string }[]
            ).map(({ value, label }) => (
              <FilterButton
                key={value}
                active={statusFilter === value}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </FilterButton>
            ))}
          </div>

          {/* Plan filters */}
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs text-zinc-600">Gói:</span>
            {(
              [
                { value: "all", label: "Tất cả" },
                { value: "free", label: "Miễn phí" },
                { value: "monthly", label: "Tháng" },
                { value: "yearly", label: "Năm" },
              ] as { value: PlanFilter; label: string }[]
            ).map(({ value, label }) => (
              <FilterButton
                key={value}
                active={planFilter === value}
                onClick={() => setPlanFilter(value)}
              >
                {label}
              </FilterButton>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div className="mb-2 grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 px-4 text-xs font-medium uppercase tracking-wider text-zinc-600">
          <span className="flex items-center gap-1.5">
            <User className="h-3 w-3" />
            Người dùng
          </span>
          <span className="flex items-center gap-1.5">
            <Crown className="h-3 w-3" />
            Gói
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3" />
            Trạng thái
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Bắt đầu
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Kết thúc
          </span>
          <span className="flex items-center gap-1.5">
            <CreditCard className="h-3 w-3" />
            Tạo lúc
          </span>
        </div>

        {/* Table body */}
        <div className="space-y-1.5">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : !data?.data.length ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="rounded-full bg-zinc-800/60 p-4">
                <CreditCard className="h-8 w-8 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">
                {statusFilter !== "all" || planFilter !== "all"
                  ? "Không tìm thấy đăng ký nào với bộ lọc này."
                  : "Chưa có đăng ký nào."}
              </p>
            </div>
          ) : (
            data.data.map((sub, i) => (
              <motion.div
                key={sub.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 rounded-lg bg-white/3 px-4 py-3 transition-colors hover:bg-white/5"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                {/* User */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {sub.user?.displayName ?? (
                      <span className="italic text-zinc-500">
                        Người dùng ẩn danh
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-zinc-600">
                    {sub.user?.email ?? sub.user?.id ?? sub.id}
                  </p>
                </div>

                {/* Plan */}
                <PlanBadge plan={sub.plan} />

                {/* Status */}
                <StatusBadge status={sub.status} />

                {/* Start date */}
                <span className="whitespace-nowrap text-xs text-zinc-400">
                  {formatDate(sub.startDate)}
                </span>

                {/* End date */}
                <span className="whitespace-nowrap text-xs text-zinc-400">
                  {formatDate(sub.endDate)}
                </span>

                {/* Created at */}
                <span className="whitespace-nowrap text-xs text-zinc-600">
                  {formatDate(sub.createdAt)}
                </span>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </motion.div>
    </div>
  );
}
