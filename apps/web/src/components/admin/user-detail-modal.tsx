"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  Ban,
  Calendar,
  Crown,
  Mail,
  Phone,
  Shield,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";

import { type AdminUser } from "@/lib/admin-api";

// AdminUser may not have `status` from the API yet – extend locally so we can
// accept it from the server response when it's eventually added.
type UserWithStatus = AdminUser & { status?: string };

interface UserDetailModalProps {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onBan?: (id: string) => void;
  onRestore?: (id: string) => void;
}

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPremiumActive(premiumUntil: string | null): boolean {
  if (!premiumUntil) return false;
  return new Date(premiumUntil) > new Date();
}

function getStatusFromUser(user: UserWithStatus): string | undefined {
  if ("status" in user) return user.status;
  return undefined;
}

// ── sub-components ─────────────────────────────────────────────────────────

function Avatar({ user }: { user: AdminUser }) {
  const initials =
    (user.displayName ?? user.email ?? "?")[0]?.toUpperCase() ?? "?";

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName ?? "Avatar"}
        className="h-20 w-20 rounded-full object-cover ring-2 ring-primary-500/40"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-500/20 ring-2 ring-primary-500/40">
      <span className="text-3xl font-bold text-primary-400">{initials}</span>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}

function InfoItem({ icon: Icon, label, value, mono = false }: InfoItemProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-zinc-900/60 p-3">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p
        className={`truncate text-sm text-zinc-300 ${mono ? "font-mono text-xs" : ""}`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

interface CountBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}

function CountBadge({ icon: Icon, label, count }: CountBadgeProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-zinc-900/60 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10">
        <Icon className="h-5 w-5 text-primary-400" />
      </div>
      <span className="text-xl font-bold text-white">{count}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function UserDetailModal({
  user,
  open,
  onClose,
  onBan,
  onRestore,
}: UserDetailModalProps) {
  if (!user) return null;

  const typed = user as UserWithStatus;
  const status = getStatusFromUser(typed);
  const isBanned = status === "banned";
  const premium = isPremiumActive(user.premiumUntil);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Overlay ── */}
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* ── Modal ── */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              className="glass-strong pointer-events-auto w-full max-w-2xl rounded-2xl"
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Header bar ── */}
              <div className="flex items-center justify-between border-b border-zinc-800/60 px-6 py-4">
                <h2 className="text-base font-semibold text-zinc-200">
                  Chi tiết người dùng
                </h2>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Scrollable body ── */}
              <div className="max-h-[calc(100vh-10rem)] space-y-5 overflow-y-auto px-6 py-5">
                {/* ── User Header ── */}
                <div className="flex items-start gap-4">
                  <Avatar user={user} />

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-bold text-white">
                      {user.displayName ?? "Không có tên"}
                    </h3>

                    <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{user.email ?? "—"}</span>
                    </div>

                    {/* ── Badges ── */}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {/* Role */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-500/15 text-purple-300"
                            : "bg-zinc-700/60 text-zinc-400"
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                      </span>

                      {/* Premium */}
                      {premium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                          <Crown className="h-3 w-3" />
                          Premium
                        </span>
                      )}

                      {/* Status */}
                      {status !== undefined && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isBanned
                              ? "bg-red-500/15 text-red-300"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {isBanned ? (
                            <Ban className="h-3 w-3" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}
                          {isBanned ? "Đã khóa" : "Hoạt động"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Info Grid ── */}
                <div>
                  <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">
                    Thông tin tài khoản
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <InfoItem
                      icon={Phone}
                      label="Số điện thoại"
                      value={user.phone ?? "Chưa cập nhật"}
                    />
                    <InfoItem
                      icon={Shield}
                      label="Firebase UID"
                      value={user.firebaseUid}
                      mono
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Ngày tạo"
                      value={formatDate(user.createdAt)}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Cập nhật lần cuối"
                      value={formatDate(user.updatedAt)}
                    />
                  </div>
                </div>

                {/* ── Activity Summary ── */}
                <div>
                  <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">
                    Hoạt động
                  </p>
                  <div className="flex gap-2">
                    <CountBadge
                      icon={ArrowUpDown}
                      label="Giao dịch"
                      count={user._count?.transactions ?? 0}
                    />
                    <CountBadge
                      icon={Wallet}
                      label="Ví tiền"
                      count={user._count?.wallets ?? 0}
                    />
                  </div>
                </div>
              </div>

              {/* ── Footer Actions ── */}
              <div className="flex items-center justify-end gap-2 border-t border-zinc-800/60 px-6 py-4">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                >
                  Đóng
                </button>

                {/* Conditionally show ban / restore */}
                {status === undefined || !isBanned
                  ? onBan && (
                      <button
                        onClick={() => onBan(user.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                      >
                        <Ban className="h-4 w-4" />
                        Khóa tài khoản
                      </button>
                    )
                  : onRestore && (
                      <button
                        onClick={() => onRestore(user.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
                      >
                        <UserCheck className="h-4 w-4" />
                        Mở khóa tài khoản
                      </button>
                    )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
