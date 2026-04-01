"use client";

import { GradientButton } from "@/components/ui/gradient-button";
import { motion } from "framer-motion";

// ── Motion variants ──────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
} as const;

// ── Chevron icon (no external dep) ──────────────────────────────────────────
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section className="panel" aria-label="Hero">
      {/* ── Decorative grid ── */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: [
            "linear-gradient(oklch(1 0 0 / 0.03) 1px, transparent 1px)",
            "linear-gradient(90deg, oklch(1 0 0 / 0.03) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "80px 80px",
        }}
      />

      {/* ── Glow orbs ── */}
      {/* Emerald — left */}
      <div
        className="glow-orb animate-float pointer-events-none absolute -left-24 top-1/4 h-[520px] w-[520px]"
        aria-hidden="true"
        style={{ background: "oklch(0.69 0.17 163 / 0.20)" }}
      />
      {/* Violet — right */}
      <div
        className="glow-orb animate-float-slow pointer-events-none absolute -right-24 top-1/3 h-[440px] w-[440px]"
        aria-hidden="true"
        style={{
          background: "oklch(0.63 0.21 293 / 0.15)",
          animationDelay: "1.5s",
        }}
      />
      {/* Amber — bottom center */}
      <div
        className="glow-orb animate-float pointer-events-none absolute bottom-16 left-1/2 h-[320px] w-[320px] -translate-x-1/2"
        aria-hidden="true"
        style={{
          background: "oklch(0.75 0.16 85 / 0.10)",
          animationDelay: "3s",
        }}
      />

      {/* ── Main content ── */}
      <motion.div
        className="relative z-10 flex max-w-5xl flex-col items-center gap-8 px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-zinc-400 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400" />
            AI-Powered · Gen Z Vietnam
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="font-display text-6xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl"
          variants={itemVariants}
        >
          Cuộc Phiêu Lưu
          <br />
          <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Tài Chính
          </span>{" "}
          Bắt Đầu
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl"
          variants={itemVariants}
        >
          Trợ lý AI thông minh giúp Gen Z Việt Nam quản lý chi tiêu, tiết kiệm
          hiệu quả và đạt mục tiêu tài chính.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4"
          variants={itemVariants}
        >
          <GradientButton variant="primary" size="lg">
            Bắt Đầu Ngay
          </GradientButton>
          <GradientButton variant="secondary" size="lg">
            Tìm Hiểu Thêm
          </GradientButton>
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      >
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-600">
          Khám Phá
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-zinc-600" />
        </motion.div>
      </motion.div>
    </section>
  );
}
