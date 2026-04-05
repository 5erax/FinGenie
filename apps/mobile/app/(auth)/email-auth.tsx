import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useRef, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { useThemeColors } from '../../src/hooks/use-theme-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';

type AuthMode = 'login' | 'register';

export default function EmailAuthScreen() {
  const colors = useThemeColors();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const isRegister = mode === 'register';

  const validateForm = useCallback((): string | null => {
    if (!email.trim()) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Email không hợp lệ';
    if (!password) return 'Vui lòng nhập mật khẩu';
    if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    if (isRegister && password !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
    return null;
  }, [email, password, confirmPassword, isRegister]);

  const handleSubmit = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        // Register new account
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);

        // Send verification email
        await sendEmailVerification(result.user);
        setVerificationSent(true);
        // onAuthStateChanged fires → loginToBackend → pendingEmailVerification = true
        // Root layout will redirect to /(auth)/verify-email
      } else {
        // Login existing account
        await signInWithEmailAndPassword(auth, email.trim(), password);
        // onAuthStateChanged fires → loginToBackend
        // If email not verified → pendingEmailVerification = true → redirect to verify-email
        // If email verified → isAuthenticated = true → redirect to tabs
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (__DEV__) console.error(`Email ${mode} error:`, err);

      // Firebase error code extraction
      if (message.includes('auth/email-already-in-use')) {
        setError('Email này đã được đăng ký. Vui lòng đăng nhập.');
      } else if (message.includes('auth/invalid-email')) {
        setError('Email không hợp lệ.');
      } else if (message.includes('auth/weak-password')) {
        setError('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
      } else if (message.includes('auth/user-not-found') || message.includes('auth/invalid-credential')) {
        setError('Email hoặc mật khẩu không chính xác.');
      } else if (message.includes('auth/wrong-password')) {
        setError('Mật khẩu không chính xác.');
      } else if (message.includes('auth/too-many-requests')) {
        setError('Quá nhiều lần thử. Vui lòng thử lại sau vài phút.');
      } else if (message.includes('auth/network-request-failed')) {
        setError('Lỗi mạng. Vui lòng kiểm tra kết nối internet.');
      } else {
        setError(isRegister ? 'Đăng ký thất bại. Vui lòng thử lại.' : 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, mode, isRegister, validateForm]);

  const switchMode = useCallback(() => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
    setVerificationSent(false);
    setConfirmPassword('');
  }, []);

  const handleResendVerification = useCallback(async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setError(null);
    } catch {
      setError('Không thể gửi lại email xác thực. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleForgotPassword = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Vui lòng nhập email để đặt lại mật khẩu');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Email không hợp lệ');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setResetSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('auth/user-not-found')) {
        setError('Không tìm thấy tài khoản với email này.');
      } else if (message.includes('auth/too-many-requests')) {
        setError('Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.');
      } else {
        setError('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [email]);

  // Password reset sent screen
  if (resetSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={32} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Đặt lại mật khẩu</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Chúng tôi đã gửi email hướng dẫn đặt lại mật khẩu đến{'\n'}
            <Text style={{ color: colors.textPrimary, fontWeight: FONT_WEIGHT.semibold }}>
              {email}
            </Text>
            {'\n\n'}
            Vui lòng kiểm tra hộp thư (cả mục spam) và làm theo hướng dẫn.
          </Text>

          <PrimaryButton
            title="Quay lại đăng nhập"
            onPress={() => {
              setResetSent(false);
              setMode('login');
              setPassword('');
              setError(null);
            }}
            icon="log-in-outline"
            style={{ marginTop: SPACING.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Verification sent screen
  if (verificationSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={32} color={colors.success} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Xác thực email</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Chúng tôi đã gửi email xác thực đến{'\n'}
            <Text style={{ color: colors.textPrimary, fontWeight: FONT_WEIGHT.semibold }}>
              {email}
            </Text>
            {'\n\n'}
            Vui lòng kiểm tra hộp thư (cả mục spam) và nhấn vào liên kết xác thực.
            {'\n\n'}
            Sau khi xác thực, bạn có thể đăng nhập bình thường.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <PrimaryButton
            title="Gửi lại email xác thực"
            onPress={handleResendVerification}
            loading={loading}
            variant="outline"
            icon="refresh-outline"
            style={{ marginTop: SPACING.xl }}
          />

          <PrimaryButton
            title="Quay lại đăng nhập"
            onPress={() => {
              setVerificationSent(false);
              setMode('login');
              setPassword('');
            }}
            icon="log-in-outline"
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Icon + Title */}
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {isRegister
                ? 'Đăng ký bằng email để bắt đầu quản lý tài chính'
                : 'Đăng nhập bằng email và mật khẩu'}
            </Text>

            {/* Error */}
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Email</Text>
              <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (error) setError(null);
                  }}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.textDark}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Mật khẩu</Text>
              <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (error) setError(null);
                  }}
                  placeholder={isRegister ? 'Ít nhất 6 ký tự' : 'Nhập mật khẩu'}
                  placeholderTextColor={colors.textDark}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  returnKeyType={isRegister ? 'next' : 'done'}
                  onSubmitEditing={() => {
                    if (isRegister) {
                      confirmRef.current?.focus();
                    } else {
                      handleSubmit();
                    }
                  }}
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm Password (Register only) */}
            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Xác nhận mật khẩu</Text>
                <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    ref={confirmRef}
                    style={[styles.input, { color: colors.textPrimary }]}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (error) setError(null);
                    }}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor={colors.textDark}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <PrimaryButton
              title={isRegister ? 'Đăng ký' : 'Đăng nhập'}
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              icon={isRegister ? 'person-add-outline' : 'log-in-outline'}
              style={{ marginTop: SPACING.lg }}
            />

            {/* Forgot Password (login only) */}
            {!isRegister && (
              <Pressable style={styles.forgotBtn} onPress={handleForgotPassword}>
                <Text style={[styles.forgotText, { color: colors.accent }]}>Quên mật khẩu?</Text>
              </Pressable>
            )}

            {/* Switch mode */}
            <Pressable style={styles.switchBtn} onPress={switchMode}>
              <Text style={[styles.switchText, { color: colors.textMuted }]}>
                {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
                <Text style={[styles.switchLink, { color: colors.accent }]}>
                  {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
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
  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.base,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
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
    marginBottom: SPACING.xl,
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
    marginBottom: SPACING.base,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.caption,
  },
  inputGroup: {
    marginBottom: SPACING.base,
  },
  inputLabel: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.body,
    padding: 0,
  },
  switchBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  switchText: {
    fontSize: FONT_SIZE.body2,
  },
  switchLink: {
    fontWeight: FONT_WEIGHT.semibold,
  },
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  forgotText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.medium,
  },
});
