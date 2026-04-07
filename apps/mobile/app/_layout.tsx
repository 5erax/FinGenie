import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  LogBox,
  Platform,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../src/lib/query-client";
import { useAuthStore } from "../src/stores/auth-store";
import { usePreferencesStore } from "../src/stores/preferences-store";
import { useNotifications } from "../src/hooks/use-notifications";
import { ErrorBoundary } from "../src/components/error-boundary";
import { FinGenieLogo } from "../src/components/FinGenieLogo";
import { useThemeColors, useIsDarkTheme } from "../src/hooks/use-theme-colors";
import { SPACING } from "../src/constants/theme";

// Suppress known non-actionable warnings from React Navigation/RN Web internals
if (Platform.OS === "web") {
  LogBox.ignoreLogs([
    "Blocked aria-hidden on a <div> element",
    "Cross-Origin-Opener-Policy",
  ]);
}

function SplashScreen() {
  const colors = useThemeColors();
  return (
    <View
      style={[splashStyles.container, { backgroundColor: colors.background }]}
    >
      <FinGenieLogo size="lg" />
      <ActivityIndicator
        size="large"
        color={colors.accent}
        style={splashStyles.spinner}
      />
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: { marginTop: SPACING.xxl },
});

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isNewUser = useAuthStore((s) => s.isNewUser);
  const pendingEmailVerification = useAuthStore(
    (s) => s.pendingEmailVerification,
  );
  const hydrate = usePreferencesStore((s) => s.hydrate);
  const isHydrated = usePreferencesStore((s) => s.isHydrated);
  const colors = useThemeColors();
  const isDark = useIsDarkTheme();
  const router = useRouter();
  const segments = useSegments();
  useNotifications();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  // Wait for BOTH auth initialization AND preferences hydration
  const isReady = !isLoading && isHydrated;

  // Auth guard: redirect based on authentication state
  useEffect(() => {
    if (!isReady) return; // Wait for both Firebase auth + preferences to resolve
    const inAuthGroup = segments[0] === "(auth)";
    const onOnboarding =
      inAuthGroup && (segments as string[])[1] === "onboarding";
    const onVerifyEmail =
      inAuthGroup && (segments as string[])[1] === "verify-email";

    // Email verification pending — keep user on verify-email screen
    if (pendingEmailVerification) {
      if (!onVerifyEmail) {
        router.replace("/(auth)/verify-email");
      }
      return;
    }

    if (!isAuthenticated && (!inAuthGroup || onVerifyEmail)) {
      // Not authenticated & not on auth screen (or stuck on verify-email after logout) -> redirect to login
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup && !onOnboarding) {
      // Authenticated, on auth screen (not onboarding) -> redirect
      if (isNewUser) {
        // New user -> show onboarding
        router.replace("/(auth)/onboarding");
      } else {
        router.replace("/(tabs)");
      }
    } else if (isAuthenticated && isNewUser && !inAuthGroup) {
      // New user somehow got to tabs without onboarding -> redirect
      router.replace("/(auth)/onboarding");
    }
  }, [
    isReady,
    isAuthenticated,
    isNewUser,
    pendingEmailVerification,
    segments,
    router,
  ]);

  // Show splash while auth or preferences are initializing
  if (!isReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <SplashScreen />
      </GestureHandlerRootView>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
