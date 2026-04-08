"use client";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Loader2, Mail, Shield, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  defaultTab?: "user" | "admin";
}

// ── Motion variants ───────────────────────────────────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 12,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

const errorVariants = {
  hidden: { opacity: 0, y: -6, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    marginBottom: 16,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.18 },
  },
} as const;

// ── Google Icon SVG ───────────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess: _onLoginSuccess,
  defaultTab = "user",
}: AuthModalProps) {
  const router = useRouter();
  const { signIn, signInWithGoogle, error: authError } = useAuth();

  const [activeTab, setActiveTab] = useState<"user" | "admin">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isUserTab = activeTab === "user";
  const isAnyLoading = loading || googleLoading;

  // Sync auth-context errors into local error state
  useEffect(() => {
    if (authError) setLocalError(authError);
  }, [authError]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      const id = setTimeout(() => {
        setEmail("");
        setPassword("");
        setLocalError(null);
        setLoading(false);
        setGoogleLoading(false);
      }, 300);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Reset form when tab changes
  useEffect(() => {
    setEmail("");
    setPassword("");
    setLocalError(null);
  }, [activeTab]);

  // Sync defaultTab prop
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // ── Redirect after login ──────────────────────────────────────────────────
  const handleLoginSuccess = (role: string) => {
    if (activeTab === "admin" || role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  // ── Email/Password Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    try {
      const backendUser = await signIn(email, password);
      handleLoginSuccess(backendUser.role);
    } catch {
      // Error is already set by auth-context via useEffect sync
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setGoogleLoading(true);

    try {
      const backendUser = await signInWithGoogle();
      handleLoginSuccess(backendUser.role);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      // Don't show error for cancelled popups
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        // User cancelled, do nothing
      }
      // Error is already set by auth-context
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="auth-modal-backdrop"
            className="fixed inset-0 z-50 bg-zinc-950/75 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── Centering wrapper ── */}
          <div
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-hidden="true"
          >
            {/* ── Panel ── */}
            <motion.div
              key="auth-modal-panel"
              role="dialog"
              aria-modal="true"
              aria-label={
                isUserTab ? "Đăng nhập người dùng" : "Đăng nhập quản trị"
              }
              className="pointer-events-auto glass-strong relative w-full max-w-md overflow-hidden"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Decorative top glow ── */}
              <div
                className={cn(
                  "pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl transition-colors duration-500",
                  isUserTab ? "bg-primary-500/20" : "bg-accent-500/20",
                )}
                aria-hidden="true"
              />

              <div className="relative px-8 py-8">
                {/* ── Close button ── */}
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isAnyLoading}
                  aria-label="Đóng"
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-white/[0.07] hover:text-white disabled:pointer-events-none"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* ── Logo ── */}
                <div className="mb-6 text-center">
                  <span className="font-display text-3xl font-bold tracking-tight">
                    <span className="text-white">Fin</span>
                    <span className="bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                      Genie
                    </span>
                  </span>
                  <p className="mt-1.5 text-xs text-zinc-500">
                    {isUserTab
                      ? "Đăng nhập để trải nghiệm quản lý tài chính thông minh"
                      : "Truy cập bảng điều khiển quản trị"}
                  </p>
                </div>

                {/* ── Tabs ── */}
                <div className="mb-6 flex rounded-xl border border-white/[0.08] bg-white/[0.04] p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("user")}
                    disabled={isAnyLoading}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isUserTab
                        ? "bg-gradient-to-r from-primary-500 to-primary-400 text-zinc-950 shadow-md"
                        : "text-zinc-400 hover:text-white",
                    )}
                  >
                    <User className="h-3.5 w-3.5 shrink-0" />
                    Người dùng
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("admin")}
                    disabled={isAnyLoading}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      !isUserTab
                        ? "bg-gradient-to-r from-accent-500 to-accent-400 text-white shadow-md"
                        : "text-zinc-400 hover:text-white",
                    )}
                  >
                    <Shield className="h-3.5 w-3.5 shrink-0" />
                    Admin
                  </button>
                </div>

                {/* ── Error message ── */}
                <AnimatePresence mode="wait">
                  {localError && (
                    <motion.div
                      key="auth-error"
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                      variants={errorVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <svg
                        className="mt-px h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>{localError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Google Sign-In (User tab only) ── */}
                {isUserTab && (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isAnyLoading}
                    className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <GoogleIcon className="h-4 w-4" />
                    )}
                    Đăng nhập bằng Google
                  </button>
                )}

                {/* ── Divider ── */}
                {isUserTab && (
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/[0.08]" />
                    <span className="text-xs text-zinc-600">hoặc</span>
                    <div className="h-px flex-1 bg-white/[0.08]" />
                  </div>
                )}

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="auth-modal-email"
                      className="mb-1.5 block text-sm font-medium text-zinc-400"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
                        aria-hidden="true"
                      />
                      <input
                        id="auth-modal-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          isUserTab ? "ban@example.com" : "admin@fingenie.vn"
                        }
                        disabled={isAnyLoading}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-200 focus:border-primary-500/50 focus:bg-white/[0.06] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="auth-modal-password"
                      className="mb-1.5 block text-sm font-medium text-zinc-400"
                    >
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
                        aria-hidden="true"
                      />
                      <input
                        id="auth-modal-password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isAnyLoading}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-200 focus:border-primary-500/50 focus:bg-white/[0.06] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isAnyLoading || !email || !password}
                    className={cn(
                      "mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
                      isUserTab
                        ? "bg-gradient-to-r from-primary-500 to-primary-400 text-zinc-950 shadow-primary-500/25 hover:shadow-primary-500/40 hover:brightness-110"
                        : "bg-gradient-to-r from-accent-500 to-accent-400 text-white shadow-accent-500/25 hover:shadow-accent-500/40 hover:brightness-110",
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      "Đăng nhập bằng Email"
                    )}
                  </button>
                </form>

                {/* ── Footer note ── */}
                <p className="mt-5 text-center text-xs text-zinc-600">
                  {isUserTab
                    ? "Chưa có tài khoản? Tải app FinGenie để đăng ký."
                    : "Chỉ dành cho quản trị viên FinGenie."}
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
