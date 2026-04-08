"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Loader2, Plus } from "lucide-react";
import { fetchSavingPlans, type SavingPlan } from "@/lib/api";

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

export default function GoalsPage() {
  const [plans, setPlans] = useState<SavingPlan[]>([]);
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Mục tiêu tiết kiệm
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Theo dõi tiến độ tiết kiệm của bạn.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <Target size={48} className="text-zinc-600" />
          <p className="text-zinc-400">
            Chưa có mục tiêu nào. Tạo mục tiêu trên app!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {plans.map((plan, i) => {
            const progress =
              plan.targetAmount > 0
                ? Math.min(
                    (plan.currentAmount / plan.targetAmount) * 100,
                    100,
                  )
                : 0;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
                      <Target size={20} className="text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {plan.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {plan.status === "completed"
                          ? "Hoàn thành!"
                          : plan.deadline
                            ? `Hạn: ${formatDate(plan.deadline)}`
                            : "Không có hạn"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      plan.status === "completed"
                        ? "border border-green-500/20 bg-green-500/10 text-green-400"
                        : "border border-zinc-700 bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {plan.status === "completed" ? "Hoàn thành" : "Đang tiến hành"}
                  </span>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-zinc-400">
                      {formatCurrency(plan.currentAmount)}
                    </span>
                    <span className="text-zinc-500">
                      {formatCurrency(plan.targetAmount)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                      className={`h-full rounded-full ${
                        plan.status === "completed"
                          ? "bg-gradient-to-r from-green-500 to-green-400"
                          : "bg-gradient-to-r from-primary-500 to-primary-400"
                      }`}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-xs font-medium text-zinc-400">
                    {progress.toFixed(1)}%
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
