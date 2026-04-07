import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, AppState, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth-store';
import { useThemeColors } from '../../src/hooks/use-theme-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';

export default function VerifyEmailScreen() {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const checkEmailVerification = useAuthStore((s) => s.checkEmailVerification);
  const resendVerificationEmail = useAuthStore((s) => s.resendVerificationEmail);
  const sendVerificationOtp = useAuthStore((s) => s.sendVerificationOtp);
  const verifyEmailOtp = useAuthStore((s) => s.verifyEmailOtp);
  const logout = useAuthStore((s) => s.logout);

  const [otpCode, setOtpCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpInputRef = useRef<TextInput>(null);

  const isLoading = checking || verifyingOtp || sendingOtp || resending;

  // Poll every 5 seconds to check if user verified email via link
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        await checkEmailVerification();
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkEmailVerification]);

  // Also check when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        try {
          await checkEmailVerification();
        } catch {
          // Silently ignore
        }
      }
    });

    return () => subscription.remove();
  }, [checkEmailVerification]);

  // Send OTP when screen mounts (auto-send)
  useEffect(() => {
    const sendInitialOtp = async () => {
      try {
        setSendingOtp(true);
        await sendVerificationOtp();
        setOtpSent(true);
        setSuccessMsg('Đã gửi mã OTP đến email của bạn!');
      } catch (err: unknown) {
        // Extract the most useful error message from the response
        const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
        const serverMsg = axiosErr?.response?.data?.message;
        const clientMsg = err instanceof Error ? err.message : '';

        if (serverMsg) {
          // Backend returned a specific error (e.g. SMTP not configured)
          setError(`Lỗi server: ${serverMsg}`);
        } else if (clientMsg.includes('Không thể kết nối') || clientMsg.includes('Network')) {
          setError('Không thể kết nối tới server. Kiểm tra kết nối mạng.');
        } else {
          setError(`Không thể gửi mã OTP tự động. Nhấn "Gửi mã OTP" để thử lại.\n${clientMsg || ''}`);
        }
        if (__DEV__) console.warn('Auto-send OTP failed:', err);
      } finally {
        setSendingOtp(false);
      }
    };

    sendInitialOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số');
      return;
    }

    setVerifyingOtp(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const verified = await verifyEmailOtp(otpCode);
      if (!verified) {
        setError('Mã OTP không hợp lệ hoặc đã hết hạn.');
      }
      // If verified, auth guard will redirect to tabs automatically
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('400') || message.includes('Bad Request')) {
        setError('Mã OTP không hợp lệ hoặc đã hết hạn.');
      } else {
        setError('Không thể xác thực. Vui lòng thử lại.');
      }
    } finally {
      setVerifyingOtp(false);
    }
  }, [otpCode, verifyEmailOtp]);

  const handleSendOtp = useCallback(async () => {
    setSendingOtp(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await sendVerificationOtp();
      setOtpSent(true);
      setOtpCode('');
      setSuccessMsg('Đã gửi mã OTP mới đến email của bạn!');
      otpInputRef.current?.focus();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number }; message?: string };
      const serverMsg = axiosErr?.response?.data?.message;
      const status = axiosErr?.response?.status;

      if (status === 429 || serverMsg?.includes('Quá nhiều')) {
        setError('Quá nhiều yêu cầu. Vui lòng đợi vài phút.');
      } else if (serverMsg) {
        setError(`Lỗi: ${serverMsg}`);
      } else {
        const message = err instanceof Error ? err.message : '';
        setError(`Không thể gửi mã OTP. ${message}`);
      }
    } finally {
      setSendingOtp(false);
    }
  }, [sendVerificationOtp]);

  const handleCheckLink = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const verified = await checkEmailVerification();
      if (!verified) {
        setError('Email chưa được xác thực qua link.');
      }
    } catch {
      setError('Không thể kiểm tra. Vui lòng thử lại.');
    } finally {
      setChecking(false);
    }
  }, [checkEmailVerification]);

  const handleResendLink = useCallback(async () => {
    setResending(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await resendVerificationEmail();
      setSuccessMsg('Đã gửi lại link xác thực qua email!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('auth/too-many-requests')) {
        setError('Quá nhiều yêu cầu. Vui lòng đợi vài phút.');
      } else {
        setError('Không thể gửi lại email. Vui lòng thử lại.');
      }
    } finally {
      setResending(false);
    }
  }, [resendVerificationEmail]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}15` }]}>
          <Ionicons name="mail-unread-outline" size={48} color={colors.accent} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Xác thực email
        </Text>

        {/* Email */}
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Chúng tôi đã gửi mã xác thực đến
        </Text>
        <Text style={[styles.email, { color: colors.textPrimary }]}>
          {user?.email ?? ''}
        </Text>

        {/* OTP Input Section */}
        <View style={styles.otpSection}>
          <Text style={[styles.otpLabel, { color: colors.textMuted }]}>
            Nhập mã OTP (6 chữ số)
          </Text>
          <TextInput
            ref={otpInputRef}
            style={[
              styles.otpInput,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surface,
                borderColor: error ? colors.danger : colors.border,
              },
            ]}
            value={otpCode}
            onChangeText={(text) => {
              setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 6));
              if (error) setError(null);
            }}
            placeholder="000000"
            placeholderTextColor={colors.textDark}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            onSubmitEditing={handleVerifyOtp}
          />
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* Success message */}
        {successMsg && !error && (
          <View style={[styles.successBox, { borderColor: `${colors.success}30` }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.successText, { color: colors.success }]}>{successMsg}</Text>
          </View>
        )}

        {/* Primary action: Verify OTP */}
        <View style={styles.actions}>
          <PrimaryButton
            title="Xác thực"
            onPress={handleVerifyOtp}
            loading={verifyingOtp}
            disabled={isLoading || otpCode.length !== 6}
            icon="checkmark-circle-outline"
          />

          <PrimaryButton
            title={otpSent ? 'Gửi lại mã OTP' : 'Gửi mã OTP'}
            onPress={handleSendOtp}
            loading={sendingOtp}
            disabled={isLoading}
            variant="outline"
            icon="refresh-outline"
            style={{ marginTop: SPACING.md }}
          />
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textDark }]}>hoặc</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Alternative: Link verification */}
        <View style={styles.altActions}>
          <PrimaryButton
            title="Tôi đã nhấn link trong email"
            onPress={handleCheckLink}
            loading={checking}
            disabled={isLoading}
            variant="outline"
            icon="link-outline"
            size="md"
          />

          <PrimaryButton
            title="Gửi lại link xác thực"
            onPress={handleResendLink}
            loading={resending}
            disabled={isLoading}
            variant="outline"
            icon="mail-outline"
            size="md"
            style={{ marginTop: SPACING.sm }}
          />

          <PrimaryButton
            title="Đăng xuất"
            onPress={logout}
            variant="outline"
            icon="log-out-outline"
            size="md"
            style={{ marginTop: SPACING.sm }}
          />
        </View>

        {/* Auto-check hint */}
        <Text style={[styles.hint, { color: colors.textDark }]}>
          Tự động kiểm tra link mỗi 5 giây...
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
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.h2,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZE.body,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  otpSection: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  otpLabel: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  otpInput: {
    fontSize: FONT_SIZE.h2,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    letterSpacing: 12,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
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
    marginTop: SPACING.sm,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.caption,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    marginTop: SPACING.sm,
    width: '100%',
  },
  successText: {
    flex: 1,
    fontSize: FONT_SIZE.caption,
  },
  actions: {
    width: '100%',
    marginTop: SPACING.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: FONT_SIZE.caption,
    marginHorizontal: SPACING.md,
  },
  altActions: {
    width: '100%',
  },
  hint: {
    fontSize: FONT_SIZE.xxs,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
});
