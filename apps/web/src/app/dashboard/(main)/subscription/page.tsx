"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Loader2 } from "lucide-react";
import {
  fetchPremiumStatus,
  fetchPaymentHistory,
  type PremiumStatus,
  type PaymentOrder,
} from "@/lib/api";

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

const PLANS = [
  {
    id: "monthly" as const,
    name: "Tháng",
    price: 79_000,
    period: "/tháng",
    features: [
      "AI Coach không giới hạn",
      "Báo cáo chi tiết",
      "Không quảng cáo",
      "Hỗ trợ ưu tiên",
    ],
  },
  {
    id: "yearly" as const,
    name: "Năm",
    price: 790_000,
    period: "/năm",
    badge: "Tiết kiệm 17%",
    features: [
      "Tất cả tính năng Tháng",
      "Phân tích xu hướng năm",
      "Xuất báo cáo PDF",
      "Tính năng beta sớm",
    ],
  },
];

export default function SubscriptionPage() {
  const [premium, setPremium] = useState<PremiumStatus | null>(null);
  const [history, setHistory] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([fetchPremiumStatus(), fetchPaymentHistory()])
      .then(([premiumRes, historyRes]) => {
        if (premiumRes.status === "fulfilled") setPremium(premiumRes.value);
        if (historyRes.status === "fulfilled")
          setHistory(historyRes.value.data);
      })
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
          Premium
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Quản lý gói đăng ký và thanh toán.
        </p>
      </div>

      {/* Current Status */}
      {premium?.isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-6"
        >
          <div className="flex items-center gap-3">
            <Crown size={24} className="text-amber-400" />
            <div>
              <p className="font-display text-lg font-bold text-amber-300">
                Premium Active
              </p>
              <p className="text-sm text-amber-400/70">
                Gói{" "}
                {premium.subscription?.plan === "yearly" ? "Năm" : "Tháng"} ·
                Hết hạn{" "}
                {premium.premiumUntil
                  ? formatDate(premium.premiumUntil)
                  : "N/A"}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Plans */}
      {!premium?.isPremium && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
            >
              {plan.badge && (
                <span className="absolute -top-3 right-4 rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-zinc-950">
                  {plan.badge}
                </span>
              )}
              <p className="font-display text-lg font-bold text-white">
                {plan.name}
              </p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-white">
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-sm text-zinc-500">{plan.period}</span>
              </div>
              <ul className="mt-5 flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check size={14} className="text-primary-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-center text-xs text-zinc-500">
                Thanh toán qua app FinGenie (Stripe · Visa / Mastercard)
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Payment History */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-white">
          Lịch sử thanh toán
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">Chưa có giao dịch thanh toán.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    Gói {order.subscription.plan === "yearly" ? "Năm" : "Tháng"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(order.amount)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      order.status === "success"
                        ? "border border-green-500/20 bg-green-500/10 text-green-400"
                        : order.status === "pending"
                          ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                          : "border border-red-500/20 bg-red-500/10 text-red-400"
                    }`}
                  >
                    {order.status === "success"
                      ? "Thành công"
                      : order.status === "pending"
                        ? "Đang xử lý"
                        : "Thất bại"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
