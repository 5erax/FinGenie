import { Stack } from 'expo-router';
import { useThemeColors } from '../../src/hooks/use-theme-colors';

export default function AuthLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="email-auth" />
      <Stack.Screen name="phone-otp" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
