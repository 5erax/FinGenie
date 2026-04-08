"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  PiggyBank,
  Crown,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  fetchWallets,
  fetchTransactions,
  fetchDashboardStats,
  fetchSavingPlans,
  fetchPremiumStatus,
  getWalletMeta,
  type DashboardWallet,
  type DashboardTransaction,
  type DashboardStats,
  type ApiSavingPlan,
  type PremiumStatus,
} from "@/lib/api";

// ── Helpers ─────────────────────────────────────────────────────────────────

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
  }).format(new Date(dateStr));
}

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="font-display text-xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

// ── Dashboard Page ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { backendUser, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [wallets, setWallets] = useState<DashboardWallet[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [savingPlans, setSavingPlans] = useState<ApiSavingPlan[]>([]);
  const [premium, setPremium] = useState<PremiumStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsRes, walletsRes, txRes, plansRes, premiumRes] =
          await Promise.allSettled([
            fetchDashboardStats(),
            fetchWallets(),
            fetchTransactions({ limit: 5 }),
            fetchSavingPlans(),
            fetchPremiumStatus(),
          ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value);
        if (walletsRes.status === "fulfilled") setWallets(walletsRes.value);
        if (txRes.status === "fulfilled") setTransactions(txRes.value.data);
        if (plansRes.status === "fulfilled") setSavingPlans(plansRes.value);
        if (premiumRes.status === "fulfilled") setPremium(premiumRes.value);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-zinc-400">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName =
    backendUser?.displayName ?? user?.displayName ?? "Người dùng";

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-display text-2xl font-bold text-white">
          Xin chào, {displayName}! 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Đây là tổng quan tài chính của bạn hôm nay.
        </p>
      </motion.div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng cân đối"
          value={formatCurrency(stats?.net ?? 0)}
          icon={Wallet}
          color="#22c55e"
          delay={0}
        />
        <StatCard
          label="Thu nhập"
          value={formatCurrency(stats?.totalIncome ?? 0)}
          icon={TrendingUp}
          color="#3b82f6"
          delay={0.1}
        />
        <StatCard
          label="Chi tiêu"
          value={formatCurrency(stats?.totalExpense ?? 0)}
          icon={TrendingDown}
          color="#ef4444"
          delay={0.2}
        />
        <StatCard
          label="Giao dịch"
          value={String(stats?.count ?? 0)}
          icon={ArrowUpDown}
          color="#a855f7"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Wallets ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">
              Ví tiền
            </h2>
            <Link
              href="/dashboard/wallets"
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
            >
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>
          {wallets.length === 0 ? (
            <p className="text-sm text-zinc-500">Chưa có ví nào.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {wallets.slice(0, 4).map((w) => {
                const meta = getWalletMeta(w.type);
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg"
                        style={{ backgroundColor: `${meta.color}20` }}
                      >
                        {meta.icon}
                      </div>
                      <span className="text-sm font-medium text-white">
                        {w.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(w.balance)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Recent Transactions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">
              Giao dịch gần đây
            </h2>
            <Link
              href="/dashboard/transactions"
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
            >
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-zinc-500">Chưa có giao dịch nào.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {tx.category?.icon ?? (tx.type === "income" ? "📥" : "📤")}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {tx.category?.name ?? "Chưa phân loại"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {tx.note ?? tx.wallet?.name ?? ""} · {formatDate(tx.date)}
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
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Bottom row: Saving Plans + Premium ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Saving Plans */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">
              Kế hoạch tài chính
            </h2>
            <Link
              href="/dashboard/goals"
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
            >
              Chi tiết <ArrowRight size={12} />
            </Link>
          </div>
          {savingPlans.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Chưa có kế hoạch nào. Tạo trên app để bắt đầu!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {savingPlans.slice(0, 2).map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PiggyBank size={16} className="text-primary-400" />
                      <span className="text-sm font-medium text-white">
                        Ngân sách hàng ngày
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-primary-400">
                      {formatCurrency(plan.dailyBudget)}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-zinc-400">
                    <span>Thu nhập: {formatCurrency(plan.monthlyIncome)}</span>
                    <span>Tiết kiệm: {plan.savingPercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Premium Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Crown
              size={18}
              className={
                premium?.isPremium ? "text-amber-400" : "text-zinc-500"
              }
            />
            <h2 className="font-display text-lg font-semibold text-white">
              Premium
            </h2>
          </div>

          {premium?.isPremium ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-amber-300">
                    Premium Active
                  </p>
                  <p className="text-xs text-amber-400/70">
                    Gói {premium.subscription?.plan === "yearly" ? "Năm" : "Tháng"} ·
                    Hết hạn{" "}
                    {premium.premiumUntil
                      ? formatDate(premium.premiumUntil)
                      : "N/A"}
                  </p>
                </div>
                <Crown size={24} className="text-amber-400" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-center text-sm text-zinc-400">
                Nâng cấp Premium để mở khóa tất cả tính năng AI và không giới hạn.
              </p>
              <Link
                href="/dashboard/subscription"
                className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-primary-500/25 transition-all hover:shadow-primary-500/40 hover:brightness-110"
              >
                Nâng cấp Premium
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
