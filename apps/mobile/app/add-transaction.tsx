import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PrimaryButton } from "../src/components/PrimaryButton";

import {
  useTransaction,
  useCreateTransaction,
  useUpdateTransaction,
} from "../src/hooks/use-transactions";
import { useWallets } from "../src/hooks/use-wallets";
import { useCategories } from "../src/hooks/use-categories";
import { formatVND, formatDate } from "../src/utils/format";
import { resolveIcon } from "../src/utils/icons";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
} from "../src/constants/theme";
import { useThemeColors } from "../src/hooks/use-theme-colors";

// ─── Local Types ─────────────────────────────────────────────────────────────

interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

type TxType = "income" | "expense";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}

function formatAmountDisplay(raw: string): string {
  const num = raw.replace(/\D/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("vi-VN").format(parseInt(num, 10));
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  const colors = useThemeColors();
  return (
    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
      {label}
    </Text>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddTransactionScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  const editId = params.id ?? "";
  const paramType = params.type as TxType | undefined;
  const isEditMode = !!editId;

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: existingTx, isLoading: loadingTx } = useTransaction(editId);
  const { data: walletsRaw, isLoading: loadingWallets } = useWallets();
  const { data: categoriesRaw, isLoading: loadingCats } = useCategories();

  const wallets: Wallet[] = (walletsRaw as Wallet[] | undefined) ?? [];
  const categories: Category[] =
    (categoriesRaw as Category[] | undefined) ?? [];

  // ── Form state ────────────────────────────────────────────────────────────

  const [txType, setTxType] = useState<TxType>(paramType ?? "expense");
  const [amountRaw, setAmountRaw] = useState(""); // digits only
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getTodayISO());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  // Pre-fill from existing transaction in edit mode
  useEffect(() => {
    if (isEditMode && existingTx && !initialized) {
      const tx = existingTx as {
        type: TxType;
        amount: number;
        walletId: string;
        categoryId: string;
        note?: string | null;
        date: string;
      };
      setTxType(tx.type);
      setAmountRaw(String(tx.amount));
      setWalletId(tx.walletId);
      setCategoryId(tx.categoryId);
      setNote(tx.note ?? "");
      setDate(tx.date.split("T")[0]);
      setInitialized(true);
    }
  }, [existingTx, isEditMode, initialized]);

  // Auto-select first wallet if none selected
  useEffect(() => {
    if (!walletId && wallets.length > 0) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  // Reset category when type changes (since user picks a new context)
  // (keeping category if it logically makes sense is also fine)

  // ── Mutations ─────────────────────────────────────────────────────────────

  const { mutateAsync: createTx, isPending: creating } = useCreateTransaction();
  const { mutateAsync: updateTx, isPending: updating } = useUpdateTransaction();
  const isSaving = creating || updating;

  // ── Computed ──────────────────────────────────────────────────────────────

  const amountNumber = useMemo(() => {
    const n = parseInt(amountRaw.replace(/\D/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }, [amountRaw]);

  const amountDisplay = useMemo(
    () => formatAmountDisplay(amountRaw),
    [amountRaw],
  );

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!amountNumber || amountNumber <= 0) {
      errs.amount = "Vui lòng nhập số tiền hợp lệ";
    }
    if (!walletId) {
      errs.wallet = "Vui lòng chọn ví";
    }
    if (!categoryId) {
      errs.category = "Vui lòng chọn danh mục";
    }
    if (!isValidDate(date)) {
      errs.date = "Ngày không hợp lệ (YYYY-MM-DD)";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    const payload = {
      walletId,
      amount: amountNumber,
      type: txType,
      categoryId,
      note: note.trim() || undefined,
      date,
    };

    try {
      if (isEditMode) {
        await updateTx({ id: editId, data: payload });
      } else {
        await createTx(payload);
      }
      router.back();
    } catch {
      Alert.alert(
        "Lỗi",
        isEditMode
          ? "Không thể cập nhật giao dịch. Vui lòng thử lại."
          : "Không thể tạo giao dịch. Vui lòng thử lại.",
      );
    }
  }, [
    validate,
    walletId,
    amountNumber,
    txType,
    categoryId,
    note,
    date,
    isEditMode,
    editId,
    createTx,
    updateTx,
    router,
  ]);

  // ── Amount handler ────────────────────────────────────────────────────────

  const handleAmountChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, "");
    setAmountRaw(digits);
    if (digits && parseInt(digits, 10) > 0) {
      setErrors((prev) => ({ ...prev, amount: "" }));
    }
  }, []);

  // ── Rendering ─────────────────────────────────────────────────────────────

  if (isEditMode && loadingTx) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Đang tải...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const incomeActive = txType === "income";
  const expenseActive = txType === "expense";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* ── Header ── */}
        <ScreenHeader title={isEditMode ? "Sửa giao dịch" : "Thêm giao dịch"} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Type Toggle ── */}
          <View style={styles.typeToggleContainer}>
            <View
              style={[
                styles.typeToggle,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  incomeActive && { backgroundColor: colors.success },
                ]}
                onPress={() => setTxType("income")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="trending-up"
                  size={16}
                  color={incomeActive ? colors.background : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    { color: colors.textMuted },
                    incomeActive && { color: colors.background },
                  ]}
                >
                  Thu nhập
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  expenseActive && { backgroundColor: colors.danger },
                ]}
                onPress={() => setTxType("expense")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="trending-down"
                  size={16}
                  color={expenseActive ? colors.background : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    { color: colors.textMuted },
                    expenseActive && { color: colors.background },
                  ]}
                >
                  Chi tiêu
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Amount ── */}
          <View style={styles.amountSection}>
            <View
              style={[
                styles.amountCard,
                txType === "income"
                  ? {
                      backgroundColor: `${colors.success}0D`,
                      borderColor: `${colors.success}30`,
                    }
                  : {
                      backgroundColor: `${colors.danger}0D`,
                      borderColor: `${colors.danger}30`,
                    },
              ]}
            >
              <Text
                style={[
                  styles.amountCurrencyLabel,
                  { color: colors.textMuted },
                ]}
              >
                {txType === "income" ? "+ Thu nhập" : "− Chi tiêu"}
              </Text>
              <View style={styles.amountInputRow}>
                <TextInput
                  style={[
                    styles.amountInput,
                    {
                      color:
                        txType === "income" ? colors.success : colors.danger,
                    },
                  ]}
                  value={amountDisplay}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={
                    txType === "income"
                      ? `${colors.success}55`
                      : `${colors.danger}55`
                  }
                  returnKeyType="done"
                  selectTextOnFocus
                />
                <Text style={[styles.amountUnit, { color: colors.textMuted }]}>
                  ₫
                </Text>
              </View>
              {errors.amount ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.amount}
                </Text>
              ) : null}
            </View>
          </View>

          {/* ── Wallet ── */}
          <View style={styles.section}>
            <SectionLabel label="Ví thanh toán" />
            {loadingWallets ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : wallets.length === 0 ? (
              <Text style={[styles.emptyHint, { color: colors.textDark }]}>
                Chưa có ví nào. Vui lòng tạo ví trước.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.walletRow}
              >
                {wallets.map((w) => {
                  const isActive = walletId === w.id;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[
                        styles.walletCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                        isActive && {
                          borderColor: colors.accent,
                          backgroundColor: `${colors.accent}0D`,
                        },
                      ]}
                      onPress={() => {
                        setWalletId(w.id);
                        setErrors((prev) => ({ ...prev, wallet: "" }));
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.walletIconBg,
                          isActive
                            ? { backgroundColor: `${colors.accent}25` }
                            : { backgroundColor: colors.border },
                        ]}
                      >
                        <Ionicons
                          name={
                            w.type === "bank"
                              ? "card-outline"
                              : w.type === "savings"
                                ? "save-outline"
                                : "wallet-outline"
                          }
                          size={18}
                          color={isActive ? colors.accent : colors.textMuted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.walletName,
                          { color: colors.textSecondary },
                          isActive && { color: colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {w.name}
                      </Text>
                      <Text
                        style={[
                          styles.walletBalance,
                          { color: colors.textDark },
                          isActive && { color: colors.accent },
                        ]}
                        numberOfLines={1}
                      >
                        {formatVND(w.balance)}
                      </Text>
                      {isActive && (
                        <View style={styles.walletCheckmark}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.accent}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            {errors.wallet ? (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.danger, marginTop: 4, marginLeft: 4 },
                ]}
              >
                {errors.wallet}
              </Text>
            ) : null}
          </View>

          {/* ── Category ── */}
          <View style={styles.section}>
            <SectionLabel label="Danh mục" />
            {loadingCats ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : categories.length === 0 ? (
              <Text style={[styles.emptyHint, { color: colors.textDark }]}>
                Chưa có danh mục nào.
              </Text>
            ) : (
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const isActive = categoryId === cat.id;
                  const iconName = resolveIcon(cat.icon);
                  const catColor = cat.color ?? colors.accent;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.categoryItem}
                      onPress={() => {
                        setCategoryId(cat.id);
                        setErrors((prev) => ({ ...prev, category: "" }));
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.categoryIconCircle,
                          {
                            backgroundColor: isActive
                              ? `${catColor}30`
                              : `${catColor}14`,
                            borderColor: isActive ? catColor : "transparent",
                          },
                        ]}
                      >
                        <Ionicons
                          name={iconName as keyof typeof Ionicons.glyphMap}
                          size={20}
                          color={catColor}
                        />
                        {isActive && (
                          <View
                            style={[
                              styles.categoryCheck,
                              {
                                backgroundColor: catColor,
                                borderColor: colors.background,
                              },
                            ]}
                          >
                            <Ionicons
                              name="checkmark"
                              size={8}
                              color={colors.textPrimary}
                            />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.categoryName,
                          { color: colors.textMuted },
                          isActive && { color: colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {errors.category ? (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.danger, marginTop: 4, marginLeft: 4 },
                ]}
              >
                {errors.category}
              </Text>
            ) : null}
          </View>

          {/* ── Note ── */}
          <View style={styles.section}>
            <SectionLabel label="Ghi chú (tùy chọn)" />
            <View
              style={[
                styles.inputCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="pencil-outline"
                size={18}
                color={colors.textMuted}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[styles.noteInput, { color: colors.textPrimary }]}
                value={note}
                onChangeText={setNote}
                placeholder="Thêm ghi chú..."
                placeholderTextColor={colors.textDark}
                multiline
                numberOfLines={2}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ── Date ── */}
          <View style={styles.section}>
            <SectionLabel label="Ngày giao dịch" />
            <View
              style={[
                styles.inputCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                errors.date ? { borderColor: colors.danger } : undefined,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.textMuted}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[styles.dateInput, { color: colors.textPrimary }]}
                value={date}
                onChangeText={(t) => {
                  setDate(t);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textDark}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                returnKeyType="done"
              />
              <Text style={[styles.dateParsed, { color: colors.textMuted }]}>
                {isValidDate(date) ? formatDate(date) : ""}
              </Text>
            </View>
            {errors.date ? (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.danger, marginTop: 4, marginLeft: 4 },
                ]}
              >
                {errors.date}
              </Text>
            ) : null}
          </View>

          {/* ── Save Button ── */}
          <PrimaryButton
            title={isEditMode ? "Cập nhật giao dịch" : "Lưu giao dịch"}
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            icon={isEditMode ? "checkmark-circle" : "add-circle"}
            style={{
              marginTop: SPACING.md,
              backgroundColor:
                txType === "income" ? colors.success : colors.accent,
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.body2,
  },

  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.huge,
    gap: 0,
  },

  // Type Toggle
  typeToggleContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
    marginTop: SPACING.xs,
  },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 14,
    padding: SPACING.xs,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeBtnText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // Amount
  amountSection: {
    marginBottom: 28,
  },
  amountCard: {
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
  },
  amountCurrencyLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: SPACING.sm,
  },
  amountInput: {
    fontSize: FONT_SIZE.display,
    fontWeight: "800",
    letterSpacing: -2,
    minWidth: 80,
    textAlign: "center",
    padding: 0,
  },
  amountUnit: {
    fontSize: FONT_SIZE.h2,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionLoading: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHint: {
    fontSize: FONT_SIZE.caption,
    fontStyle: "italic",
    paddingVertical: SPACING.sm,
  },

  // Wallet picker
  walletRow: {
    gap: 10,
    paddingRight: SPACING.xs,
  },
  walletCard: {
    width: 140,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: SPACING.s,
    position: "relative",
  },
  walletIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xxs,
  },
  walletName: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },
  walletBalance: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  walletCheckmark: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
  },

  // Category grid — compact mobile layout
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.s,
    rowGap: 14,
  },
  categoryItem: {
    width: "23%",
    alignItems: "center",
    gap: 5,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    position: "relative",
  },
  categoryName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: "center",
    lineHeight: 14,
  },
  categoryCheck: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },

  // Input card (note, date)
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    borderWidth: 1,
  },
  noteInput: {
    flex: 1,
    fontSize: FONT_SIZE.body2,
    padding: 0,
    minHeight: 20,
  },
  dateInput: {
    flex: 1,
    fontSize: FONT_SIZE.body2,
    padding: 0,
    letterSpacing: 0.5,
  },
  dateParsed: {
    fontSize: FONT_SIZE.sm,
    marginLeft: SPACING.sm,
    flexShrink: 0,
  },

  // Error text
  errorText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});
