"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
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

        {/* Login form placeholder */}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@fingenie.vn"
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-primary-500/50 focus:bg-white/6"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-400">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-primary-500/50 focus:bg-white/6"
            />
          </div>

          <button
            type="button"
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-primary-500 to-primary-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:shadow-lg hover:shadow-primary-500/25"
          >
            Đăng nhập
          </button>
        </div>

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
