"use client";

import { BarChart3, Lightbulb, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────

const capabilities = [
  { Icon: BarChart3, text: "Phân tích chi tiêu thông minh" },
  { Icon: Lightbulb, text: "Gợi ý tiết kiệm cá nhân hóa" },
  { Icon: TrendingUp, text: "Dự đoán xu hướng tài chính" },
] as const;

const chatMessages = [
  {
    role: "user" as const,
    text: "Tháng này mình tiêu bao nhiêu rồi?",
  },
  {
    role: "ai" as const,
    text: "Bạn đã chi 4.2 triệu VND tháng này. So với tháng trước tăng 12%. Chi tiêu lớn nhất: Ăn uống (1.8tr) và Di chuyển (980k).",
  },
  {
    role: "user" as const,
    text: "Làm sao tiết kiệm hơn?",
  },
  {
    role: "ai" as const,
    text: "Dựa trên phân tích, mình gợi ý: 1) Nấu ăn tại nhà 3 ngày/tuần tiết kiệm ~600k/tháng 2) Dùng xe buýt thay Grab tiết kiệm ~400k.",
  },
] as const;

// ─── Motion variants ──────────────────────────────────────────────────────────

const capabilityVariants = {
  hidden: { opacity: 0, x: -28 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.55,
      delay: 0.1 + i * 0.12,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const bubbleVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: 0.5 + i * 0.22,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

// ─── Send icon ────────────────────────────────────────────────────────────────

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AiSection() {
  return (
    <section className="panel bg-zinc-950" aria-label="AI Coach">
      {/* Violet glow orb — right */}
      <div
        className="glow-orb animate-float-slow pointer-events-none absolute right-[10%] top-1/2 h-[560px] w-[560px] -translate-y-1/2 bg-accent-500/18"
        aria-hidden="true"
        style={{ animationDelay: "0.8s" }}
      />
      {/* Subtle emerald — left */}
      <div
        className="glow-orb animate-pulse-glow pointer-events-none absolute -left-20 top-1/3 h-[320px] w-[320px] bg-primary-500/10"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-6 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-12">
        {/* ── Left: 40% ── */}
        <div className="flex w-full flex-col gap-8 lg:w-2/5">
          {/* SectionHeading animates itself */}
          <SectionHeading
            badge="Cố Vấn"
            title="AI Coach"
            highlight="Thông Minh"
            description="Trợ lý tài chính AI riêng của bạn. Hỏi bất cứ điều gì về chi tiêu, tiết kiệm hay đầu tư."
            align="left"
          />

          {/* Capability cards */}
          <div className="flex flex-col gap-3">
            {capabilities.map((item, i) => (
              <GlassCard
                key={item.text}
                variant="default"
                className="flex items-center gap-3.5 px-4 py-3"
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={capabilityVariants}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  <item.Icon className="h-6 w-6 text-white" />
                </span>
                <span className="font-body text-sm font-medium text-zinc-300">
                  {item.text}
                </span>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* ── Right: 60% — Chat window ── */}
        <GlassCard
          variant="strong"
          hover={false}
          className="flex w-full flex-col overflow-hidden rounded-2xl p-0 lg:w-3/5"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-accent-400"
              aria-hidden="true"
            >
              <span className="font-display text-sm font-black text-zinc-950">
                F
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-white">
                FinGenie AI
              </p>
              <p className="font-body text-xs text-zinc-500">
                Trợ lý tài chính thông minh
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-glow"
                aria-hidden="true"
              />
              <span className="font-body text-xs text-zinc-400">Online</span>
            </div>
          </div>

          {/* Messages area */}
          <div
            className="flex flex-col gap-4 p-5"
            role="log"
            aria-label="Lịch sử chat"
          >
            {chatMessages.map((msg, i) => (
              <motion.div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={bubbleVariants}
              >
                {msg.role === "ai" && (
                  <div
                    className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-accent-400"
                    aria-hidden="true"
                  >
                    <span className="text-[10px] font-black text-zinc-950">
                      F
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[76%] rounded-2xl px-4 py-2.5 font-body text-sm leading-relaxed",
                    msg.role === "user"
                      ? "rounded-tr-sm bg-primary-500 text-white"
                      : "rounded-tl-sm glass text-zinc-200",
                  )}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Chat input */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl glass px-4 py-2.5">
              <input
                type="text"
                placeholder="Hỏi AI Coach..."
                disabled
                aria-label="Chat input (demo)"
                className="flex-1 cursor-not-allowed bg-transparent font-body text-sm text-zinc-400 placeholder:text-zinc-500 focus:outline-none"
              />
              <button
                disabled
                aria-label="Gửi tin nhắn"
                className="flex h-7 w-7 shrink-0 cursor-not-allowed items-center justify-center rounded-lg bg-primary-500/30 text-primary-400 transition-opacity"
              >
                <SendIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
