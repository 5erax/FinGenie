import { Platform, type ViewStyle } from "react-native";

/**
 * Cross-platform shadow that uses `boxShadow` on web (avoiding deprecated shadow* props)
 * and native shadow* on iOS. Android gets `elevation` only.
 *
 * @param color  - Hex color string (e.g. "#a78bfa")
 * @param ox     - Horizontal offset in px (default 0)
 * @param oy     - Vertical offset in px (default 0)
 * @param opacity - Shadow opacity 0-1
 * @param radius  - Blur radius in px
 * @param elevation - Android elevation (default radius * 0.5)
 */
export function shadow(
  color: string,
  ox: number,
  oy: number,
  opacity: number,
  radius: number,
  elevation?: number,
): ViewStyle {
  if (Platform.OS === "web") {
    const rgba = hexToRgba(color, opacity);
    return {
      boxShadow: `${ox}px ${oy}px ${radius}px ${rgba}`,
    } as ViewStyle;
  }

  return {
    shadowColor: color,
    shadowOffset: { width: ox, height: oy },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation ?? Math.round(radius * 0.5),
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
