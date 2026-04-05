import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { usePreferencesStore } from "@/stores/preferences-store";
import { DARK_COLORS, LIGHT_COLORS } from "@/constants/config";

export type ThemeColors = {
  [K in keyof typeof DARK_COLORS]: string;
};

/**
 * Returns the resolved color palette based on user preference.
 * - "dark" → dark palette
 * - "light" → light palette
 * - "system" → follows device setting
 */
export function useThemeColors(): ThemeColors {
  const theme = usePreferencesStore((s) => s.theme);
  const systemScheme = useColorScheme();

  return useMemo(() => {
    if (theme === "light") return LIGHT_COLORS;
    if (theme === "dark") return DARK_COLORS;
    // "system" — follow device preference
    return systemScheme === "light" ? LIGHT_COLORS : DARK_COLORS;
  }, [theme, systemScheme]);
}

/**
 * Returns true if the current resolved theme is dark.
 */
export function useIsDarkTheme(): boolean {
  const theme = usePreferencesStore((s) => s.theme);
  const systemScheme = useColorScheme();

  return useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return systemScheme !== "light";
  }, [theme, systemScheme]);
}
