"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Banknote,
  Smartphone,
  CreditCard,
  Package,
  Activity,
  ArrowUpDown,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import {
  fetchAdminWallets,
  type AdminWallet,
  type PaginatedResponse,
} from "@/lib/admin-api";

// ── Wallet type config ────────────────────────────────────────────────────────

const WALLET_TYPES = [
  { value: "", label: "Tất cả" },
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Ngân hàng" },
  { value: "e_wallet", label: "Ví điện tử" },
  { value: "other", label: "Khác" },
] as const;

type WalletTypeValue = (typeof WALLET_TYPES)[number]["value"];

interface WalletTypeMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  iconColor: string;
}

const WALLET_TYPE_META: Record<string, WalletTypeMeta> = {
  cash: {
    label: "Tiền mặt",
    icon: Banknote,
    badge: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
    iconColor: "text-amber-400",
  },
  bank: {
    label: "Ngân hàng",
    icon: CreditCard,
    badge: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
    iconColor: "text-blue-400",
  },
  e_wallet: {
    label: "Ví điện tử",
    icon: Smartphone,
    badge: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
    iconColor: "text-violet-400",
  },
  other: {
    label: "Khác",
    icon: Package,
    badge: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30",
    iconColor: "text-zinc-400",
  },
};

function getTypeMeta(type: string): WalletTypeMeta {
  return (
    WALLET_TYPE_META[type] ?? {
      label: type,
      icon: Wallet,
      badge: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30",
      iconColor: "text-zinc-400",
    }
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBalance(amount: number, currency: string): string {
  return `${amount.toLocaleString("vi-VN")} ${currency}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Page Component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function AdminWalletsPage() {
  const [result, setResult] =
    useState<PaginatedResponse<AdminWallet> | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<WalletTypeValue>("");

  useEffect(() => {
    setLoading(true);
    setApiError(null);
    fetchAdminWallets({
      page,
      limit: PAGE_SIZE,
      type: typeFilter || undefined,
    })
      .then(setResult)
      .catch((err: Error) => {
        console.error("Failed to fetch wallets:", err);
        setApiError(
          "Không thể kết nối API. Hãy đảm bảo API server đang chạy trên localhost:4000",
        );
      })
      .finally(() => setLoading(false));
  }, [page, typeFilter]);

  const handleTypeChange = (value: WalletTypeValue) => {
    setTypeFilter(value);
    setPage(1);
  };

  const wallets = result?.data ?? [];
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;

  return (
    <div className="p-8">
      <PageHeader
        title="Quản lý Ví"
        description={
          loading ? "Đang tải…" : `${total.toLocaleString("vi-VN")} ví trong hệ thống`
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
          {/* Type filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {WALLET_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleTypeChange(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  typeFilter === value
                    ? "bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Record count */}
          <p className="text-xs text-zinc-600">
            {loading
              ? "Đang tải…"
              : `${wallets.length} / ${total.toLocaleString("vi-VN")} ví`}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {[
                  "Chủ sở hữu",
                  "Tên ví",
                  "Loại ví",
                  "Số dư",
                  "Tiền tệ",
                  "Giao dịch",
                  "Ngày tạo",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-zinc-600">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                      <span className="text-sm">Đang tải dữ liệu…</span>
                    </div>
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Wallet className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
                    <p className="text-sm text-zinc-600">Không có ví nào</p>
                  </td>
                </tr>
              ) : (
                wallets.map((wallet, idx) => {
                  const meta = getTypeMeta(wallet.type);
                  const TypeIcon = meta.icon;
                  return (
                    <motion.tr
                      key={wallet.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.03 }}
                      className="group border-b border-white/3 last:border-0 hover:bg-white/3"
                    >
                      {/* Owner */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-300">
                            {wallet.user?.displayName ?? "—"}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-600">
                            {wallet.user?.email ?? "Không có email"}
                          </p>
                        </div>
                      </td>

                      {/* Wallet name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/5`}
                          >
                            <TypeIcon className={`h-3.5 w-3.5 ${meta.iconColor}`} />
                          </div>
                          <span className="text-sm font-medium text-white">
                            {wallet.name}
                          </span>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}
                        >
                          <TypeIcon className={`h-3 w-3`} />
                          {meta.label}
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            wallet.balance >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatBalance(wallet.balance, wallet.currency)}
                        </span>
                      </td>

                      {/* Currency */}
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-400">
                          {wallet.currency}
                        </span>
                      </td>

                      {/* Transactions count */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                          <ArrowUpDown className="h-3.5 w-3.5 text-zinc-600" />
                          <span className="tabular-nums">
                            {(wallet._count?.transactions ?? 0).toLocaleString(
                              "vi-VN",
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-zinc-600">
                          {formatDate(wallet.createdAt)}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && wallets.length > 0 && (
          <div className="border-t border-white/5 px-6 py-4">
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
