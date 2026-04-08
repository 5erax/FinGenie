import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../hooks/use-theme-colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from "../constants/theme";

interface FinGenieLogoProps {
  /** sm=login screen, lg=splash screen */
  size?: "sm" | "lg";
  /** Show the tagline below the name */
  showTagline?: boolean;
}

/**
 * Professional FinGenie brand logo with icon + text.
 * Uses a diamond icon for the "Genie" magic/AI aspect combined
 * with the fintech aesthetic.
 */
export function FinGenieLogo({
  size = "lg",
  showTagline = false,
}: FinGenieLogoProps) {
  const colors = useThemeColors();
  const isLarge = size === "lg";

  const iconContainerSize = isLarge ? 88 : 64;
  const iconSize = isLarge ? 40 : 28;
  const nameSize = isLarge ? FONT_SIZE.h1 : FONT_SIZE.h2;
  const taglineSize = isLarge ? FONT_SIZE.body : FONT_SIZE.body2;

  return (
    <View style={styles.container}>
      {/* Icon mark */}
      <View
        style={[
          styles.iconContainer,
          {
            width: iconContainerSize,
            height: iconContainerSize,
            borderRadius: iconContainerSize * 0.28,
            backgroundColor: colors.accent,
          },
          isLarge && SHADOWS.accentGlow,
        ]}
      >
        {/* Inner glow ring */}
        <View
          style={[
            styles.iconInner,
            {
              width: iconContainerSize - 4,
              height: iconContainerSize - 4,
              borderRadius: (iconContainerSize - 4) * 0.28,
              borderColor: "rgba(255,255,255,0.2)",
            },
          ]}
        >
          <Ionicons name="sparkles" size={iconSize} color="#fff" />
        </View>
      </View>

      {/* Brand name */}
      <Text
        style={[
          styles.name,
          {
            fontSize: nameSize,
            color: colors.textPrimary,
            marginTop: isLarge ? SPACING.lg : SPACING.md,
          },
        ]}
      >
        Fin
        <Text style={{ color: colors.accent }}>Genie</Text>
      </Text>

      {/* Tagline */}
      {showTagline && (
        <Text
          style={[
            styles.tagline,
            { fontSize: taglineSize, color: colors.textMuted },
          ]}
        >
          Quản lý tài chính thông minh
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  name: {
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: SPACING.xs,
    lineHeight: 22,
    textAlign: "center",
  },
});
