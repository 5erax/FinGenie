"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: "default" | "strong" | "glow";
  glowColor?: "primary" | "accent" | "warm";
  className?: string;
  hover?: boolean;
}

const glowColors = {
  primary: "group-hover:shadow-primary-500/20",
  accent: "group-hover:shadow-accent-500/20",
  warm: "group-hover:shadow-warm-500/20",
} as const;

export function GlassCard({
  children,
  variant = "default",
  glowColor = "primary",
  className,
  hover = true,
  ...motionProps
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "group relative rounded-2xl p-6",
        variant === "default" && "glass-card",
        variant === "strong" && "glass-strong",
        variant === "glow" && [
          "glass-card",
          hover && "hover:shadow-2xl",
          hover && glowColors[glowColor],
        ],
        className,
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
