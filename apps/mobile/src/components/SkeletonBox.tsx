import React, { useEffect, useRef } from "react";
import { Animated, Platform, type ViewStyle } from "react-native";
import { RADIUS, SPACING } from "../constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({
  width = "100%",
  height = SPACING.base,
  borderRadius = RADIUS.md,
  style,
}: SkeletonBoxProps) {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        { opacity },
        style,
      ]}
    />
  );
}
