"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in (in useEffect to avoid setState-in-render)
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/admin");
    }
  }, [authLoading, user, router]);

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/admin");
    } catch {
      // Error is already set in auth context, but we also capture it here
      setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="glow-orb absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 bg-primary-500/12 animate-pulse-glow" />
      </div>

      <motion.div
        className="glass-strong relative z-10 w-full max-w-md p-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-white">Fin</span>
              <span className="bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                Genie
              </span>
            </h1>
          </Link>
          <p className="mt-2 text-sm text-zinc-500">Admin Dashboard</p>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-zinc-400"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fingenie.vn"
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-primary-500/50 focus:bg-white/6"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-zinc-400"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-primary-500/50 focus:bg-white/6"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
