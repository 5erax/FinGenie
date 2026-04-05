import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { useThemeColors } from '../../src/hooks/use-theme-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';

const DEV_OTP = __DEV__ ? '123456' : null;
const RESEND_COOLDOWN_SECONDS = 60;

export default function PhoneOTPScreen() {
  const colors = useThemeColors();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+84');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const sendOTP = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (Platform.OS === 'web') {
        // Web (dev + prod): RecaptchaVerifier works in the browser DOM
        const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
        const result = await signInWithPhoneNumber(auth, phone, appVerifier);
        setConfirmationResult(result);
        setStep('otp');
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        // Native (iOS/Android): Firebase JS SDK phone auth requires RecaptchaVerifier
        // which needs a DOM. On native, try signInWithPhoneNumber without it.
        try {
          const result = await signInWithPhoneNumber(auth, phone);
          setConfirmationResult(result);
          setStep('otp');
          setResendCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (nativeErr: unknown) {
          console.error('Native phone auth error:', nativeErr);
          if (__DEV__) {
            // Dev fallback: allow testing OTP flow with code 123456
            setStep('otp');
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
          } else {
            setError(
              'Xác thực số điện thoại trên ứng dụng native cần cấu hình thêm. ' +
              'Vui lòng sử dụng phiên bản web hoặc đăng nhập bằng Google.'
            );
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể gửi mã OTP';
      console.error('Send OTP error:', err);
      if (message.includes('too-many-requests')) {
        setError('Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.');
      } else if (message.includes('invalid-phone-number')) {
        setError('Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const handleSendOTP = () => {
    if (phone.length < 10) {
      setError('Vui lòng nhập số điện thoại hợp lệ');
      return;
    }
    sendOTP();
  };

  const handleResendOTP = () => {
    if (resendCooldown > 0) return;
    setOtp(['', '', '', '', '', '']);
    setError(null);
    sendOTP();
  };

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every((d) => d !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOTPKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      if (confirmationResult) {
        // Real Firebase phone auth verification
        await confirmationResult.confirm(code);
        // onAuthStateChanged in initialize() handles loginToBackend + redirect
      } else if (__DEV__ && DEV_OTP && code === DEV_OTP) {
        // Dev fallback when real OTP wasn't available (e.g. native without config)
        // Use anonymous auth so the app flow can be tested
        const { signInAnonymously } = await import('firebase/auth');
        await signInAnonymously(auth);
        // onAuthStateChanged handles the rest
      } else if (!confirmationResult && __DEV__) {
        setError('Mã OTP không chính xác. Nhập 123456 để đăng nhập thử (chế độ dev).');
      } else {
        setError('Không thể xác thực. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Xác thực thất bại';
      console.error('OTP verify error:', err);
      if (message.includes('invalid-verification-code')) {
        setError('Mã OTP không chính xác. Vui lòng thử lại.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

        <View style={styles.content}>
          {step === 'phone' ? (
            <>
              {/* Phone Input Step */}
              <View style={styles.iconContainer}>
                <Ionicons name="phone-portrait-outline" size={32} color={colors.accent} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Nhập số điện thoại</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Chúng tôi sẽ gửi mã xác thực OTP đến số điện thoại của bạn
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              )}

              <View style={styles.phoneInputContainer}>
                <View
                  style={[
                    styles.countryCode,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.countryCodeText, { color: colors.textSecondary }]}>
                    🇻🇳 +84
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.phoneInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="912 345 678"
                  placeholderTextColor={colors.textDark}
                  keyboardType="phone-pad"
                  value={phone.replace('+84', '')}
                  onChangeText={(text) => setPhone(`+84${text.replace(/\D/g, '')}`)}
                  maxLength={12}
                  autoFocus
                />
              </View>

              <PrimaryButton
                title="Gửi mã OTP"
                onPress={handleSendOTP}
                loading={loading}
                disabled={loading || phone.length < 10}
              />

              <Text style={[styles.devHint, { color: colors.textDark }]}>
                {__DEV__ ? 'Chế độ phát triển: OTP thực sẽ được gửi qua Firebase. Nếu thất bại trên native, nhập 123456.' : ''}
              </Text>
            </>
          ) : (
            <>
              {/* OTP Verification Step */}
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark-outline" size={32} color={colors.accent} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Nhập mã xác thực</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Mã OTP đã được gửi đến{'\n'}
                <Text style={{ color: colors.textPrimary, fontWeight: FONT_WEIGHT.semibold }}>{phone}</Text>
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              )}

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { otpRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                      digit && {
                        borderColor: colors.accent,
                        backgroundColor: 'rgba(167, 139, 250, 0.08)',
                      },
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOTPChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleOTPKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    autoFocus={index === 0}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <Pressable
                style={styles.resendBtn}
                onPress={handleResendOTP}
                disabled={resendCooldown > 0}
              >
                <Text
                  style={[
                    styles.resendText,
                    { color: colors.accent },
                    resendCooldown > 0 && { color: colors.textDark },
                  ]}
                >
                  {resendCooldown > 0
                    ? `Gửi lại mã sau ${resendCooldown}s`
                    : 'Gửi lại mã OTP'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.backBtn2}
                onPress={() => {
                  setOtp(['', '', '', '', '', '']);
                  setError(null);
                  setStep('phone');
                }}
              >
                <Text style={[styles.backBtnText, { color: colors.textMuted }]}>
                  ← Quay lại nhập số điện thoại
                </Text>
              </Pressable>

              {loading && (
                <ActivityIndicator
                  size="small"
                  color={colors.accent}
                  style={{ marginTop: SPACING.base }}
                />
              )}
            </>
          )}
        </View>

        {/* Invisible recaptcha container for web phone auth */}
        {Platform.OS === 'web' && (
          <View nativeID="recaptcha-container" style={styles.recaptchaHidden} />
        )}
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl,
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
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.xl,
  },
  countryCode: {
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
  },
  countryCodeText: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.medium,
  },
  phoneInput: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 1,
    borderWidth: 1,
  },
  devHint: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginTop: SPACING.base,
    fontStyle: 'italic',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: SPACING.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  resendText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.medium,
  },
  backBtn2: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  backBtnText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.medium,
  },
  recaptchaHidden: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});
