"use client";

import { useRef, useEffect, useLayoutEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// useLayoutEffect on client, useEffect on server (SSR-safe)
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface HorizontalScrollProps {
  children: ReactNode;
}

export function HorizontalScroll({ children }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  useIsomorphicLayoutEffect(() => {
    // Create a GSAP context scoped to our container — makes cleanup reliable
    const ctx = gsap.context(() => {
      // Mobile fallback — no horizontal scroll below lg
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const container = containerRef.current;
        const scroller = scrollRef.current;
        if (!container || !scroller) return;

        const panels = gsap.utils.toArray<HTMLElement>(".panel", scroller);
        if (panels.length === 0) return;

        // Calculate total scroll width
        const totalWidth = panels.length * window.innerWidth;

        gsap.to(scroller, {
          x: () => -(totalWidth - window.innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: container,
            pin: true,
            scrub: 1,
            end: () => `+=${totalWidth - window.innerWidth}`,
            invalidateOnRefresh: true,
          },
        });
      });
    }, containerRef);

    ctxRef.current = ctx;

    // Synchronous cleanup — runs before React removes DOM nodes
    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-hidden lg:h-screen">
      <div
        ref={scrollRef}
        className="flex flex-col lg:h-screen lg:flex-row lg:flex-nowrap"
      >
        {children}
      </div>
    </div>
  );
}
