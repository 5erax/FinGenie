"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  Crown,
  LogOut,
  Settings,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { useAuth } from "@/lib/auth-context";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface UserPortalProps {
  onClose?: () => void;
}

// ── Motion variants ───────────────────────────────────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
} as const;

const panelVariants = {
  hidden: { opacity: 0, scale: 0.93, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.05 },
  },
  exit: {
    opacity: 0,
    scale: 0.93,
    y: 20,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

/** Returns inline motion props for a staggered section. */
function sectionMotion(i: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.45,
      delay: 0.15 + i * 0.08,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  } as const;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
  photoURL,
  displayName,
}: {
  photoURL: string | null;
  displayName: string | null;
}) {
  const initial = displayName?.[0]?.toUpperCase() ?? "?";

  const ringClasses =
    "h-16 w-16 rounded-full ring-2 ring-primary-500/40 ring-offset-2 ring-offset-zinc-950";

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={displayName ?? "Ảnh đại diện"}
        referrerPolicy="no-referrer"
        className={`${ringClasses} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${ringClasses} flex items-center justify-center bg-gradient-to-br from-primary-500 to-accent-500`}
    >
      <span className="font-display text-xl font-bold text-zinc-950">
        {initial}
      </span>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px bg-white/[0.06]" aria-hidden="true" />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UserPortal({ onClose }: UserPortalProps) {
  const { user, signOut } = useAuth();

  if (!user) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSignOut = async () => {
    await signOut();
    onClose?.();
  };

  const handleUpgrade = () => {
    onClose?.();
    // Let close animation finish before scrolling
    setTimeout(() => {
      document
        .getElementById("pricing")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    /* ── Backdrop ── */
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: "oklch(0.05 0 0 / 0.75)",
        backdropFilter: "blur(6px)",
      }}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Cổng thông tin người dùng"
    >
      {/* ── Panel ── */}
      <motion.div
        className="relative w-full max-w-sm"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <GlassCard
          variant="strong"
          className="relative overflow-hidden p-0"
          hover={false}
        >
          {/* Decorative top glow */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28"
            style={{
              background:
                "linear-gradient(to bottom, oklch(0.69 0.17 163 / 0.12), transparent)",
            }}
            aria-hidden="true"
          />

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
              aria-label="Đóng"
            >
              <X size={15} />
            </button>
          )}

          <div className="flex flex-col gap-5 p-6">
            {/* ══════════════════════════════════════════
                § 1 — Profile
            ══════════════════════════════════════════ */}
            <motion.div
              className="flex flex-col items-center gap-3 pt-1"
              {...sectionMotion(0)}
            >
              <Avatar photoURL={user.photoURL} displayName={user.displayName} />

              <div className="text-center">
                <p className="font-display text-lg font-bold text-white">
                  {user.displayName ?? "Người dùng"}
                </p>
                <p className="mt-0.5 text-sm text-zinc-400">{user.email}</p>

                {/* Verification badge */}
                {user.emailVerified ? (
                  <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-primary-500/25 bg-primary-500/10 px-2.5 py-1 text-xs font-medium text-primary-400">
                    <CheckCircle size={11} aria-hidden="true" />
                    Email đã xác minh
                  </span>
                ) : (
                  <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                    Chưa xác minh email
                  </span>
                )}
              </div>
            </motion.div>

            <Divider />

            {/* ══════════════════════════════════════════
                § 2 — Subscription Status
            ══════════════════════════════════════════ */}
            <motion.div className="flex flex-col gap-3" {...sectionMotion(1)}>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Gói hiện tại
              </p>

              {/* Plan badge row */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/80">
                    <Sparkles
                      size={14}
                      className="text-zinc-400"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">Miễn Phí</p>
                    <p className="text-xs text-zinc-500">Tính năng cơ bản</p>
                  </div>
                </div>
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                  Free
                </span>
              </div>

              {/* Upgrade CTA */}
              <GradientButton
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleUpgrade}
              >
                <Crown size={14} aria-hidden="true" />
                Nâng cấp Premium
              </GradientButton>
            </motion.div>

            <Divider />

            {/* ══════════════════════════════════════════
                § 3 — Quick Links
            ══════════════════════════════════════════ */}
            <motion.div className="flex flex-col gap-3" {...sectionMotion(2)}>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Liên kết nhanh
              </p>

              <div className="flex flex-col gap-1.5">
                {/* Download App */}
                <GradientButton
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start gap-3"
                >
                  <Smartphone
                    size={14}
                    className="text-primary-400"
                    aria-hidden="true"
                  />
                  Tải App
                </GradientButton>

                {/* Account management — coming soon */}
                <div
                  className="relative flex w-full items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2 text-sm font-medium text-zinc-600"
                  aria-disabled="true"
                  title="Tính năng sắp ra mắt"
                >
                  <Settings size={14} aria-hidden="true" />
                  <span>Quản lý tài khoản</span>
                  <span className="ml-auto rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-600">
                    Sắp có
                  </span>
                </div>
              </div>
            </motion.div>

            <Divider />

            {/* ══════════════════════════════════════════
                § 4 — Sign Out
            ══════════════════════════════════════════ */}
            <motion.div {...sectionMotion(3)}>
              <GradientButton
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={handleSignOut}
              >
                <LogOut size={14} aria-hidden="true" />
                Đăng xuất
              </GradientButton>
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
