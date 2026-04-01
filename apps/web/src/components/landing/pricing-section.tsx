"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────

const freeFeatures: { text: string; included: boolean }[] = [
  { text: "1 ví điện tử", included: true },
  { text: "Ghi chép thu chi cơ bản", included: true },
  { text: "Báo cáo chi tiêu hàng tháng", included: true },
  { text: "Thú cưng cơ bản", included: true },
  { text: "AI Coach nâng cao", included: false },
  { text: "Safe Money thông minh", included: false },
  { text: "Không giới hạn ví", included: false },
];

const premiumFeatures: string[] = [
  "Không giới hạn ví",
  "AI Coach thông minh 24/7",
  "Safe Money nâng cao",
  "Phân tích chi tiêu AI",
  "Thú cưng đặc biệt & trang phục",
  "Ưu tiên hỗ trợ",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureRow({
  text,
  included,
}: {
  text: string;
  included: boolean;
}) {
  return (
    <li className="flex items-center gap-2.5 font-body text-sm">
      <span
        className={cn(
          "shrink-0 text-base font-bold",
          included ? "text-primary-400" : "text-zinc-600",
        )}
        aria-hidden="true"
      >
        {included ? "✓" : "✗"}
      </span>
      <span className={cn(included ? "text-zinc-300" : "text-zinc-600 line-through decoration-zinc-700")}>
        {text}
      </span>
    </li>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PricingSection() {
  return (
    <section className="panel bg-zinc-950" aria-label="Pricing">
      {/* Emerald glow — center */}
      <div
        className="glow-orb animate-pulse-glow pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 bg-primary-500/10"
        aria-hidden="true"
      />
      {/* Accent glow — top-right */}
      <div
        className="glow-orb animate-float-slow pointer-events-none absolute -right-20 top-0 h-[400px] w-[400px] bg-accent-500/08"
        aria-hidden="true"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-14 px-6 py-12 lg:px-12">

        {/* ── Heading ── */}
        <SectionHeading
          badge="Lựa Chọn"
          title="Chọn Hành Trình"
          highlight="Của Bạn"
          align="center"
        />

        {/* ── Cards ── */}
        <div className="flex w-full flex-col gap-6 md:flex-row md:items-start md:gap-8">

          {/* Free Plan */}
          <GlassCard
            variant="default"
            className="flex flex-1 flex-col gap-6 p-7"
            initial={{ opacity: 0, y: 44 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Plan heading */}
            <div>
              <p className="font-display text-xl font-bold text-white">Miễn Phí</p>
              <p className="mt-2 font-body">
                <span className="text-3xl font-black text-zinc-200">0</span>
                <span className="ml-1 text-base font-normal text-zinc-500">đ/tháng</span>
              </p>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-white/6" aria-hidden="true" />

            {/* Features */}
            <ul className="flex flex-col gap-3" aria-label="Tính năng gói miễn phí">
              {freeFeatures.map((f) => (
                <FeatureRow key={f.text} text={f.text} included={f.included} />
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-auto pt-4">
              <GradientButton variant="secondary" size="md" className="w-full">
                Bắt Đầu Miễn Phí
              </GradientButton>
            </div>
          </GlassCard>

          {/* Premium Plan */}
          <GlassCard
            variant="glow"
            glowColor="primary"
            className="relative flex flex-1 flex-col gap-6 border border-primary-500/30 p-8 md:py-10"
            initial={{ opacity: 0, y: 44 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* "Popular" badge */}
            <motion.span
              className="absolute right-5 top-5 rounded-full bg-primary-500 px-3 py-1 font-body text-xs font-semibold text-zinc-950"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
              aria-label="Gói phổ biến nhất"
            >
              Phổ biến nhất
            </motion.span>

            {/* Plan heading */}
            <div>
              <p className="font-display text-xl font-bold text-white">Premium</p>
              <p className="mt-2 font-body">
                <span className="text-3xl font-black text-primary-400">79.000</span>
                <span className="ml-1 text-base font-normal text-zinc-400">đ/tháng</span>
              </p>
            </div>

            {/* Divider — emerald tinted */}
            <div className="h-px w-full bg-primary-500/20" aria-hidden="true" />

            {/* Features */}
            <ul className="flex flex-col gap-3" aria-label="Tính năng gói Premium">
              {premiumFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5 font-body text-sm">
                  <span className="shrink-0 text-base font-bold text-primary-400" aria-hidden="true">
                    ✓
                  </span>
                  <span className="text-zinc-200">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-auto pt-4">
              <GradientButton variant="primary" size="md" className="w-full">
                Nâng Cấp Premium
              </GradientButton>
            </div>

            {/* Subtle inner glow ring */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.69 0.17 163 / 0.06) 0%, transparent 60%)",
              }}
              aria-hidden="true"
            />
          </GlassCard>
        </div>

        {/* Money-back note */}
        <motion.p
          className="font-body text-xs text-zinc-600"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Hủy bất kỳ lúc nào · Không cần thẻ tín dụng
        </motion.p>
      </div>
    </section>
  );
}
