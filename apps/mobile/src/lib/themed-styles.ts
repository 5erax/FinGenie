import { useMemo } from "react";
import {
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from "react-native";
import { useThemeColors, type ThemeColors } from "@/hooks/use-theme-colors";

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Create theme-aware styles. Receives the current theme colors and returns a StyleSheet.
 *
 * Usage:
 * ```
 * const useStyles = createThemedStyles((colors) => ({
 *   container: { backgroundColor: colors.background },
 *   title: { color: colors.textPrimary },
 * }));
 *
 * function MyScreen() {
 *   const { styles, colors } = useStyles();
 *   return <View style={styles.container}>...</View>;
 * }
 * ```
 */
export function createThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: ThemeColors) => T,
) {
  return function useStyles() {
    const colors = useThemeColors();

    const styles = useMemo(() => StyleSheet.create(factory(colors)), [colors]);

    return { styles, colors };
  };
}
