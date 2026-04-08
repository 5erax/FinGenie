"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpDown,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { fetchAnalytics, type AnalyticsOverview } from "@/lib/admin-api";

// ── Types ────────────────────────────────────────────────────────────────────

type Period = "7d" | "30d" | "90d";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "90 ngày" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString("vi-VN");
}

// ── Shared chart primitives ───────────────────────────────────────────────────

function ChartSpinner() {
  return (
    <div className="flex h-44 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <p className="flex h-44 items-center justify-center text-sm text-zinc-600">
      {message}
    </p>
  );
}

// Subtle horizontal guide lines rendered behind bars
function GridLines({ count = 4 }: { count?: number }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-5">
      {Array.from({ length: count + 1 }).map((_, i) => (
        <div key={i} className="w-full border-t border-white/[0.04]" />
      ))}
    </div>
  );
}

// ── Period Selector ───────────────────────────────────────────────────────────

function PeriodSelector({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
            period === p.value
              ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ── User Growth — vertical bar chart ─────────────────────────────────────────

function UserGrowthChart({
  data,
  loading,
}: {
  data: AnalyticsOverview["userGrowth"];
  loading: boolean;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const showLabels = data.length <= 15;

  return (
    <motion.div
      className="glass-strong rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10">
            <Users className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Tăng trưởng người dùng</h3>
            <p className="text-xs text-zinc-500">Số người dùng đăng ký mới mỗi ngày</p>
          </div>
        </div>
        {!loading && data.length > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{total.toLocaleString("vi-VN")}</p>
            <p className="text-xs text-zinc-500">Tổng trong kỳ</p>
          </div>
        )}
      </div>

      {/* Chart */}
      {loading ? (
        <ChartSpinner />
      ) : data.length === 0 ? (
        <ChartEmpty message="Chưa có dữ liệu tăng trưởng" />
      ) : (
        <>
          <div className="relative h-44">
            <GridLines count={4} />
            <div className="absolute inset-0 flex items-end gap-0.5 pb-5 pt-2">
              {data.map((d, i) => {
                const heightPct = Math.max((d.count / max) * 100, 1.5);
                return (
                  <div
                    key={d.date}
                    className="group relative flex h-full flex-1 flex-col justify-end"
                  >
                    {/* Hover tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs text-white shadow-xl ring-1 ring-white/10 group-hover:block">
                      <span className="font-semibold text-primary-400">{d.count}</span>
                      <span className="ml-1 text-zinc-400">người · {formatDate(d.date)}</span>
                    </div>
                    <motion.div
                      className="w-full cursor-default rounded-t-sm bg-primary-400/60 transition-colors group-hover:bg-primary-400"
                      style={{
                        height: `${heightPct}%`,
                        transformOrigin: "bottom",
                      }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{
                        duration: 0.45,
                        delay: 0.1 + i * 0.018,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          {showLabels && (
            <div className="mt-1 flex gap-0.5">
              {data.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 truncate text-center text-[10px] text-zinc-600"
                >
                  {formatDate(d.date)}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ── Transaction Volume — grouped vertical bars ────────────────────────────────

function TransactionVolumeChart({
  data,
  loading,
}: {
  data: AnalyticsOverview["transactionVolume"];
  loading: boolean;
}) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const showLabels = data.length <= 15;
  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpense = data.reduce((s, d) => s + d.expense, 0);

  return (
    <motion.div
      className="glass-strong rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
            <ArrowUpDown className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Khối lượng giao dịch</h3>
            <p className="text-xs text-zinc-500">Thu nhập và chi tiêu theo ngày</p>
          </div>
        </div>
        <div className="flex gap-5">
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
            <p className="flex items-center justify-end gap-1.5 text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-sm bg-emerald-400" /> Thu nhập
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-red-400">{formatCurrency(totalExpense)}</p>
            <p className="flex items-center justify-end gap-1.5 text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-sm bg-red-400" /> Chi tiêu
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <ChartSpinner />
      ) : data.length === 0 ? (
        <ChartEmpty message="Chưa có dữ liệu giao dịch" />
      ) : (
        <>
          <div className="relative h-44">
            <GridLines count={4} />
            <div className="absolute inset-0 flex items-end gap-0.5 pb-5 pt-2">
              {data.map((d, i) => {
                const incomePct = Math.max((d.income / max) * 100, 1.5);
                const expensePct = Math.max((d.expense / max) * 100, 1.5);
                return (
                  <div
                    key={d.date}
                    className="group relative flex h-full flex-1 items-end gap-px"
                  >
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-2 text-xs shadow-xl ring-1 ring-white/10 group-hover:block">
                      <p className="mb-1 text-zinc-500">{formatDate(d.date)}</p>
                      <p className="text-emerald-400">
                        ↑ {formatCurrency(d.income)}
                      </p>
                      <p className="text-red-400">↓ {formatCurrency(d.expense)}</p>
                    </div>
                    {/* Income bar */}
                    <motion.div
                      className="flex-1 cursor-default rounded-t-sm bg-emerald-400/60 transition-colors group-hover:bg-emerald-400"
                      style={{
                        height: `${incomePct}%`,
                        transformOrigin: "bottom",
                      }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{
                        duration: 0.45,
                        delay: 0.1 + i * 0.018,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                    {/* Expense bar */}
                    <motion.div
                      className="flex-1 cursor-default rounded-t-sm bg-red-400/60 transition-colors group-hover:bg-red-400"
                      style={{
                        height: `${expensePct}%`,
                        transformOrigin: "bottom",
                      }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{
                        duration: 0.45,
                        delay: 0.12 + i * 0.018,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {showLabels && (
            <div className="mt-1 flex gap-0.5">
              {data.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 truncate text-center text-[10px] text-zinc-600"
                >
                  {formatDate(d.date)}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ── Revenue by Month — horizontal bar chart ───────────────────────────────────

function RevenueChart({
  data,
  loading,
}: {
  data: AnalyticsOverview["revenueByMonth"];
  loading: boolean;
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <motion.div
      className="glass-strong rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/10">
            <TrendingUp className="h-5 w-5 text-accent-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Doanh thu</h3>
            <p className="text-xs text-zinc-500">Theo tháng</p>
          </div>
        </div>
        {!loading && data.length > 0 && (
          <div className="text-right">
            <p className="text-xl font-bold text-white">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-xs text-zinc-500">Tổng doanh thu</p>
          </div>
        )}
      </div>

      {/* Chart */}
      {loading ? (
        <ChartSpinner />
      ) : data.length === 0 ? (
        <ChartEmpty message="Chưa có dữ liệu doanh thu" />
      ) : (
        <div className="space-y-3">
          {data.map((d, i) => {
            const widthPct = Math.max((d.revenue / max) * 100, 1.5);
            return (
              <div key={d.month} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-right text-xs font-medium text-zinc-400">
                  {d.month}
                </span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-white/5">
                  <motion.div
                    className="h-full rounded-md bg-accent-400/70"
                    style={{
                      width: `${widthPct}%`,
                      transformOrigin: "left",
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.15 + i * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                  {/* Value label inside bar */}
                  {widthPct > 20 && (
                    <motion.span
                      className="absolute inset-y-0 left-2 flex items-center text-[11px] font-semibold text-white/80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                    >
                      {formatCurrency(d.revenue)}
                    </motion.span>
                  )}
                </div>
                {widthPct <= 20 && (
                  <span className="w-14 shrink-0 text-xs font-medium text-zinc-400">
                    {formatCurrency(d.revenue)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ── Top Categories — horizontal progress bars ─────────────────────────────────

const CATEGORY_COLORS = [
  "bg-primary-400",
  "bg-emerald-400",
  "bg-warm-400",
  "bg-accent-400",
  "bg-cyan-400",
  "bg-rose-400",
  "bg-indigo-400",
  "bg-orange-400",
];

function TopCategoriesChart({
  data,
  loading,
}: {
  data: AnalyticsOverview["topCategories"];
  loading: boolean;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const visible = data.slice(0, 8);

  return (
    <motion.div
      className="glass-strong rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warm-500/10">
          <PieChart className="h-5 w-5 text-warm-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Danh mục phổ biến</h3>
          <p className="text-xs text-zinc-500">Theo số lượng giao dịch</p>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <ChartSpinner />
      ) : visible.length === 0 ? (
        <ChartEmpty message="Chưa có dữ liệu danh mục" />
      ) : (
        <div className="space-y-4">
          {visible.map((d, i) => {
            const widthPct = Math.max((d.count / maxCount) * 100, 1.5);
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            return (
              <div key={d.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex min-w-0 flex-1 items-center gap-2 mr-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                    <span className="truncate font-medium text-zinc-300">
                      {d.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-zinc-500">
                    <span>{d.count.toLocaleString("vi-VN")}</span>
                    <span className="text-zinc-700">·</span>
                    <span>{formatCurrency(d.total)}</span>
                  </div>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className={`h-full rounded-full ${color} opacity-70`}
                    style={{
                      width: `${widthPct}%`,
                      transformOrigin: "left",
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.15 + i * 0.07,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  data,
  loading,
}: {
  data: AnalyticsOverview | null;
  loading: boolean;
}) {
  const items = [
    {
      label: "Người dùng mới",
      value: loading
        ? "..."
        : (data?.userGrowth.reduce((s, d) => s + d.count, 0) ?? 0).toLocaleString("vi-VN"),
      icon: Users,
      color: "text-primary-400",
      bg: "bg-primary-500/10",
    },
    {
      label: "Tổng giao dịch",
      value: loading
        ? "..."
        : (
            data?.transactionVolume.reduce(
              (s, d) => s + d.income + d.expense,
              0,
            ) ?? 0
          ).toLocaleString("vi-VN"),
      icon: ArrowUpDown,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Doanh thu",
      value: loading
        ? "..."
        : formatCurrency(
            data?.revenueByMonth.reduce((s, d) => s + d.revenue, 0) ?? 0,
          ),
      icon: TrendingUp,
      color: "text-accent-400",
      bg: "bg-accent-500/10",
    },
    {
      label: "Danh mục",
      value: loading ? "..." : (data?.topCategories.length ?? 0).toString(),
      icon: BarChart3,
      color: "text-warm-400",
      bg: "bg-warm-500/10",
    },
  ];

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          className="glass-strong rounded-2xl p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.07 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500">{item.label}</p>
              <p className={`mt-1 text-xl font-bold ${item.color}`}>
                {item.value}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    setLoading(true);
    setApiError(null);
    fetchAnalytics({ period })
      .then(setData)
      .catch((err: unknown) => {
        console.error("Failed to fetch analytics:", err);
        setApiError(
          "Không thể tải dữ liệu phân tích. Vui lòng kiểm tra kết nối API server.",
        );
      })
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="p-8">
      <PageHeader
        title="Phân tích"
        description="Thống kê và xu hướng hệ thống FinGenie"
        actions={<PeriodSelector period={period} onChange={setPeriod} />}
      />

      {apiError && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <Activity className="mb-0.5 mr-1.5 inline h-4 w-4" />
          {apiError}
        </div>
      )}

      {/* Summary cards */}
      <SummaryStrip data={data} loading={loading} />

      {/* Charts */}
      <div className="space-y-6">
        <UserGrowthChart
          data={data?.userGrowth ?? []}
          loading={loading}
        />

        <TransactionVolumeChart
          data={data?.transactionVolume ?? []}
          loading={loading}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart
            data={data?.revenueByMonth ?? []}
            loading={loading}
          />
          <TopCategoriesChart
            data={data?.topCategories ?? []}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
