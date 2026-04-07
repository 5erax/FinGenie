import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../../src/constants/config';
import { useThemeColors } from '../../src/hooks/use-theme-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../src/constants/theme';
import { FinGenieLogo } from '../../src/components/FinGenieLogo';

// Dismiss any lingering browser auth sessions
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const colors = useThemeColors();

  // Google OAuth via expo-auth-session (handles redirect URIs correctly per platform)
  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useIdTokenAuthRequest({
      clientId: GOOGLE_WEB_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    });

  // Log redirect URI in dev so user can register it in Google Cloud Console
  useEffect(() => {
    if (__DEV__ && googleRequest?.redirectUri) {
      console.log(
        '[Google Auth] Redirect URI to register in Google Cloud Console:',
        googleRequest.redirectUri,
      );
    }
  }, [googleRequest?.redirectUri]);

  // Handle Google OAuth response from native flow
  useEffect(() => {
    if (!googleResponse) return;

    if (googleResponse.type === 'success') {
      const idToken = googleResponse.params.id_token;
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        signInWithCredential(auth, credential).catch((err: unknown) => {
          if (__DEV__) console.error('Google credential error:', err);
          setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
          setLoading(null);
        });
        // onAuthStateChanged in initialize() handles loginToBackend + redirect
      } else {
        setError('Không nhận được token từ Google. Vui lòng thử lại.');
        setLoading(null);
      }
    } else if (googleResponse.type === 'error') {
      if (__DEV__) console.error('Google auth error:', googleResponse.error);
      const msg = googleResponse.error?.message ?? '';
      if (msg.includes('redirect_uri_mismatch')) {
        setError(
          'Redirect URI chưa được đăng ký trong Google Cloud Console. ' +
            'Xem console log để biết URI cần thêm.',
        );
      } else {
        setError(msg || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
      setLoading(null);
    } else {
      // dismiss / cancel
      setLoading(null);
    }
  }, [googleResponse]);

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
        // Native: use expo-auth-session Google provider
        if (!GOOGLE_WEB_CLIENT_ID) {
          setError('Google Sign-In chưa được cấu hình. Thiếu EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
          setLoading(null);
          return;
        }
        // promptGoogleAsync triggers the OAuth flow; response is handled in useEffect above
        await promptGoogleAsync();
      }
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
