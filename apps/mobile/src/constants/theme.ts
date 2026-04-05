/**
 * FinGenie Design System — Single source of truth for all visual tokens.
 *
 * Philosophy: 4px base grid, consistent scale, dark-first.
 * Every spacing, radius, font size, and shadow references this file.
 */

import { DARK_COLORS } from "./config";

// ─── Spacing (4px base grid) ──────────────────────────────────────────────────
export const SPACING = {
  /** 2px  */ xxs: 2,
  /** 4px  */ xs: 4,
  /** 6px  */ s: 6,
  /** 8px  */ sm: 8,
  /** 12px */ md: 12,
  /** 16px */ base: 16,
  /** 20px */ lg: 20,
  /** 24px */ xl: 24,
  /** 32px */ xxl: 32,
  /** 40px */ xxxl: 40,
  /** 48px */ huge: 48,
  /** 64px */ giant: 64,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONT_SIZE = {
  /** 10px */ xxs: 10,
  /** 11px */ xs: 11,
  /** 12px */ sm: 12,
  /** 13px */ caption: 13,
  /** 14px */ body2: 14,
  /** 15px */ body: 15,
  /** 16px */ base: 16,
  /** 18px */ lg: 18,
  /** 20px */ xl: 20,
  /** 22px */ xxl: 22,
  /** 24px */ h3: 24,
  /** 28px */ h2: 28,
  /** 32px */ h1: 32,
  /** 40px */ hero: 40,
  /** 48px */ display: 48,
} as const;

export const FONT_WEIGHT = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const LINE_HEIGHT = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  /** 4px  */ xs: 4,
  /** 6px  */ sm: 6,
  /** 8px  */ md: 8,
  /** 12px */ lg: 12,
  /** 16px */ xl: 16,
  /** 20px */ xxl: 20,
  /** 24px */ pill: 24,
  /** 999  */ full: 999,
} as const;

// ─── Shadows (dark-mode optimized) ────────────────────────────────────────────
export const SHADOWS = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  glow: (color: string, intensity = 0.5) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 12,
    elevation: 6,
  }),
  accentGlow: {
    shadowColor: DARK_COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Hit Slop (touch targets) ─────────────────────────────────────────────────
export const HIT_SLOP = {
  sm: { top: 8, bottom: 8, left: 8, right: 8 },
  md: { top: 12, bottom: 12, left: 12, right: 12 },
  lg: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;

// ─── Animation Durations ──────────────────────────────────────────────────────
export const DURATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  entrance: 350,
} as const;

// ─── Icon Sizes ───────────────────────────────────────────────────────────────
export const ICON_SIZE = {
  xs: 14,
  sm: 16,
  md: 20,
  base: 24,
  lg: 28,
  xl: 32,
  xxl: 40,
} as const;

// ─── Card Styles (common patterns) ───────────────────────────────────────────
export const CARD = {
  base: {
    backgroundColor: DARK_COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: DARK_COLORS.border,
    padding: SPACING.base,
  },
  elevated: {
    backgroundColor: DARK_COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: DARK_COLORS.border,
    padding: SPACING.base,
    ...SHADOWS.md,
  },
  glass: {
    backgroundColor: "rgba(24, 24, 27, 0.8)",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: SPACING.base,
  },
} as const;

// ─── Screen Padding (safe area aware) ─────────────────────────────────────────
export const SCREEN = {
  paddingHorizontal: SPACING.lg,
  paddingTop: SPACING.base,
  paddingBottom: SPACING.xxl,
} as const;

// Re-export COLORS for convenience
export { COLORS, DARK_COLORS, LIGHT_COLORS } from "./config";
