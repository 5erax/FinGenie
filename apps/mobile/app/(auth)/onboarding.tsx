import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '../../src/stores/auth-store';
import { useThemeColors } from '../../src/hooks/use-theme-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../src/constants/theme';

export default function OnboardingScreen() {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const colors = useThemeColors();

  const handleContinue = async () => {
    if (!displayName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await updateProfile({ displayName: displayName.trim() });
    } catch (err) {
      console.error('Profile update error:', err);
      setError('Không thể cập nhật tên. Bạn có thể thay đổi sau trong cài đặt.');
    }
    // Always proceed to tabs (name can be updated later)
    useAuthStore.setState({ isNewUser: false });
    router.replace('/(tabs)');
    setLoading(false);
  };

  const handleSkip = () => {
    useAuthStore.setState({ isNewUser: false });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Welcome */}
          <View style={styles.iconContainer}>
            <Ionicons name="hand-left-outline" size={32} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Chào mừng đến FinGenie!</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Hãy cho chúng tôi biết tên của bạn để cá nhân hóa trải nghiệm
          </Text>

          {/* Name Input */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            placeholder="Tên hiển thị"
            placeholderTextColor={colors.textDark}
            value={displayName}
            onChangeText={setDisplayName}
            autoFocus
            maxLength={50}
          />

          {/* Continue Button */}
          <PrimaryButton
            title="Tiếp tục"
            onPress={handleContinue}
            loading={loading}
            disabled={loading || !displayName.trim()}
            icon="arrow-forward"
            style={{ marginBottom: SPACING.md }}
          />

          {/* Skip */}
          <Pressable
            style={styles.skipBtn}
            onPress={handleSkip}
          >
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Bỏ qua</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 80,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xxl,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.h3,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.body,
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    fontSize: FONT_SIZE.base,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  errorBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
    marginBottom: SPACING.base,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.caption,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  skipText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.medium,
  },
});
