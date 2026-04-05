"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Wallet,
  ArrowUpDown,
  CreditCard,
  BarChart3,
  Activity,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { PageHeader } from "@/components/admin/page-header";
import { fetchDashboardStats, type DashboardStats } from "@/lib/admin-api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((err) => {
        console.error("Failed to fetch stats:", err);
        setApiError(
          "Không thể kết nối API. Hãy đảm bảo API server đang chạy trên localhost:4000",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        description="Tổng quan hệ thống FinGenie"
      />

      {/* API Error */}
      {apiError && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <Activity className="mb-1 inline h-4 w-4" /> {apiError}
        </div>
      )}

      {/* Stat Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng người dùng"
          value={loading ? "..." : (stats?.totalUsers ?? 0)}
          icon={Users}
          delay={0}
        />
        <StatCard
          title="Giao dịch"
          value={loading ? "..." : (stats?.totalTransactions ?? 0)}
          icon={ArrowUpDown}
          delay={0.1}
        />
        <StatCard
          title="Ví"
          value={loading ? "..." : (stats?.totalWallets ?? 0)}
          icon={Wallet}
          delay={0.2}
        />
        <StatCard
          title="Đăng ký Premium"
          value={loading ? "..." : (stats?.activeSubscriptions ?? 0)}
          icon={CreditCard}
          delay={0.3}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <motion.div
          className="glass-strong rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-400" />
            <h3 className="font-semibold text-white">Giao dịch gần đây</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : stats?.recentTransactions.length ? (
            <div className="space-y-3">
              {stats.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-300">
                      {tx.categoryName}
                    </p>
                    <p className="text-xs text-zinc-600">{tx.userName}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      tx.type === "income" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-600">
              Chưa có giao dịch nào
            </p>
          )}
        </motion.div>

        {/* Recent Users */}
        <motion.div
          className="glass-strong rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-400" />
            <h3 className="font-semibold text-white">
              Người dùng mới đăng ký
            </h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : stats?.recentUsers.length ? (
            <div className="space-y-3">
              {stats.recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-300">
                      {u.displayName}
                    </p>
                    <p className="text-xs text-zinc-600">{u.email}</p>
                  </div>
                  <span className="text-xs text-zinc-600">
                    {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-600">
              Chưa có người dùng nào
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
