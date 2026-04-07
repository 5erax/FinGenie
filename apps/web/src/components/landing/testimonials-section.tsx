"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";

// ─── Data ────────────────────────────────────────────────────────────────────

const testimonials = [
  {
    name: "Minh Anh",
    role: "Sinh viên, 22 tuổi",
    initial: "M",
    color: "#6366f1",
    rating: 5,
    quote:
      "FinGenie giúp mình kiểm soát chi tiêu tốt hơn rất nhiều. Từ khi dùng app, mình tiết kiệm được 2 triệu mỗi tháng!",
  },
  {
    name: "Hoàng Nam",
    role: "Freelancer, 25 tuổi",
    initial: "H",
    color: "#10b981",
    rating: 5,
    quote:
      "AI Coach tư vấn cực kỳ hữu ích. Mình đã lập được quỹ khẩn cấp sau 3 tháng sử dụng.",
  },
  {
    name: "Thu Hà",
    role: "Nhân viên văn phòng, 23 tuổi",
    initial: "T",
    color: "#f59e0b",
    rating: 4,
    quote:
      "Thú cưng trong app rất dễ thương và tạo động lực ghi chép chi tiêu mỗi ngày.",
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="panel bg-zinc-950"
      aria-label="Đánh giá từ người dùng"
    >
      {/* Glow orbs */}
      <div
        className="glow-orb animate-float pointer-events-none absolute -left-20 top-1/3 h-[460px] w-[460px] bg-accent-500/15"
        aria-hidden="true"
      />
      <div
        className="glow-orb animate-float-slow pointer-events-none absolute -right-20 bottom-1/4 h-[400px] w-[400px] bg-primary-500/12"
        aria-hidden="true"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-14 px-6 py-12">
        {/* Heading */}
        <SectionHeading
          badge="Đánh Giá"
          title="Người Dùng"
          highlight="Yêu Thích"
        />

        {/* Testimonial grid */}
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, index) => (
            <GlassCard
              key={t.name}
              variant="glow"
              glowColor={index === 1 ? "primary" : "accent"}
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
              {/* Quote icon */}
              <div
                className="text-3xl leading-none text-zinc-700"
                aria-hidden="true"
              >
                &ldquo;
              </div>

              {/* Quote text */}
              <p className="flex-1 text-sm leading-relaxed text-zinc-300">
                {t.quote}
              </p>

              {/* Stars */}
              <div className="flex gap-1" aria-label={`${t.rating} trên 5 sao`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < t.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-zinc-700 text-zinc-700"
                    }`}
                  />
                ))}
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-white/6" aria-hidden="true" />

              {/* Author */}
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <motion.div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: t.color }}
                  whileHover={{ scale: 1.1 }}
                >
                  {t.initial}
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">
                    {t.name}
                  </p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
