import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { GOOGLE_WEB_CLIENT_ID } from '../../src/constants/config';
import { useThemeColors } from '../../src/hooks/use-theme-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../src/constants/theme';

// Dismiss any lingering browser auth sessions
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const colors = useThemeColors();

  const handleGoogleLogin = async () => {
    setLoading('google');
    setError(null);
    try {
      if (Platform.OS === 'web') {
        // Web (dev + prod): use Firebase signInWithPopup
        const { signInWithPopup, GoogleAuthProvider: GAP } = await import('firebase/auth');
        const provider = new GAP();
        await signInWithPopup(auth, provider);
      } else {
        // Native (iOS/Android): imperative Google OAuth via browser
        if (!GOOGLE_WEB_CLIENT_ID) {
          setError('Google Sign-In chưa được cấu hình. Thiếu EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
          setLoading(null);
          return;
        }

        const redirectUri = AuthSession.makeRedirectUri({ preferLocalhost: false });
        const authUrl =
          'https://accounts.google.com/o/oauth2/v2/auth?' +
          `client_id=${encodeURIComponent(GOOGLE_WEB_CLIENT_ID)}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          'response_type=id_token&' +
          `scope=${encodeURIComponent('openid email profile')}&` +
          `nonce=${Math.random().toString(36).substring(2)}`;

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

        if (result.type === 'success' && result.url) {
          // Extract id_token from URL fragment (#id_token=xxx)
          const fragment = result.url.split('#')[1] ?? '';
          const params = new URLSearchParams(fragment);
          const idToken = params.get('id_token');

          if (idToken) {
            const credential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, credential);
            // onAuthStateChanged handles loginToBackend + redirect
          } else {
            setError('Không nhận được token từ Google. Vui lòng thử lại.');
            setLoading(null);
          }
        } else {
          // User cancelled or dismissed
          setLoading(null);
        }
        return;
      }
      // onAuthStateChanged in initialize() handles loginToBackend + redirect
    } catch (err: unknown) {
      if (__DEV__) console.error('Google login error:', err);
      const message = err instanceof Error ? err.message : '';
      if (message.includes('network')) {
        setError('Lỗi mạng. Vui lòng kiểm tra kết nối internet.');
      } else {
        setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
      setLoading(null);
    }
  };

  const handleEmailLogin = () => {
    router.push('/(auth)/email-auth');
  };

  const handlePhoneLogin = () => {
    router.push('/(auth)/phone-otp');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>💰</Text>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>FinGenie</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            Quản lý tài chính thông minh{'\n'}cho thế hệ Gen Z
          </Text>
        </View>

        {/* Auth Buttons */}
        <View style={styles.authSection}>
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          {/* Google Sign-In */}
          <Pressable
            style={({ pressed }) => [
              styles.authBtn,
              { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleGoogleLogin}
            disabled={loading !== null}
            accessibilityLabel="Đăng nhập với Google"
          >
            {loading === 'google' ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
                <Text style={[styles.authBtnText, { color: colors.textPrimary }]}>Đăng nhập với Google</Text>
              </>
            )}
          </Pressable>

          {/* Email Login */}
          <Pressable
            style={({ pressed }) => [
              styles.authBtn,
              { backgroundColor: colors.accent },
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleEmailLogin}
            disabled={loading !== null}
            accessibilityLabel="Đăng nhập bằng Email"
          >
            {loading === 'email' ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Ionicons name="mail-outline" size={20} color={colors.background} />
                <Text style={[styles.authBtnText, { color: colors.background }]}>
                  Đăng nhập bằng Email
                </Text>
              </>
            )}
          </Pressable>

          {/* Phone OTP Login */}
          <Pressable
            style={({ pressed }) => [
              styles.authBtn,
              { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
              pressed && { opacity: 0.8 },
            ]}
            onPress={handlePhoneLogin}
            disabled={loading !== null}
            accessibilityLabel="Đăng nhập bằng Số điện thoại"
          >
            <Ionicons name="phone-portrait-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.authBtnText, { color: colors.textPrimary }]}>
              Đăng nhập bằng SĐT
            </Text>
          </Pressable>
        </View>

        {/* Terms */}
        <Text style={[styles.terms, { color: colors.textDark }]}>
          Bằng việc đăng nhập, bạn đồng ý với{' '}
          <Text style={{ color: colors.accent }}>Điều khoản sử dụng</Text> và{' '}
          <Text style={{ color: colors.accent }}>Chính sách bảo mật</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.huge,
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: SPACING.base,
  },
  appName: {
    fontSize: FONT_SIZE.h1,
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: FONT_SIZE.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  authSection: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.caption,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: SPACING.base,
    borderRadius: 14,
  },
  authBtnText: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
  },
  terms: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
});
