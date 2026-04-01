"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { motion } from "framer-motion";

// ── Pain-point data ──────────────────────────────────────────────────────────
const painPoints = [
  {
    icon: "📊",
    title: "Không Biết Tiền Đi Đâu",
    desc: "Chi tiêu hàng ngày mà không theo dõi, cuối tháng lại hết sạch",
    glowColor: "primary" as const,
    accentFrom: "from-primary-400",
  },
  {
    icon: "😩",
    title: "Tiết Kiệm Nhàm Chán",
    desc: "Muốn tiết kiệm nhưng không có động lực, dễ bỏ cuộc giữa chừng",
    glowColor: "accent" as const,
    accentFrom: "from-accent-400",
  },
  {
    icon: "🤷",
    title: "Thiếu Kiến Thức Tài Chính",
    desc: "Không biết hỏi ai, sách vở thì quá khô khan cho Gen Z",
    glowColor: "warm" as const,
    accentFrom: "from-warm-400",
  },
] as const;

// ── Component ────────────────────────────────────────────────────────────────
export function ProblemSection() {
  return (
    <section className="panel" aria-label="Why managing money is hard">
      {/* ── Background danger glow — suggests pain / friction ── */}
      <div
        className="glow-orb animate-pulse-glow pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
        style={{ background: "oklch(0.55 0.21 28 / 0.08)" }} /* red-ish */
      />
      <div
        className="glow-orb pointer-events-none absolute -left-16 bottom-1/4 h-[320px] w-[320px]"
        aria-hidden="true"
        style={{ background: "oklch(0.65 0.18 50 / 0.10)" }} /* orange-ish */
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-16 px-6">
        {/* Section heading */}
        <SectionHeading
          badge="Thử Thách"
          title="Quản Lý Tiền"
          highlight="Không Nên Khó Khăn"
          description="85% Gen Z Việt Nam gặp khó khăn trong việc quản lý tài chính cá nhân. FinGenie biến điều đó thành cuộc phiêu lưu thú vị."
        />

        {/* ── Pain point cards ── */}
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
          {painPoints.map((point, index) => (
            <GlassCard
              key={point.title}
              variant="glow"
              glowColor={point.glowColor}
              className="flex flex-col gap-5"
              initial={{ opacity: 0, y: 44 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: 0.7,
                delay: index * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Icon container */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-3xl">
                {point.icon}
              </div>

              {/* Text content */}
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-lg font-bold leading-snug text-white">
                  {point.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {point.desc}
                </p>
              </div>

              {/* Decorative gradient line at bottom of card */}
              <div
                className={`mt-auto h-px w-full bg-gradient-to-r ${point.accentFrom} to-transparent opacity-40`}
              />
            </GlassCard>
          ))}
        </div>

        {/* ── Stat strip ── */}
        <motion.div
          className="flex w-full flex-wrap items-center justify-center gap-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-5 backdrop-blur-sm"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {[
            { value: "85%", label: "Gen Z gặp khó khăn tài chính" },
            { value: "3x", label: "Chi tiêu vượt ngân sách trung bình" },
            { value: "62%", label: "Không có quỹ khẩn cấp" },
          ].map((stat) => (
            <div
              key={stat.value}
              className="flex flex-col items-center gap-1 text-center"
            >
              <span className="font-display text-3xl font-bold text-white">
                {stat.value}
              </span>
              <span className="max-w-[140px] text-xs leading-relaxed text-zinc-500">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
