/**
 * EmptyState — reusable placeholder for screens with no data.
 *
 * Shows a centered icon badge, title, description, and an optional
 * action button. Designed for the FinGenie dark-themed UI.
 *
 * Usage:
 *   <EmptyState
 *     icon="wallet-outline"
 *     title="Chưa có ví nào"
 *     description="Nhấn nút + để thêm ví đầu tiên"
 *     actionLabel="Thêm ví"
 *     actionIcon="add-circle-outline"
 *     onAction={() => router.push('/add-wallet')}
 *   />
 */

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from "../constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

// ─── Public API ───────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** Ionicons glyph name for the icon displayed inside the badge circle */
  icon: keyof typeof Ionicons.glyphMap;
  /** Bold short message, e.g. "Chưa có ví nào" */
  title: string;
  /** Supporting copy below the title */
  description: string;
  /**
   * Label for the optional CTA button.
   * The button is hidden when either `actionLabel` or `onAction` is omitted.
   */
  actionLabel?: string;
  /** Ionicons glyph rendered to the left of `actionLabel` inside the button */
  actionIcon?: keyof typeof Ionicons.glyphMap;
  /** Handler for the CTA button press */
  onAction?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
}: EmptyStateProps) {
  const colors = useThemeColors();
  const showAction = actionLabel !== undefined && onAction !== undefined;

  return (
    <View style={styles.container}>
      {/* ── Icon badge ─────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name={icon} size={48} color={colors.inactive} />
      </View>

      {/* ── Copy ───────────────────────────────────────────────────────────── */}
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>
        {description}
      </Text>

      {/* ── Optional action button ─────────────────────────────────────────── */}
      {showAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.accent },
            pressed && styles.actionBtnPressed,
          ]}
        >
          {actionIcon !== undefined && (
            <Ionicons name={actionIcon} size={18} color={colors.background} />
          )}
          <Text style={[styles.actionBtnText, { color: colors.background }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default EmptyState;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Wrapper ─────────────────────────────────────────────────────────────────
  container: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl, // 40px
    paddingHorizontal: SPACING.xl, // 24px
  },

  // ── Icon badge ──────────────────────────────────────────────────────────────
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44, // perfect circle
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.base, // 16px
  },

  // ── Copy ────────────────────────────────────────────────────────────────────
  title: {
    fontSize: 17,
    fontWeight: FONT_WEIGHT.semibold, // "600"
    marginBottom: SPACING.xs, // 4px
  },
  description: {
    fontSize: FONT_SIZE.body2, // 14px
    textAlign: "center",
    marginBottom: SPACING.lg, // 20px
  },

  // ── Action button ────────────────────────────────────────────────────────────
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s, // 6px
    paddingHorizontal: SPACING.xl, // 24px
    paddingVertical: 13,
    borderRadius: RADIUS.lg, // 12px
  },
  actionBtnPressed: {
    opacity: 0.85,
  },
  actionBtnText: {
    fontSize: FONT_SIZE.body2, // 14px
    fontWeight: FONT_WEIGHT.semibold, // "600"
  },
});
