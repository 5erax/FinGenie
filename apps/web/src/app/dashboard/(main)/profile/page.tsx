"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Shield,
  Crown,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { fetchProfile, fetchPremiumStatus, type PremiumStatus } from "@/lib/api";

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function ProfilePage() {
  const { user, backendUser, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<{
    id: string;
    email: string | null;
    phone: string | null;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    premiumUntil: string | null;
    createdAt: string;
  } | null>(null);
  const [premium, setPremium] = useState<PremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([fetchProfile(), fetchPremiumStatus()])
      .then(([profileRes, premiumRes]) => {
        if (profileRes.status === "fulfilled") setProfile(profileRes.value);
        if (premiumRes.status === "fulfilled") setPremium(premiumRes.value);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const displayProfile = profile ?? {
    id: backendUser?.id ?? "",
    email: backendUser?.email ?? user?.email ?? null,
    phone: backendUser?.phone ?? null,
    displayName: backendUser?.displayName ?? user?.displayName ?? "Người dùng",
    avatarUrl: backendUser?.avatarUrl ?? user?.photoURL ?? null,
    role: backendUser?.role ?? "user",
    premiumUntil: backendUser?.premiumUntil ?? null,
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-8 font-display text-2xl font-bold text-white">
        Hồ sơ
      </h1>

      {/* Avatar & Name */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
      >
        {displayProfile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayProfile.avatarUrl}
            alt="Avatar"
            className="h-16 w-16 rounded-full object-cover ring-2 ring-primary-500/40 ring-offset-2 ring-offset-zinc-950"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 ring-2 ring-primary-500/40 ring-offset-2 ring-offset-zinc-950">
            <span className="font-display text-xl font-bold text-zinc-950">
              {displayProfile.displayName[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
        )}
        <div>
          <h2 className="font-display text-xl font-bold text-white">
            {displayProfile.displayName}
          </h2>
          <p className="text-sm text-zinc-400">{displayProfile.email}</p>
          {user?.emailVerified ? (
            <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-green-400">
              <CheckCircle size={12} /> Email đã xác minh
            </span>
          ) : (
            <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-amber-400">
              <AlertCircle size={12} /> Chưa xác minh email
            </span>
          )}
        </div>
      </motion.div>

      {/* Info Cards */}
      <div className="flex flex-col gap-4">
        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Thông tin tài khoản
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-sm text-white">
                  {displayProfile.email ?? "Chưa thiết lập"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">Số điện thoại</p>
                <p className="text-sm text-white">
                  {displayProfile.phone ?? "Chưa thiết lập"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">Vai trò</p>
                <p className="text-sm capitalize text-white">
                  {displayProfile.role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User size={16} className="text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">Ngày tham gia</p>
                <p className="text-sm text-white">
                  {formatDate(displayProfile.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Gói dịch vụ
          </h3>
          {premium?.isPremium ? (
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <Crown size={20} className="text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-amber-300">
                  Premium Active
                </p>
                <p className="text-xs text-amber-400/70">
                  Hết hạn{" "}
                  {premium.premiumUntil
                    ? formatDate(premium.premiumUntil)
                    : "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Gói Miễn Phí</p>
              <a
                href="/dashboard/subscription"
                className="rounded-lg bg-primary-500/15 px-3 py-1.5 text-xs font-medium text-primary-400 transition-colors hover:bg-primary-500/25"
              >
                Nâng cấp
              </a>
            </div>
          )}
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </motion.div>
      </div>
    </div>
  );
}
