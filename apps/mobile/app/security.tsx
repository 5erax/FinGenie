import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import { useAuthStore } from "../src/stores/auth-store";
import { auth } from "../src/lib/firebase";
import { api } from "../src/lib/api";
import { queryClient } from "../src/lib/query-client";
import { useThemeColors } from "../src/hooks/use-theme-colors";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  HIT_SLOP,
} from "../src/constants/theme";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAuthProvider(
  firebaseUser: { providerData?: Array<{ providerId: string }> } | null,
): string {
  if (!firebaseUser?.providerData?.length) return "anonymous";
  const provider = firebaseUser.providerData[0]?.providerId;
  switch (provider) {
    case "google.com":
      return "google";
    case "phone":
      return "phone";
    case "password":
      return "email";
    default:
      return provider ?? "unknown";
  }
}

function getAuthProviderLabel(provider: string): string {
  switch (provider) {
    case "google":
      return "Google";
    case "phone":
      return "Số điện thoại";
    case "email":
      return "Email / Mật khẩu";
    case "anonymous":
      return "Ẩn danh (Dev)";
    default:
      return provider;
  }
}

function getAuthProviderIcon(provider: string): keyof typeof Ionicons.glyphMap {
  switch (provider) {
    case "google":
      return "logo-google";
    case "phone":
      return "phone-portrait-outline";
    case "email":
      return "mail-outline";
    default:
      return "person-outline";
  }
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SecurityScreen() {
  const router = useRouter();
  const { user, firebaseUser, logout } = useAuthStore();
  const colors = useThemeColors();

  const authProvider = getAuthProvider(firebaseUser);
  const isEmailAuth = authProvider === "email";

  // Change password state (only for email auth)
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete account state
  const [deleting, setDeleting] = useState(false);

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      setPasswordError("Không thể xác thực tài khoản hiện tại");
      return;
    }

    setChangingPassword(true);
    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);

      if (Platform.OS === "web") {
        window.alert("Đổi mật khẩu thành công!");
      } else {
        Alert.alert("Thành công", "Mật khẩu đã được thay đổi.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      if (
        message.includes("wrong-password") ||
        message.includes("invalid-credential")
      ) {
        setPasswordError("Mật khẩu hiện tại không chính xác");
      } else if (message.includes("requires-recent-login")) {
        setPasswordError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else {
        setPasswordError(`Đổi mật khẩu thất bại: ${message}`);
      }
    } finally {
      setChangingPassword(false);
    }
  }

  function handleDeleteAccount() {
    const doDelete = async () => {
      setDeleting(true);
      try {
        // Call API to delete user data
        await api.delete("/users/me");

        // Clear local state
        queryClient.clear();
        await logout();
        // Auth guard will redirect to login
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Lỗi không xác định";
        if (Platform.OS === "web") {
          window.alert(`Xoá tài khoản thất bại: ${message}`);
        } else {
          Alert.alert("Lỗi", `Xoá tài khoản thất bại. Vui lòng thử lại.`);
        }
        setDeleting(false);
      }
    };

    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Bạn có chắc muốn xoá tài khoản? Hành động này không thể hoàn tác. Tất cả dữ liệu sẽ bị xoá vĩnh viễn.",
        )
      ) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Xoá tài khoản",
        "Bạn có chắc muốn xoá tài khoản?\n\nHành động này không thể hoàn tác. Tất cả dữ liệu sẽ bị xoá vĩnh viễn.",
        [
          { text: "Huỷ", style: "cancel" },
          {
            text: "Xoá tài khoản",
            style: "destructive",
            onPress: doDelete,
          },
        ],
      );
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[
            styles.backBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.back()}
          hitSlop={HIT_SLOP.md}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Bảo mật
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Auth Method Section ──────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          PHƯƠNG THỨC ĐĂNG NHẬP
        </Text>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.authMethodCard}>
            <View
              style={[
                styles.authIcon,
                { backgroundColor: `${colors.accent}18` },
              ]}
            >
              <Ionicons
                name={getAuthProviderIcon(authProvider)}
                size={22}
                color={colors.accent}
              />
            </View>
            <View style={styles.authInfo}>
              <Text
                style={[styles.authProviderName, { color: colors.textPrimary }]}
              >
                {getAuthProviderLabel(authProvider)}
              </Text>
              <Text style={[styles.authDetail, { color: colors.textMuted }]}>
                {user?.email ?? user?.phone ?? "Tài khoản ẩn danh"}
              </Text>
            </View>
            <View style={styles.authBadge}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />
              <Text style={[styles.authBadgeText, { color: colors.success }]}>
                Đã kết nối
              </Text>
            </View>
          </View>
        </View>

        {/* ── Change Password Section ─────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          MẬT KHẨU
        </Text>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {isEmailAuth ? (
            <>
              {!showPasswordForm ? (
                <Pressable
                  style={styles.actionRow}
                  onPress={() => setShowPasswordForm(true)}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: colors.accentDim },
                    ]}
                  >
                    <Ionicons
                      name="key-outline"
                      size={18}
                      color={colors.accent}
                    />
                  </View>
                  <Text
                    style={[styles.actionLabel, { color: colors.textPrimary }]}
                  >
                    Đổi mật khẩu
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.inactive}
                  />
                </Pressable>
              ) : (
                <View style={styles.passwordForm}>
                  <Text
                    style={[
                      styles.passwordFormTitle,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Đổi mật khẩu
                  </Text>

                  {passwordError && (
                    <View style={styles.errorBox}>
                      <Ionicons
                        name="alert-circle"
                        size={14}
                        color={colors.danger}
                      />
                      <Text
                        style={[styles.errorText, { color: colors.danger }]}
                      >
                        {passwordError}
                      </Text>
                    </View>
                  )}

                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="Mật khẩu hiện tại"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="Xác nhận mật khẩu mới"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />

                  <View style={styles.passwordActions}>
                    <Pressable
                      style={[
                        styles.passwordBtn,
                        styles.passwordBtnCancel,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => {
                        setShowPasswordForm(false);
                        setPasswordError(null);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      <Text
                        style={[
                          styles.passwordBtnCancelText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Huỷ
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.passwordBtn,
                        styles.passwordBtnSave,
                        { backgroundColor: colors.accent },
                        changingPassword && styles.btnDisabled,
                      ]}
                      onPress={handleChangePassword}
                      disabled={changingPassword}
                    >
                      {changingPassword ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.textPrimary}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.passwordBtnSaveText,
                            { color: colors.textPrimary },
                          ]}
                        >
                          Đổi mật khẩu
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: colors.accentDim },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={colors.info}
                />
              </View>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Tài khoản đăng nhập qua {getAuthProviderLabel(authProvider)}{" "}
                không sử dụng mật khẩu.
                {authProvider === "google"
                  ? " Mật khẩu được quản lý bởi Google."
                  : authProvider === "phone"
                    ? " Xác thực bằng mã OTP."
                    : ""}
              </Text>
            </View>
          )}
        </View>

        {/* ── Active Sessions ──────────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          PHIÊN ĐĂNG NHẬP
        </Text>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sessionRow}>
            <View
              style={[
                styles.sessionIcon,
                { backgroundColor: `${colors.success}18` },
              ]}
            >
              <Ionicons
                name="phone-portrait"
                size={18}
                color={colors.success}
              />
            </View>
            <View style={styles.sessionInfo}>
              <Text
                style={[styles.sessionDevice, { color: colors.textPrimary }]}
              >
                Thiết bị hiện tại
              </Text>
              <Text style={[styles.sessionMeta, { color: colors.textMuted }]}>
                {Platform.OS === "web"
                  ? "Trình duyệt web"
                  : Platform.OS === "ios"
                    ? "iOS"
                    : "Android"}
                {" • Đang hoạt động"}
              </Text>
            </View>
            <View
              style={[
                styles.sessionActiveDot,
                { backgroundColor: colors.success },
              ]}
            />
          </View>
        </View>

        {/* ── Danger Zone ─────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: colors.danger }]}>
          VÙNG NGUY HIỂM
        </Text>
        <View
          style={[
            styles.section,
            styles.dangerSection,
            { backgroundColor: colors.surface },
          ]}
        >
          <Pressable
            style={styles.deleteRow}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: "rgba(248, 113, 113, 0.12)" },
              ]}
            >
              {deleting ? (
                <ActivityIndicator size={14} color={colors.danger} />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                />
              )}
            </View>
            <View style={styles.deleteContent}>
              <Text style={[styles.deleteLabel, { color: colors.danger }]}>
                Xoá tài khoản
              </Text>
              <Text style={[styles.deleteDesc, { color: colors.textMuted }]}>
                Xoá vĩnh viễn tài khoản và tất cả dữ liệu. Hành động này không
                thể hoàn tác.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.danger} />
          </Pressable>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Section
  sectionHeader: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 1,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  section: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  dangerSection: {
    borderColor: "rgba(248, 113, 113, 0.2)",
  },

  // Auth method card
  authMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.base,
  },
  authIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  authInfo: {
    flex: 1,
  },
  authProviderName: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.xxs,
  },
  authDetail: {
    fontSize: FONT_SIZE.sm,
  },
  authBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  authBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Action row
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.base,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  actionLabel: {
    flex: 1,
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Info row (non-email auth)
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: SPACING.base,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.body2,
    lineHeight: 20,
  },

  // Password form
  passwordForm: {
    padding: SPACING.base,
  },
  passwordFormTitle: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.md,
  },
  passwordInput: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.body,
    marginBottom: SPACING.md,
  },
  passwordActions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  passwordBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  passwordBtnCancel: {
    borderWidth: 1,
  },
  passwordBtnCancelText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },
  passwordBtnSave: {},
  passwordBtnSaveText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.2)",
    marginBottom: SPACING.md,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
  },

  // Sessions
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.base,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xxs,
  },
  sessionMeta: {
    fontSize: FONT_SIZE.sm,
  },
  sessionActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Delete
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.base,
  },
  deleteContent: {
    flex: 1,
  },
  deleteLabel: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.xxs,
  },
  deleteDesc: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
  },
});
