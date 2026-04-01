"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface GradientButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-primary-500 to-primary-400 text-zinc-950 font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:brightness-110",
  secondary:
    "bg-surface-glass border border-border-glass text-white hover:bg-surface-glass-hover hover:border-border-glass-strong",
  ghost:
    "bg-transparent text-zinc-400 hover:text-white hover:bg-surface-glass",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-xl gap-2",
  md: "px-6 py-3 text-sm rounded-xl gap-2.5",
  lg: "px-8 py-4 text-base rounded-2xl gap-3",
};

export function GradientButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...motionProps
}: GradientButtonProps) {
  return (
    <motion.button
      className={cn(
        "relative inline-flex cursor-pointer items-center justify-center font-medium transition-all duration-300",
        variants[variant],
        sizes[size],
        className,
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
