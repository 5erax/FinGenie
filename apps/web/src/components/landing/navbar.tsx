"use client";

import { cn } from "@/lib/utils";
import { GradientButton } from "@/components/ui/gradient-button";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Tính năng", href: "#features" },
  { label: "Cách thức", href: "#how-it-works" },
  { label: "Đánh giá", href: "#testimonials" },
  { label: "Bảng giá", href: "#pricing" },
] as const;

interface NavbarProps {
  onLoginClick?: () => void;
  isLoggedIn?: boolean;
  onPortalClick?: () => void;
}

export function Navbar({
  onLoginClick,
  isLoggedIn,
  onPortalClick,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        scrolled || isMenuOpen
          ? "border-b border-white/[0.08] bg-zinc-950/80 py-3 backdrop-blur-2xl"
          : "bg-transparent py-5 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
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
            {/* Desktop CTAs */}
            <div className="hidden items-center gap-2 lg:flex">
              {isLoggedIn ? (
                <GradientButton
                  variant="primary"
                  size="sm"
                  onClick={onPortalClick}
                >
                  Tài khoản
                </GradientButton>
              ) : (
                <>
                  <GradientButton
                    variant="ghost"
                    size="sm"
                    onClick={onLoginClick}
                  >
                    Đăng nhập
                  </GradientButton>
                  <GradientButton variant="primary" size="sm">
                    Tải App
                  </GradientButton>
                </>
              )}
            </div>

            {/* ── Hamburger button — mobile only ── */}
            <button
              className="flex items-center justify-center rounded-lg p-2 text-zinc-400 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white lg:hidden"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                /* X icon */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                /* Hamburger icon */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile menu panel ── */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden lg:hidden"
            >
              <div className="flex flex-col gap-1 border-t border-white/[0.06] pb-4 pt-3">
                {/* Nav links */}
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:bg-white/[0.04] hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}

                {/* CTAs */}
                <div className="mt-3 flex flex-col gap-2 px-4">
                  {isLoggedIn ? (
                    <GradientButton
                      variant="primary"
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onPortalClick?.();
                      }}
                    >
                      Tài khoản
                    </GradientButton>
                  ) : (
                    <>
                      <GradientButton
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLoginClick?.();
                        }}
                      >
                        Đăng nhập
                      </GradientButton>
                      <GradientButton
                        variant="primary"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Tải App
                      </GradientButton>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
