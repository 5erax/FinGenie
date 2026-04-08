"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PiggyBank, Loader2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { fetchSavingPlans, type ApiSavingPlan } from "@/lib/api";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function GoalsPage() {
  const [plans, setPlans] = useState<ApiSavingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavingPlans()
      .then(setPlans)
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

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">
          Kế hoạch tài chính
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Quản lý ngân sách và mục tiêu tiết kiệm của bạn.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <PiggyBank size={48} className="text-zinc-600" />
          <p className="text-zinc-400">
            Chưa có kế hoạch tài chính nào. Tạo trên app!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {plans.map((plan, i) => {
            const available =
              plan.monthlyIncome - plan.fixedExpenses - plan.variableExpenses;
            const savingAmount = available * (plan.savingPercent / 100);
            const savingRatio =
              plan.monthlyIncome > 0
                ? (savingAmount / plan.monthlyIncome) * 100
                : 0;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              >
                {/* Header */}
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
                    <PiggyBank size={20} className="text-primary-400" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-white">
                      Kế hoạch ngân sách
                    </p>
                    <p className="text-xs text-zinc-500">
                      Tiết kiệm {plan.savingPercent}% thu nhập
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                    <div className="mb-1 flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-green-400" />
                      <span className="text-xs text-zinc-500">Thu nhập</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(plan.monthlyIncome)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                    <div className="mb-1 flex items-center gap-1.5">
                      <TrendingDown size={12} className="text-red-400" />
                      <span className="text-xs text-zinc-500">Chi cố định</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(plan.fixedExpenses)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                    <div className="mb-1 flex items-center gap-1.5">
                      <TrendingDown size={12} className="text-orange-400" />
                      <span className="text-xs text-zinc-500">Chi biến đổi</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(plan.variableExpenses)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Wallet size={12} className="text-primary-400" />
                      <span className="text-xs text-zinc-500">Ngân sách/ngày</span>
                    </div>
                    <p className="text-sm font-semibold text-primary-400">
                      {formatCurrency(plan.dailyBudget)}
                    </p>
                  </div>
                </div>

                {/* Saving Progress Bar */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">
                      Tỷ lệ tiết kiệm
                    </span>
                    <span className="text-xs font-medium text-primary-400">
                      {savingRatio.toFixed(1)}% ({formatCurrency(savingAmount)}/tháng)
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(savingRatio, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
                    />
                  </div>
                </div>

                {/* Safe Money info */}
                {plan.safeMoney > 0 && (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-green-500/10 bg-green-500/5 px-4 py-2.5">
                    <span className="text-xs text-zinc-400">An toàn tài chính</span>
                    <span className="text-sm font-semibold text-green-400">
                      {formatCurrency(plan.safeMoney)}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
