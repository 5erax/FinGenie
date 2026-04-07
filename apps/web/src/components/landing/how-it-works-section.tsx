"use client";

import { BarChart3, ChevronRight, Smartphone, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";

// ─── Data ────────────────────────────────────────────────────────────────────

const steps = [
  {
    number: "01",
    Icon: Smartphone,
    title: "Tải App & Đăng Ký",
    description:
      "Tải FinGenie miễn phí, tạo tài khoản trong 30 giây và thiết lập hồ sơ tài chính cá nhân của bạn.",
    glowColor: "primary" as const,
    accentFrom: "from-primary-400",
    numberColor: "text-primary-400",
    iconBg: "from-primary-500/20 to-transparent",
  },
  {
    number: "02",
    Icon: BarChart3,
    title: "Ghi Chép & Theo Dõi",
    description:
      "Ghi lại thu chi hàng ngày dễ dàng. AI tự động phân loại, tổng hợp và trực quan hóa toàn bộ dữ liệu.",
    glowColor: "accent" as const,
    accentFrom: "from-accent-400",
    numberColor: "text-accent-400",
    iconBg: "from-accent-500/20 to-transparent",
  },
  {
    number: "03",
    Icon: TrendingUp,
    title: "AI Tư Vấn & Phát Triển",
    description:
      "Nhận lời khuyên tài chính cá nhân hóa từ AI Coach, theo dõi mục tiêu và tăng trưởng bền vững.",
    glowColor: "primary" as const,
    accentFrom: "from-primary-400",
    numberColor: "text-primary-400",
    iconBg: "from-primary-500/20 to-transparent",
  },
] as const;

// ─── Motion variants ──────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 44 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: 0.1 + i * 0.15,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const lineVariant = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.9,
      delay: 0.25,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const chevronVariant = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: 0.85 + i * 0.12,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

// ─── Connector data ───────────────────────────────────────────────────────────

const connectors = [
  { id: "c1", leftClass: "left-1/3" },
  { id: "c2", leftClass: "left-2/3" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="panel bg-zinc-950"
      aria-label="Cách thức hoạt động"
    >
      {/* Emerald glow — top-left */}
      <div
        className="glow-orb animate-float-slow pointer-events-none absolute -left-24 -top-32 h-[480px] w-[480px] bg-primary-500/15"
        aria-hidden="true"
        style={{ animationDelay: "0.4s" }}
      />
      {/* Violet glow — bottom-right */}
      <div
        className="glow-orb animate-pulse-glow pointer-events-none absolute -bottom-32 -right-24 h-[400px] w-[400px] bg-accent-500/15"
        aria-hidden="true"
      />
      {/* Subtle center glow */}
      <div
        className="glow-orb pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-primary-500/5"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-16 px-6 py-12">
        {/* Heading */}
        <SectionHeading
          badge="Cách Thức"
          title="Bắt Đầu"
          highlight="Dễ Dàng"
          description="Ba bước đơn giản để kiểm soát tài chính cá nhân và xây dựng tương lai vững chắc."
        />

        {/* Steps */}
        <div className="relative w-full">
          {/* Horizontal connector line — desktop only, renders behind cards via z-index */}
          <motion.div
            className="pointer-events-none absolute left-[16%] right-[16%] top-[52px] hidden h-px origin-left bg-gradient-to-r from-primary-400/40 via-accent-400/40 to-primary-400/40 lg:block"
            style={{ zIndex: 0 }}
            aria-hidden="true"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={lineVariant}
          />

          {/* Directional chevrons — sit on the line, between each step */}
          {connectors.map((conn, i) => (
            <motion.div
              key={conn.id}
              className={[
                "pointer-events-none absolute top-[52px] hidden -translate-x-1/2 -translate-y-1/2",
                "items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-900",
                "h-5 w-5 lg:flex",
                conn.leftClass,
              ].join(" ")}
              style={{ zIndex: 1 }}
              aria-hidden="true"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={chevronVariant}
            >
              <ChevronRight className="h-3 w-3 text-zinc-400" />
            </motion.div>
          ))}

          {/* Step cards grid — z-10 so cards stack above the connector line */}
          <div className="relative z-10 grid w-full grid-cols-1 gap-8 lg:grid-cols-3">
            {steps.map((step, index) => (
              <GlassCard
                key={step.number}
                variant="glow"
                glowColor={step.glowColor}
                className="flex flex-col items-center gap-5 text-center"
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                variants={cardVariants}
              >
                {/* Step number circle — solid bg so it visually "sits on" the connector line */}
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-zinc-950 shadow-lg">
                  <span
                    className={`font-display text-lg font-black ${step.numberColor}`}
                  >
                    {step.number}
                  </span>
                </div>

                {/* Icon container */}
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br ${step.iconBg}`}
                >
                  <step.Icon
                    className="h-7 w-7 text-white"
                    aria-hidden="true"
                  />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-display text-xl font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>

                {/* Decorative gradient accent line */}
                <div
                  className={`mt-auto h-px w-full bg-gradient-to-r ${step.accentFrom} to-transparent opacity-30`}
                />
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
