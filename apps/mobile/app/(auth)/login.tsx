import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { GOOGLE_WEB_CLIENT_ID } from '../../src/constants/config';
import { useThemeColors } from '../../src/hooks/use-theme-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../src/constants/theme';
import { FinGenieLogo } from '../../src/components/FinGenieLogo';

// Configure Google Sign-In once (web client ID for Firebase ID token exchange)
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

export default function LoginScreen() {
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const colors = useThemeColors();

  const handleGoogleLogin = async () => {
    setLoading('google');
    setError(null);
    try {
      if (Platform.OS === 'web') {
        // Web: use Firebase signInWithPopup directly
        const { signInWithPopup, GoogleAuthProvider: GAP } = await import('firebase/auth');
        const provider = new GAP();
        await signInWithPopup(auth, provider);
      } else {
        // Native: use @react-native-google-signin native SDK
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await GoogleSignin.signIn();

        if (response.type === 'cancelled') {
          setLoading(null);
          return;
        }

        const idToken = response.data?.idToken;
        if (!idToken) {
          setError('Không nhận được token từ Google. Vui lòng thử lại.');
          setLoading(null);
          return;
        }

        // Exchange Google ID token for Firebase credential
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
        // onAuthStateChanged in initialize() handles loginToBackend + redirect
      }
    } catch (err: unknown) {
      if (__DEV__) console.error('Google login error:', err);

      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // User cancelled — not an error
            break;
          case statusCodes.IN_PROGRESS:
            setError('Đang đăng nhập, vui lòng chờ...');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setError('Google Play Services không khả dụng. Vui lòng cập nhật.');
            break;
          default:
            setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
        }
      } else {
        const message = err instanceof Error ? err.message : '';
        if (message.includes('network')) {
          setError('Lỗi mạng. Vui lòng kiểm tra kết nối internet.');
        } else {
          setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
        }
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
          <FinGenieLogo size="sm" showTagline />
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
