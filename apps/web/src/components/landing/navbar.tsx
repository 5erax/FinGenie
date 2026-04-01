"use client";

import { cn } from "@/lib/utils";
import { GradientButton } from "@/components/ui/gradient-button";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Tính năng", href: "#features" },
  { label: "Companion", href: "#companion" },
  { label: "AI Coach", href: "#ai-coach" },
  { label: "Bảng giá", href: "#pricing" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-white/[0.08] bg-zinc-950/80 py-3 backdrop-blur-2xl"
          : "bg-transparent py-5 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex items-center transition-opacity duration-200 hover:opacity-80"
          aria-label="FinGenie Home"
        >
          <span className="font-display text-2xl font-bold tracking-tight">
            <span className="text-white">Fin</span>
            <span className="bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
              Genie
            </span>
          </span>
        </Link>

        {/* ── Center nav — hidden on mobile ── */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group relative rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:bg-white/[0.04] hover:text-white"
            >
              {link.label}
              {/* Animated underline accent */}
              <span className="absolute bottom-1.5 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-primary-400 to-accent-400 transition-all duration-300 ease-out group-hover:w-3/5" />
            </Link>
          ))}
        </nav>

        {/* ── Right CTAs ── */}
        <div className="flex items-center gap-2">
          <Link href="/admin/login">
            <GradientButton variant="ghost" size="sm">
              Admin
            </GradientButton>
          </Link>
          <GradientButton variant="primary" size="sm">
            Tải App
          </GradientButton>
        </div>
      </div>
    </motion.nav>
  );
}
