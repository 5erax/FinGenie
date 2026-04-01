"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Reusable animated heading for sections
interface SectionHeadingProps {
  badge?: string;
  title: string;
  highlight?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  badge,
  title,
  highlight,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <motion.div
      className={cn("flex flex-col gap-4", alignClass, className)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {badge && (
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border-glass bg-surface-glass px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
          {badge}
        </span>
      )}
      <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
        {title}
        {highlight && (
          <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            {" "}{highlight}
          </span>
        )}
      </h2>
      {description && (
        <p className="max-w-lg text-lg text-zinc-400">
          {description}
        </p>
      )}
    </motion.div>
  );
}
