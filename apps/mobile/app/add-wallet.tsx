import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  useWallet,
  useCreateWallet,
  useUpdateWallet,
} from "../src/hooks/use-wallets";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
} from "../src/constants/theme";
import { useThemeColors } from "../src/hooks/use-theme-colors";
import { formatVND } from "../src/utils/format";

type WalletTypeValue = "cash" | "bank" | "e_wallet" | "other";
type CurrencyValue = "VND" | "USD";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface WalletTypeOption {
  value: WalletTypeValue;
  label: string;
  description: string;
  icon: IoniconsName;
  color: string;
}

export default function AddWalletScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  // Defined inside component so wallet-type accent colors come from dynamic theme
  const WALLET_TYPES: WalletTypeOption[] = [
    {
      value: "cash",
      label: "Tiền mặt",
      description: "Tiền trong ví vật lý",
      icon: "cash-outline",
      color: colors.success,
    },
    {
      value: "bank",
      label: "Ngân hàng",
      description: "Tài khoản ngân hàng",
      icon: "business-outline",
      color: colors.info,
    },
    {
      value: "e_wallet",
      label: "Ví điện tử",
      description: "MoMo, ZaloPay, v.v.",
      icon: "phone-portrait-outline",
      color: colors.warning,
    },
    {
      value: "other",
      label: "Khác",
      description: "Các loại tài sản khác",
      icon: "card-outline",
      color: colors.textSecondary,
    },
  ];

  const { data: existingWallet, isLoading: isLoadingWallet } = useWallet(
    id ?? "",
  );
  const { mutateAsync: createWallet, isPending: isCreating } =
    useCreateWallet();
  const { mutateAsync: updateWallet, isPending: isUpdating } =
    useUpdateWallet();

  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<WalletTypeValue>("cash");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState<CurrencyValue>("VND");

  const isSaving = isCreating || isUpdating;

  // Pre-fill when editing
  useEffect(() => {
    if (isEditMode && existingWallet) {
      setName(existingWallet.name);
      // Normalise e-wallet vs e_wallet from server
      const rawType = existingWallet.type as string;
      const normType: WalletTypeValue =
        rawType === "e-wallet" ? "e_wallet" : (rawType as WalletTypeValue);
      setSelectedType(normType);
      setCurrency(existingWallet.currency);
    }
  }, [isEditMode, existingWallet]);

  const parsedBalance = parseFloat(balance.replace(/[^0-9.]/g, "")) || 0;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên ví.");
      return;
    }

    if (parsedBalance < 0) {
      Alert.alert("Lỗi", "Số dư không được âm");
      return;
    }

    try {
      if (isEditMode && id) {
        await updateWallet({
          id,
          data: { name: name.trim(), type: selectedType },
        });
      } else {
        await createWallet({
          name: name.trim(),
          type: selectedType,
          balance: parsedBalance,
          currency,
        });
      }
      // Navigate back immediately on success
      router.back();
    } catch {
      Alert.alert("Lỗi", "Không thể lưu ví. Vui lòng thử lại.");
    }
  };

  // Loading skeleton while fetching wallet in edit mode
  if (isEditMode && isLoadingWallet) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScreenHeader title="Chỉnh sửa ví" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Đang tải thông tin ví...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <ScreenHeader title={isEditMode ? "Chỉnh sửa ví" : "Thêm ví mới"} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Tên ví ── */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Tên ví{" "}
              <Text style={[styles.required, { color: colors.danger }]}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="VD: Ví tiền mặt, Techcombank..."
              placeholderTextColor={colors.textMuted}
              maxLength={50}
              autoFocus={!isEditMode}
              returnKeyType="done"
            />
            <Text style={[styles.fieldHint, { color: colors.textDark }]}>
              {name.length}/50 ký tự
            </Text>
          </View>

          {/* ── Loại ví ── */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Loại ví
            </Text>
            <View style={styles.typeGrid}>
              {WALLET_TYPES.map((type) => {
                const active = selectedType === type.value;
                return (
                  <Pressable
                    key={type.value}
                    style={({ pressed }) => [
                      styles.typeCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                      active && [
                        styles.typeCardActive,
                        {
                          backgroundColor: colors.surface,
                          borderColor: type.color,
                        },
                      ],
                      pressed && styles.typeCardPressed,
                    ]}
                    onPress={() => setSelectedType(type.value)}
                    accessibilityLabel={`Loại ví: ${type.label}`}
                  >
                    {/* Check mark */}
                    {active && (
                      <View
                        style={[
                          styles.typeCheck,
                          { backgroundColor: type.color },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={10}
                          color={colors.background}
                        />
                      </View>
                    )}

                    <View
                      style={[
                        styles.typeIconWrap,
                        {
                          backgroundColor: active
                            ? `${type.color}22`
                            : colors.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name={type.icon}
                        size={22}
                        color={active ? type.color : colors.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: colors.textSecondary },
                        active && {
                          color: type.color,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                    <Text
                      style={[
                        styles.typeDescription,
                        { color: colors.textDark },
                      ]}
                      numberOfLines={1}
                    >
                      {type.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Số dư ban đầu (chỉ khi tạo mới) ── */}
          {!isEditMode && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Số dư ban đầu
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={balance}
                onChangeText={setBalance}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                returnKeyType="done"
              />
              {parsedBalance > 0 && (
                <View style={styles.balancePreviewRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={colors.accent}
                  />
                  <Text
                    style={[
                      styles.balancePreviewText,
                      { color: colors.accent },
                    ]}
                  >
                    {formatVND(parsedBalance)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Đơn vị tiền tệ (chỉ khi tạo mới) ── */}
          {!isEditMode && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Đơn vị tiền tệ
              </Text>
              <View
                style={[
                  styles.currencyToggle,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {(["VND", "USD"] as CurrencyValue[]).map((c) => {
                  const active = currency === c;
                  return (
                    <Pressable
                      key={c}
                      style={[
                        styles.currencyOption,
                        active && [
                          styles.currencyOptionActive,
                          { backgroundColor: colors.accent },
                        ],
                      ]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text
                        style={[
                          styles.currencyFlag,
                          !active && styles.currencyFlagDim,
                        ]}
                      >
                        {c === "VND" ? "🇻🇳" : "🇺🇸"}
                      </Text>
                      <Text
                        style={[
                          styles.currencyLabel,
                          { color: colors.textSecondary },
                          active && [
                            styles.currencyLabelActive,
                            { color: colors.background },
                          ],
                        ]}
                      >
                        {c}
                      </Text>
                      {c === "VND" && (
                        <Text
                          style={[
                            styles.currencySubLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          Đồng Việt Nam
                        </Text>
                      )}
                      {c === "USD" && (
                        <Text
                          style={[
                            styles.currencySubLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          Đô la Mỹ
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Nút lưu ── */}
          <PrimaryButton
            title={isEditMode ? "Lưu thay đổi" : "Tạo ví"}
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            icon={isEditMode ? "save-outline" : "add-circle-outline"}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
  },

  // ── Loading ─────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: {
    fontSize: FONT_SIZE.body2,
  },

  // ── Scroll ──────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.huge,
  },

  // ── Field ───────────────────────────────────────────
  field: {
    marginBottom: 28,
  },
  label: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 10,
  },
  required: {},
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    fontSize: FONT_SIZE.body,
  },
  fieldHint: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.s,
    textAlign: "right",
  },

  // ── Balance Preview ──────────────────────────────────
  balancePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: SPACING.sm,
  },
  balancePreviewText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Type Grid ────────────────────────────────────────
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeCard: {
    width: "47.5%",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    gap: 7,
    position: "relative",
  },
  typeCardActive: {},
  typeCardPressed: {
    opacity: 0.7,
  },
  typeCheck: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  typeIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: "center",
  },
  typeDescription: {
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
  },

  // ── Currency Toggle ──────────────────────────────────
  currencyToggle: {
    flexDirection: "row",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.s,
    gap: SPACING.s,
  },
  currencyOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 11,
    gap: SPACING.xxs,
  },
  currencyOptionActive: {},
  currencyFlag: {
    fontSize: 22,
  },
  currencyFlagDim: {
    opacity: 0.5,
  },
  currencyLabel: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.bold,
  },
  currencyLabelActive: {},
  currencySubLabel: {
    fontSize: FONT_SIZE.xs,
  },
});
