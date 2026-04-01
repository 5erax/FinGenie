"use client";

import { Cat, Gamepad2, Sprout, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────

const statItems = [
  { Icon: Sprout, text: "Level Up khi tiết kiệm đạt mục tiêu" },
  { Icon: Gamepad2, text: "Mở khóa trang phục và phụ kiện" },
  { Icon: Trophy, text: "Thử thách hàng tuần với phần thưởng" },
] as const;

const statusBars = [
  { label: "Hạnh phúc", fill: 85, barClass: "bg-primary-400" },
  { label: "Năng lượng", fill: 72, barClass: "bg-warm-400" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function PetSection() {
  return (
    <section className="panel bg-zinc-950">
      {/* Warm amber glow — right / pet area */}
      <div
        className="glow-orb animate-pulse-glow absolute right-0 top-1/2 h-[640px] w-[640px] -translate-y-1/2 translate-x-1/3 bg-warm-500/25"
        aria-hidden="true"
      />

      {/* Subtle violet glow — bottom-left */}
      <div
        className="glow-orb animate-float-slow absolute -bottom-28 left-8 h-[320px] w-[320px] bg-accent-500/10"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-6xl items-center gap-12 px-6">
        {/* ── Left: 40% ──────────────────────────────────────────────────── */}
        <div className="flex w-full flex-col gap-10 lg:w-[40%]">
          {/* Heading */}
          <SectionHeading
            align="left"
            badge="Đồng Hành"
            title="Người Bạn"
            highlight="Tài Chính"
            description="Nuôi thú cưng đáng yêu, cùng bạn chinh phục mục tiêu tài chính. Thú cưng phát triển khi bạn quản lý tiền tốt hơn!"
          />

          {/* Stat items */}
          <div className="flex flex-col gap-3">
            {statItems.map((stat, i) => (
              <GlassCard
                key={stat.text}
                variant="default"
                hover={false}
                className="flex flex-row items-center gap-4 p-4"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1] as const,
                  delay: 0.2 + i * 0.1,
                }}
              >
                <span
                  className="shrink-0 text-2xl leading-none"
                  role="img"
                  aria-hidden="true"
                >
                  <stat.Icon className="h-6 w-6 text-white" />
                </span>
                <p className="text-sm font-medium text-zinc-300">{stat.text}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* ── Right: 60% — pet showcase (desktop only) ───────────────────── */}
        <motion.div
          className="hidden lg:flex lg:w-[60%]"
          initial={{ opacity: 0, scale: 0.88 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <GlassCard
            variant="strong"
            hover={false}
            className="flex w-full flex-col items-center gap-10 px-10 py-14"
          >
            {/* Pet placeholder — CSS float animation */}
            <span
              className="animate-float inline-block select-none text-[120px] leading-none"
              role="img"
              aria-label="Thú cưng tài chính"
            >
              <Cat className="h-16 w-16 text-white" />
            </span>

            {/* Status bars + level */}
            <div className="flex w-full max-w-[280px] flex-col gap-5">
              {statusBars.map((bar) => (
                <div key={bar.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">
                      {bar.label}
                    </span>
                    <span className="text-xs font-bold text-zinc-300">
                      {bar.fill}%
                    </span>
                  </div>
                  {/* Track */}
                  <div
                    className={cn(
                      "h-2 w-full overflow-hidden rounded-full",
                      "border border-border-glass bg-surface-glass",
                    )}
                  >
                    {/* Animated fill */}
                    <motion.div
                      className={cn("h-full rounded-full", bar.barClass)}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${bar.fill}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 1.1,
                        ease: [0.22, 1, 0.36, 1] as const,
                        delay: 0.6,
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Level badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Level</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1",
                    "bg-gradient-to-r from-warm-500 to-warm-400",
                    "text-xs font-bold text-zinc-950",
                  )}
                >
                  12
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
