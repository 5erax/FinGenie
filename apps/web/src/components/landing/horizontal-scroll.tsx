"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface HorizontalScrollProps {
  children: ReactNode;
}

export function HorizontalScroll({ children }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

      const tween = gsap.to(scroller, {
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

      return () => {
        tween.kill();
      };
    });

    return () => {
      mm.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
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
