"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/admin/protected-route";
import { motion } from "framer-motion";
import {
  Users,
  Wallet,
  ArrowUpDown,
  CreditCard,
  LogOut,
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface DashboardStats {
  totalUsers: number;
  totalTransactions: number;
  totalWallets: number;
  activeSubscriptions: number;
  recentTransactions: RecentTransaction[];
  recentUsers: RecentUser[];
}

interface RecentTransaction {
  id: string;
  amount: string;
  type: "income" | "expense";
  categoryName: string;
  userName: string;
  date: string;
}

interface RecentUser {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
}

// ────────────────────────────────────────────
// Stat Card Component
// ────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  delay,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  delay: number;
}) {
  return (
    <motion.div
      className="glass-strong rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {trend && (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10">
          <Icon className="h-6 w-6 text-primary-400" />
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────
// Dashboard Content
// ────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function DashboardContent() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE}/api/v1/users/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`API ${res.status}: ${body}`);
        }

        const data: DashboardStats = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setApiError(
          "Không thể kết nối API. Hãy đảm bảo API server đang chạy trên localhost:4000",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-white">Fin</span>
              <span className="bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                Genie
              </span>
            </h1>
            <span className="rounded-lg bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-400">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-lg border border-white/8 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white">
            Xin chào, {user?.displayName ?? "Admin"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Tổng quan hệ thống FinGenie
          </p>
        </motion.div>

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
                        tx.type === "income"
                          ? "text-emerald-400"
                          : "text-red-400"
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
      </main>
    </div>
  );
}

// ────────────────────────────────────────────
// Page Export (Protected)
// ────────────────────────────────────────────

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
