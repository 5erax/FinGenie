"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeaturedReview {
  id: string;
  rating: number;
  content: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

// ─── Fallback Data (shown while API loads or if no featured reviews) ────────

const fallbackTestimonials: FeaturedReview[] = [
  {
    id: "fallback-1",
    rating: 5,
    content:
      "FinGenie giúp mình kiểm soát chi tiêu tốt hơn rất nhiều. Từ khi dùng app, mình tiết kiệm được 2 triệu mỗi tháng!",
    user: { id: "1", displayName: "Minh Anh", avatarUrl: null },
  },
  {
    id: "fallback-2",
    rating: 5,
    content:
      "AI Coach tư vấn cực kỳ hữu ích. Mình đã lập được quỹ khẩn cấp sau 3 tháng sử dụng.",
    user: { id: "2", displayName: "Hoàng Nam", avatarUrl: null },
  },
  {
    id: "fallback-3",
    rating: 4,
    content:
      "Thú cưng trong app rất dễ thương và tạo động lực ghi chép chi tiêu mỗi ngày.",
    user: { id: "3", displayName: "Thu Hà", avatarUrl: null },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

// Assign a consistent color based on the first char of the user id
const AVATAR_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
];
function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TestimonialsSection() {
  const [reviews, setReviews] =
    useState<FeaturedReview[]>(fallbackTestimonials);

  useEffect(() => {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ??
      "https://fingenie-production.up.railway.app/api/v1";

    fetch(`${API_URL}/reviews/featured`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: { data: FeaturedReview[]; total: number }) => {
        if (data.data && data.data.length > 0) {
          setReviews(data.data.slice(0, 6)); // Show up to 6
        }
        // If no featured reviews yet, keep fallback data
      })
      .catch(() => {
        // Silently use fallback data
      });
  }, []);

  // Responsive grid: 3 cols on desktop, adapt if fewer reviews
  const displayReviews = reviews.slice(0, 6);
  const gridCols =
    displayReviews.length <= 2
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-1 md:grid-cols-3";

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
        <div className={`grid w-full gap-6 ${gridCols}`}>
          {displayReviews.map((t, index) => (
            <GlassCard
              key={t.id}
              variant="glow"
              glowColor={index % 2 === 1 ? "primary" : "accent"}
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
                {t.content}
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
                  style={{ backgroundColor: getAvatarColor(t.id) }}
                  whileHover={{ scale: 1.1 }}
                >
                  {t.user.avatarUrl ? (
                    <img
                      src={t.user.avatarUrl}
                      alt={t.user.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    getInitial(t.user.displayName)
                  )}
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">
                    {t.user.displayName}
                  </p>
                  <p className="text-xs text-zinc-500">Người dùng FinGenie</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
