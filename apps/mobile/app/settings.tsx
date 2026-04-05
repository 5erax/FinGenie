import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuthStore } from "../src/stores/auth-store";
import {
  usePreferencesStore,
  type ThemeMode,
  type AppLanguage,
} from "../src/stores/preferences-store";
import { useThemeColors } from "../src/hooks/use-theme-colors";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  HIT_SLOP,
} from "../src/constants/theme";

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const colors = useThemeColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
      {title}
    </Text>
  );
}

// ─── Toggle Row ──────────────────────────────────────────────────────────────

function ToggleRow({
  icon,
  label,
  value,
  onToggle,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  subtitle?: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.row}>
      <View style={[styles.rowIconWrap, { backgroundColor: colors.accentDim }]}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
}

// ─── Select Row ──────────────────────────────────────────────────────────────

function SelectRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.rowIconWrap, { backgroundColor: colors.accentDim }]}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.inactive} />
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user, updateProfile } = useAuthStore();
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    notifications,
    setNotification,
  } = usePreferencesStore();

  // Edit name
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);

  // Avatar
  const [savingAvatar] = useState(false);

  function getInitials(name?: string | null): string {
    if (!name) return "?";
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("");
  }

  async function handleSaveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === user?.displayName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await updateProfile({ displayName: trimmed });
      setEditingName(false);
    } catch {
      if (Platform.OS === "web") {
        window.alert("Không thể cập nhật tên. Vui lòng thử lại.");
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật tên. Vui lòng thử lại.");
      }
    } finally {
      setSavingName(false);
    }
  }

  async function handlePickAvatar() {
    // expo-image-picker is not installed — show guidance
    if (Platform.OS === "web") {
      window.alert("Tính năng đổi ảnh đại diện sẽ sớm được hỗ trợ.");
    } else {
      Alert.alert(
        "Đổi ảnh đại diện",
        "Tính năng này sẽ sớm được hỗ trợ trong bản cập nhật tiếp theo.",
      );
    }
  }

  function handleThemeSelect() {
    const options: { label: string; value: ThemeMode }[] = [
      { label: "Tối (Dark)", value: "dark" },
      { label: "Sáng (Light)", value: "light" },
      { label: "Theo hệ thống", value: "system" },
    ];

    if (Platform.OS === "web") {
      // Simple cycling on web
      const current = options.findIndex((o) => o.value === theme);
      const next = options[(current + 1) % options.length];
      if (next) {
        setTheme(next.value);
      }
    } else {
      Alert.alert(
        "Giao diện",
        "Chọn chế độ giao diện",
        options.map((opt) => ({
          text: opt.label + (opt.value === theme ? " ✓" : ""),
          onPress: () => setTheme(opt.value),
        })),
      );
    }
  }

  function handleLanguageSelect() {
    const options: { label: string; value: AppLanguage }[] = [
      { label: "Tiếng Việt", value: "vi" },
      { label: "English", value: "en" },
    ];

    if (Platform.OS === "web") {
      const current = options.findIndex((o) => o.value === language);
      const next = options[(current + 1) % options.length];
      if (next) {
        setLanguage(next.value);
      }
    } else {
      Alert.alert(
        "Ngôn ngữ",
        "Chọn ngôn ngữ hiển thị",
        options.map((opt) => ({
          text: opt.label + (opt.value === language ? " ✓" : ""),
          onPress: () => setLanguage(opt.value),
        })),
      );
    }
  }

  const themeLabel =
    theme === "dark" ? "Tối" : theme === "light" ? "Sáng" : "Hệ thống";
  const languageLabel = language === "vi" ? "Tiếng Việt" : "English";

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
          Cài đặt
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Section ──────────────────────────────────────────── */}
        <SectionHeader title="HỒ SƠ" />
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Avatar */}
          <Pressable style={styles.avatarRow} onPress={handlePickAvatar}>
            <View style={styles.avatarContainer}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.avatarInitials, { color: colors.accent }]}
                  >
                    {getInitials(user?.displayName)}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.avatarBadge,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.surface,
                  },
                ]}
              >
                {savingAvatar ? (
                  <ActivityIndicator size={10} color={colors.textPrimary} />
                ) : (
                  <Ionicons
                    name="camera"
                    size={10}
                    color={colors.textPrimary}
                  />
                )}
              </View>
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                Ảnh đại diện
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Nhấn để thay đổi
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.inactive}
            />
          </Pressable>

          {/* Display Name */}
          <View style={[styles.row, styles.rowLast]}>
            <View
              style={[
                styles.rowIconWrap,
                { backgroundColor: colors.accentDim },
              ]}
            >
              <Ionicons name="person-outline" size={18} color={colors.accent} />
            </View>
            {editingName ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={[
                    styles.editNameInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  value={nameValue}
                  onChangeText={setNameValue}
                  placeholder="Tên hiển thị"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  maxLength={50}
                  onSubmitEditing={handleSaveName}
                />
                <Pressable
                  style={styles.editNameBtn}
                  onPress={handleSaveName}
                  disabled={savingName}
                >
                  {savingName ? (
                    <ActivityIndicator size={14} color={colors.accent} />
                  ) : (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.accent}
                    />
                  )}
                </Pressable>
                <Pressable
                  style={styles.editNameBtn}
                  onPress={() => {
                    setEditingName(false);
                    setNameValue(user?.displayName ?? "");
                  }}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.rowContent}>
                  <Text
                    style={[styles.rowLabel, { color: colors.textPrimary }]}
                  >
                    Tên hiển thị
                  </Text>
                  <Text
                    style={[styles.rowSubtitle, { color: colors.textMuted }]}
                  >
                    {user?.displayName ?? "Chưa đặt tên"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setNameValue(user?.displayName ?? "");
                    setEditingName(true);
                  }}
                  hitSlop={HIT_SLOP.sm}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={colors.accent}
                  />
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* ── Appearance Section ───────────────────────────────────────── */}
        <SectionHeader title="GIAO DIỆN" />
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <SelectRow
            icon="moon-outline"
            label="Chế độ giao diện"
            value={themeLabel}
            onPress={handleThemeSelect}
          />
          <View
            style={[styles.rowDivider, { backgroundColor: colors.borderLight }]}
          />
          <SelectRow
            icon="language-outline"
            label="Ngôn ngữ"
            value={languageLabel}
            onPress={handleLanguageSelect}
          />
        </View>

        {language === "en" && (
          <Text style={[styles.hintText, { color: colors.textDark }]}>
            * Bản dịch tiếng Anh sẽ được hỗ trợ trong bản cập nhật tiếp theo.
          </Text>
        )}

        {/* ── Notification Section ────────────────────────────────────── */}
        <SectionHeader title="THÔNG BÁO" />
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ToggleRow
            icon="card-outline"
            label="Giao dịch"
            subtitle="Thông báo khi có giao dịch mới"
            value={notifications.transactions}
            onToggle={(v) => setNotification("transactions", v)}
          />
          <View
            style={[styles.rowDivider, { backgroundColor: colors.borderLight }]}
          />
          <ToggleRow
            icon="warning-outline"
            label="Cảnh báo ngân sách"
            subtitle="Thông báo khi sắp vượt ngân sách"
            value={notifications.budgetAlerts}
            onToggle={(v) => setNotification("budgetAlerts", v)}
          />
          <View
            style={[styles.rowDivider, { backgroundColor: colors.borderLight }]}
          />
          <ToggleRow
            icon="sparkles-outline"
            label="Gợi ý AI"
            subtitle="Mẹo tiết kiệm từ AI Coach"
            value={notifications.aiTips}
            onToggle={(v) => setNotification("aiTips", v)}
          />
          <View
            style={[styles.rowDivider, { backgroundColor: colors.borderLight }]}
          />
          <ToggleRow
            icon="megaphone-outline"
            label="Khuyến mãi"
            subtitle="Ưu đãi và tin tức từ FinGenie"
            value={notifications.promotions}
            onToggle={(v) => setNotification("promotions", v)}
          />
        </View>

        {/* ── Info Section ────────────────────────────────────────────── */}
        <SectionHeader title="THÔNG TIN" />
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.row}>
            <View
              style={[
                styles.rowIconWrap,
                { backgroundColor: colors.accentDim },
              ]}
            >
              <Ionicons name="mail-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                Email
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                {user?.email ?? "Chưa liên kết"}
              </Text>
            </View>
          </View>
          <View
            style={[styles.rowDivider, { backgroundColor: colors.borderLight }]}
          />
          <View style={[styles.row, styles.rowLast]}>
            <View
              style={[
                styles.rowIconWrap,
                { backgroundColor: colors.accentDim },
              ]}
            >
              <Ionicons name="call-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                Số điện thoại
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                {user?.phone ?? "Chưa liên kết"}
              </Text>
            </View>
          </View>
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
    // backgroundColor provided via inline style (colors.background)
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
    // backgroundColor and borderColor provided via inline style
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    // color provided via inline style
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Section
  sectionHeader: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    // color provided via inline style
    letterSpacing: 1,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  section: {
    // backgroundColor and borderColor provided via inline style
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: "hidden",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: SPACING.base,
  },
  rowLast: {
    // no special styling needed
  },
  rowDivider: {
    height: 1,
    // backgroundColor provided via inline style
    marginLeft: SPACING.huge,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    // backgroundColor provided via inline style
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FONT_SIZE.body,
    // color provided via inline style
    fontWeight: FONT_WEIGHT.medium,
  },
  rowSubtitle: {
    fontSize: FONT_SIZE.sm,
    // color provided via inline style
    marginTop: SPACING.xxs,
  },
  rowValue: {
    fontSize: FONT_SIZE.body2,
    // color provided via inline style
    marginRight: SPACING.sm,
  },

  // Avatar row
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: SPACING.base,
  },
  avatarContainer: {
    position: "relative",
    marginRight: SPACING.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 16,
    // backgroundColor provided via inline style
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    // color provided via inline style
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    // backgroundColor and borderColor provided via inline style
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },

  // Edit name inline
  editNameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  editNameInput: {
    flex: 1,
    // backgroundColor, color, borderColor provided via inline style
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.body,
    borderWidth: 1,
  },
  editNameBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },

  // Hint text
  hintText: {
    fontSize: FONT_SIZE.sm,
    // color provided via inline style
    fontStyle: "italic",
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
});
