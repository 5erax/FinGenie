"use client";

import { motion } from "framer-motion";
import { GradientButton } from "@/components/ui/gradient-button";

// ─── Data ────────────────────────────────────────────────────────────────────

const footerLinks = [
  { label: "Điều khoản", href: "#" },
  { label: "Bảo mật", href: "#" },
  { label: "Liên hệ", href: "#" },
] as const;

// ─── Motion variants ──────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function CtaSection() {
  return (
    <section className="panel relative flex-col bg-zinc-950" aria-label="Call to action">

      {/* ── Multi-orb background ── */}
      {/* Emerald — top-left */}
      <div
        className="glow-orb animate-float pointer-events-none absolute -left-20 top-1/4 h-[500px] w-[500px] bg-primary-500/18"
        aria-hidden="true"
        style={{ animationDelay: "0s" }}
      />
      {/* Violet — bottom-right */}
      <div
        className="glow-orb animate-float-slow pointer-events-none absolute -bottom-20 -right-20 h-[480px] w-[480px] bg-accent-500/15"
        aria-hidden="true"
        style={{ animationDelay: "2s" }}
      />
      {/* Amber — center-right */}
      <div
        className="glow-orb animate-pulse-glow pointer-events-none absolute right-1/4 top-1/2 h-[300px] w-[300px] -translate-y-1/2 bg-warm-500/12"
        aria-hidden="true"
        style={{ animationDelay: "1s" }}
      />
      {/* Emerald soft — center */}
      <div
        className="glow-orb pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-primary-500/06"
        aria-hidden="true"
      />

      {/* ── Main content ── */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {/* Eyebrow badge */}
        <motion.span
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-1.5 font-body text-xs font-medium uppercase tracking-widest text-zinc-400"
          variants={itemVariants}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-warm-400 animate-pulse-glow" aria-hidden="true" />
          Bắt Đầu Hành Trình
        </motion.span>

        {/* Heading */}
        <motion.div
          className="flex flex-col items-center gap-1"
          variants={itemVariants}
        >
          <h2 className="font-display text-6xl font-black leading-[1.05] tracking-tight text-white lg:text-7xl xl:text-8xl">
            Sẵn Sàng
          </h2>
          <h2 className="font-display text-6xl font-black leading-[1.05] tracking-tight lg:text-7xl xl:text-8xl">
            Bắt Đầu{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.76 0.16 163) 0%, oklch(0.74 0.15 293) 50%, oklch(0.82 0.15 85) 100%)",
              }}
            >
              Phiêu Lưu?
            </span>
          </h2>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="max-w-xl font-body text-base leading-relaxed text-zinc-400 lg:text-lg"
          variants={itemVariants}
        >
          Tải FinGenie ngay hôm nay và bắt đầu kiểm soát tài chính cùng trợ lý AI thông minh nhất.
        </motion.p>

        {/* App store buttons */}
        <motion.div
          className="flex flex-col items-center gap-4 sm:flex-row"
          variants={itemVariants}
        >
          <GradientButton variant="primary" size="lg" aria-label="Tải về trên App Store">
            <span aria-hidden="true">🍎</span>
            App Store
          </GradientButton>
          <GradientButton variant="secondary" size="lg" aria-label="Tải về trên Google Play">
            <span aria-hidden="true">🤖</span>
            Google Play
          </GradientButton>
        </motion.div>

        {/* Trust line */}
        <motion.p
          className="font-body text-sm text-zinc-500"
          variants={itemVariants}
        >
          Miễn phí&nbsp;&nbsp;•&nbsp;&nbsp;Không cần thẻ&nbsp;&nbsp;•&nbsp;&nbsp;Bắt đầu trong 30 giây
        </motion.p>
      </motion.div>

      {/* ── Footer ── */}
      <motion.footer
        className="absolute bottom-0 left-0 right-0 border-t border-white/5 px-6 py-5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.8 }}
        aria-label="Site footer"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="font-body text-xs text-zinc-600">
            © 2026 FinGenie. All rights reserved.
          </p>
          <nav className="flex items-center gap-1" aria-label="Footer navigation">
            {footerLinks.map((link, i) => (
              <span key={link.label} className="flex items-center">
                {i > 0 && (
                  <span className="mx-3 text-zinc-700" aria-hidden="true">|</span>
                )}
                <a
                  href={link.href}
                  className="font-body text-xs text-zinc-600 transition-colors duration-200 hover:text-zinc-300"
                >
                  {link.label}
                </a>
              </span>
            ))}
          </nav>
        </div>
      </motion.footer>
    </section>
  );
}
