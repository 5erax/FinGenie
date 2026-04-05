/**
 * PrimaryButton — reusable action button for the FinGenie dark-themed UI.
 *
 * Supports three variants (primary / danger / outline), two sizes (lg / md),
 * an optional Ionicons icon, loading indicator, and full accessibility state.
 */

import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from "../constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

// ─── Public API ───────────────────────────────────────────────────────────────

export interface PrimaryButtonProps {
  /** Button label */
  title: string;
  /** Called when the button is pressed (no-op when disabled or loading) */
  onPress: () => void;
  /** Shows an ActivityIndicator and blocks interaction */
  loading?: boolean;
  /** Reduces opacity and blocks interaction */
  disabled?: boolean;
  /** Optional Ionicons icon rendered to the left of the label */
  icon?: keyof typeof Ionicons.glyphMap;
  /**
   * Visual style variant.
   * - `primary`  — accent background, dark text  (default)
   * - `danger`   — danger background, dark text
   * - `outline`  — transparent background, accent border + text
   */
  variant?: "primary" | "danger" | "outline";
  /**
   * Vertical padding scale.
   * - `lg` — paddingVertical 14  (default, matches full-width CTA pattern)
   * - `md` — paddingVertical 10
   */
  size?: "md" | "lg";
  /** Additional container style (e.g. custom width / margin) */
  style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  variant = "primary",
  size = "lg",
  style,
}: PrimaryButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;

  // ── Variant-specific style resolution ──────────────────────────────────────
  const containerVariantStyle =
    variant === "primary"
      ? { backgroundColor: colors.accent }
      : variant === "danger"
        ? { backgroundColor: colors.danger }
        : {
            backgroundColor: "transparent" as const,
            borderWidth: 1.5,
            borderColor: colors.accent,
          };

  const textVariantStyle =
    variant === "outline"
      ? { color: colors.accent }
      : { color: colors.background };

  // Outline variant uses accent-coloured content; solid variants use dark text
  const contentColor =
    variant === "outline" ? colors.accent : colors.background;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        containerVariantStyle,
        size === "md" ? styles.sizeMd : styles.sizeLg,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} size="small" />
      ) : (
        <>
          {icon !== undefined && (
            <Ionicons name={icon} size={20} color={contentColor} />
          )}
          <Text style={[styles.text, textVariantStyle]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export default PrimaryButton;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Layout base ─────────────────────────────────────────────────────────────
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.s, // 6px — matches gap in screen-level saveBtn patterns
    borderRadius: RADIUS.xl, // 16px
  },

  // ── Sizes ────────────────────────────────────────────────────────────────────
  sizeLg: {
    paddingVertical: 14, // full-width CTA height
  },
  sizeMd: {
    paddingVertical: 10, // inline / compact button height
  },

  // ── Interaction states ───────────────────────────────────────────────────────
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },

  // ── Label ────────────────────────────────────────────────────────────────────
  text: {
    fontSize: FONT_SIZE.body, // 15px
    fontWeight: FONT_WEIGHT.semibold, // "600"
  },
});
