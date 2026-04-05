/**
 * ScreenHeader — reusable back-button + title header used across all screens.
 *
 * Layout: [BackButton 40×40] [Title flex:1] [rightElement | Placeholder 40px]
 * The fixed-width flanking elements keep the title visually centred.
 *
 * Note: HIT_SLOP is intentionally omitted — the back button is already 40×40,
 * which satisfies the minimum touch-target guideline without expansion.
 */

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from "../constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ScreenHeaderProps {
  /** Screen title rendered in the centre slot. */
  title: string;
  /**
   * Called when the back button is pressed.
   * Defaults to `router.back()` when omitted.
   */
  onBack?: () => void;
  /**
   * Optional element that replaces the invisible right-side placeholder.
   * Ideal for a single icon-action button (~40×40) to balance the layout.
   */
  rightElement?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScreenHeader({
  title,
  onBack,
  rightElement,
}: ScreenHeaderProps) {
  const colors = useThemeColors();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={styles.header}>
      {/* Back button */}
      <Pressable
        style={({ pressed }) => [
          styles.backBtn,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          pressed && styles.backBtnPressed,
        ]}
        onPress={handleBack}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>

      {/* Title */}
      <Text
        style={[styles.headerTitle, { color: colors.textPrimary }]}
        accessibilityRole="header"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>

      {/* Right slot — renders custom element or a spacer for visual balance */}
      {rightElement != null ? (
        rightElement
      ) : (
        <View style={styles.headerPlaceholder} />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base, // 16
    paddingBottom: SPACING.md, // 12
    gap: SPACING.md, // 12
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg, // 12
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  backBtnPressed: {
    opacity: 0.6,
  },

  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.lg, // 18
    fontWeight: FONT_WEIGHT.bold, // '700'
  },

  /** Mirrors the back button width so the title stays centred. */
  headerPlaceholder: {
    width: 40,
  },
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export default ScreenHeader;
