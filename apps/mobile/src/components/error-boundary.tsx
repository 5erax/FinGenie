import React, { type ErrorInfo, type ReactNode } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from "../constants/theme";
import { useThemeColors, type ThemeColors } from "@/hooks/use-theme-colors";

// ─── Internal class component (receives colors as prop) ───────────────────────

interface ClassProps {
  children: ReactNode;
  fallback?: ReactNode;
  colors: ThemeColors;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches render errors
 * and shows a user-friendly fallback instead of crashing.
 *
 * Note: This is a class component (required for error boundaries).
 * It is wrapped by the exported `ErrorBoundary` function component
 * which injects the dynamic theme colors via `useThemeColors()`.
 */
class ErrorBoundaryClass extends React.Component<ClassProps, State> {
  constructor(props: ClassProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { colors } = this.props;

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${colors.warning}22` },
            ]}
          >
            <Ionicons name="warning-outline" size={40} color={colors.warning} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Đã xảy ra lỗi
          </Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>
            Ứng dụng gặp sự cố. Vui lòng thử lại.
          </Text>
          {__DEV__ && this.state.error && (
            <Text
              style={[
                styles.errorDetail,
                {
                  color: colors.danger,
                  backgroundColor: colors.surface,
                },
              ]}
              numberOfLines={4}
            >
              {this.state.error.message}
            </Text>
          )}
          <Pressable
            style={[styles.retryBtn, { backgroundColor: colors.accent }]}
            onPress={this.handleReset}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={colors.background}
            />
            <Text style={[styles.retryText, { color: colors.background }]}>
              Thử lại
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper function component — injects dynamic theme colors into the class-based
 * error boundary (hooks cannot be called inside class components).
 */
export function ErrorBoundary({ children, fallback }: Props) {
  const colors = useThemeColors();
  return (
    <ErrorBoundaryClass colors={colors} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}

export default ErrorBoundary;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONT_SIZE.body2,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.base,
  },
  errorDetail: {
    fontSize: FONT_SIZE.xs,
    fontFamily: "monospace",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    width: "100%",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  retryText: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
