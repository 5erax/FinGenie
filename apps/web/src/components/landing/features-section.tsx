"use client";

import { Bell, Bot, Target, Wallet } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    Icon: Wallet,
    title: "Ví Thông Minh",
    description:
      "Theo dõi thu chi realtime, phân loại tự động, báo cáo trực quan",
    glowColor: "primary" as const,
  },
  {
    Icon: Bot,
    title: "AI Coach Tài Chính",
    description: "Trợ lý AI hiểu bạn, tư vấn chi tiêu thông minh 24/7",
    glowColor: "accent" as const,
  },
  {
    Icon: Target,
    title: "Kế Hoạch Tiết Kiệm",
    description: "Tự động tính toán ngân sách hàng ngày với Safe Money AI",
    glowColor: "primary" as const,
  },
  {
    Icon: Bell,
    title: "Cảnh Báo Thông Minh",
    description:
      "Nhận thông báo khi chi tiêu vượt ngân sách hoặc cần điều chỉnh",
    glowColor: "accent" as const,
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function FeaturesSection() {
  return (
    <section className="panel bg-zinc-950">
      {/* Emerald glow — top-right */}
      <div
        className="glow-orb animate-pulse-glow pointer-events-none absolute -right-20 -top-40 h-[520px] w-[520px] bg-primary-500/20"
        aria-hidden="true"
      />

      {/* Violet glow — bottom-left */}
      <div
        className="glow-orb animate-float-slow pointer-events-none absolute -bottom-40 -left-20 h-[420px] w-[420px] bg-accent-500/20"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-16 px-6 py-12">
        {/* Heading */}
        <SectionHeading
          badge="Trang Bị"
          title="Công Cụ"
          highlight="Cho Cuộc Phiêu Lưu"
        />

        {/* 2×2 grid — stacks on mobile, 2 cols on lg */}
        <div className="grid w-full grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          {features.map((feature, index) => (
            <GlassCard
              key={feature.title}
              variant="glow"
              glowColor={feature.glowColor}
              className="flex flex-col gap-5"
              initial={{ opacity: 0, y: 44 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: 0.65,
                delay: index * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Icon */}
              <span
                className="text-5xl leading-none"
                role="img"
                aria-label={feature.title}
              >
                <feature.Icon className="h-6 w-6 text-white" />
              </span>

              {/* Text */}
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-xl font-bold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </div>

              {/* Decorative gradient accent line */}
              <div
                className={[
                  "mt-auto h-px w-full bg-gradient-to-r to-transparent opacity-30",
                  feature.glowColor === "primary"
                    ? "from-primary-400"
                    : "from-accent-400",
                ].join(" ")}
              />
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
