"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Plus,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchWallets, type DashboardWallet } from "@/lib/api";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<DashboardWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWallets()
      .then(setWallets)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Ví tiền
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Quản lý các ví và theo dõi số dư của bạn.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl border border-primary-500/20 bg-gradient-to-br from-primary-500/10 to-transparent p-6"
      >
        <p className="text-sm text-zinc-400">Tổng số dư</p>
        <p className="font-display text-3xl font-bold text-white">
          {formatCurrency(totalBalance)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {wallets.length} ví
        </p>
      </motion.div>

      {/* Wallets Grid */}
      {wallets.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <Wallet size={48} className="text-zinc-600" />
          <p className="text-zinc-400">Chưa có ví nào. Tạo ví đầu tiên trên app!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet, i) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                  style={{
                    backgroundColor: `${wallet.color ?? "#3b82f6"}20`,
                  }}
                >
                  {wallet.icon ?? "💰"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {wallet.name}
                  </p>
                  <p className="text-xs text-zinc-500">{wallet.currency}</p>
                </div>
              </div>
              <p className="font-display text-xl font-bold text-white">
                {formatCurrency(wallet.balance)}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
