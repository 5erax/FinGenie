import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  useCurrentSavingPlan,
  useSpendingCheck,
  savingPlanKeys,
} from "../src/hooks/use-saving-plan";
import {
  savingPlanService,
  type CreateSavingPlanDto,
} from "../src/services/saving-plan-service";
import { formatVND } from "../src/utils/format";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
} from "../src/constants/theme";
import { useThemeColors } from "../src/hooks/use-theme-colors";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PrimaryButton } from "../src/components/PrimaryButton";

// ─── Custom Slider ────────────────────────────────────────────────────────────

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}

function PercentSlider({ value, onChange, max = 50 }: SliderProps) {
  const colors = useThemeColors();
  const trackWidth = useRef(0);
  // Use ref so PanResponder closure always calls the latest onChange
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const w = trackWidth.current;
        if (w === 0) return;
        onChangeRef.current(
          Math.round((Math.max(0, Math.min(w, x)) / w) * max),
        );
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const w = trackWidth.current;
        if (w === 0) return;
        onChangeRef.current(
          Math.round((Math.max(0, Math.min(w, x)) / w) * max),
        );
      },
    }),
  ).current;

  const pct = (value / max) * 100;

  return (
    <View
      style={sliderStyles.container}
      onLayout={(e) => {
        trackWidth.current = e.nativeEvent.layout.width;
      }}
      {...panResponder.panHandlers}
    >
      <View style={[sliderStyles.track, { backgroundColor: colors.inactive }]}>
        <View
          style={[
            sliderStyles.fill,
            {
              width: `${pct}%` as unknown as number,
              backgroundColor: colors.accent,
            },
          ]}
        />
      </View>
      <View
        style={[
          sliderStyles.thumb,
          {
            left: `${pct}%` as unknown as number,
            marginLeft: -12,
            backgroundColor: colors.accent,
            borderColor: colors.background,
            shadowColor: colors.accent,
          },
        ]}
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    height: 44,
    justifyContent: "center",
    position: "relative",
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
  thumb: {
    position: "absolute",
    top: "50%",
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: RADIUS.lg,
    borderWidth: 3,
    ...Platform.select({
      web: { boxShadow: `0px 0px 8px rgba(167, 139, 250, 0.6)` },
      default: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
    }),
    elevation: 4,
  },
});

// ─── Form State ───────────────────────────────────────────────────────────────

interface FormState {
  monthlyIncome: string;
  fixedExpenses: string;
  variableExpenses: string;
  savingPercent: number;
}

const emptyForm: FormState = {
  monthlyIncome: "",
  fixedExpenses: "",
  variableExpenses: "",
  savingPercent: 20,
};

// ─── Plan Form ────────────────────────────────────────────────────────────────

interface PlanFormProps {
  form: FormState;
  onUpdateForm: (field: keyof FormState, value: string | number) => void;
  available: number;
  savings: number;
  dailyBudget: number;
  isLoading: boolean;
  onSubmit: () => void;
  submitLabel: string;
}

function PlanForm({
  form,
  onUpdateForm,
  available,
  savings,
  dailyBudget,
  isLoading,
  onSubmit,
  submitLabel,
}: PlanFormProps) {
  const colors = useThemeColors();
  return (
    <>
      <Text style={[styles.formSectionTitle, { color: colors.textPrimary }]}>
        Thiết lập kế hoạch
      </Text>
      <Text style={[styles.formSectionSub, { color: colors.textSecondary }]}>
        Nhập thông tin tài chính để tính ngân sách hàng ngày
      </Text>

      {/* Monthly Income */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Thu nhập hàng tháng
        </Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            value={form.monthlyIncome}
            onChangeText={(v) =>
              onUpdateForm("monthlyIncome", v.replace(/[^0-9]/g, ""))
            }
            placeholder="0"
            placeholderTextColor={colors.textDark}
            keyboardType="numeric"
            textAlign="right"
          />
          <Text style={[styles.inputSuffix, { color: colors.textMuted }]}>
            VND
          </Text>
        </View>
      </View>

      {/* Fixed Expenses */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Chi phí cố định
        </Text>
        <Text style={[styles.inputHint, { color: colors.textMuted }]}>
          Tiền thuê nhà, điện nước, bảo hiểm...
        </Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            value={form.fixedExpenses}
            onChangeText={(v) =>
              onUpdateForm("fixedExpenses", v.replace(/[^0-9]/g, ""))
            }
            placeholder="0"
            placeholderTextColor={colors.textDark}
            keyboardType="numeric"
            textAlign="right"
          />
          <Text style={[styles.inputSuffix, { color: colors.textMuted }]}>
            VND
          </Text>
        </View>
      </View>

      {/* Variable Expenses */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Chi phí phát sinh
        </Text>
        <Text style={[styles.inputHint, { color: colors.textMuted }]}>
          Ăn uống, đi lại, giải trí...
        </Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            value={form.variableExpenses}
            onChangeText={(v) =>
              onUpdateForm("variableExpenses", v.replace(/[^0-9]/g, ""))
            }
            placeholder="0"
            placeholderTextColor={colors.textDark}
            keyboardType="numeric"
            textAlign="right"
          />
          <Text style={[styles.inputSuffix, { color: colors.textMuted }]}>
            VND
          </Text>
        </View>
      </View>

      {/* Saving Percent Slider */}
      <View style={styles.inputGroup}>
        <View style={styles.sliderLabelRow}>
          <View>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              % Tiết kiệm
            </Text>
            <Text style={[styles.inputHint, { color: colors.textMuted }]}>
              Kéo để chọn tỷ lệ (0 – 50%)
            </Text>
          </View>
          <View
            style={[
              styles.percentDisplay,
              { backgroundColor: colors.accentDim, borderColor: colors.accent },
            ]}
          >
            <Text style={[styles.percentValue, { color: colors.accent }]}>
              {form.savingPercent}%
            </Text>
          </View>
        </View>
        <PercentSlider
          value={form.savingPercent}
          onChange={(v) => onUpdateForm("savingPercent", v)}
        />
        <View style={styles.sliderMarks}>
          <Text style={[styles.sliderMark, { color: colors.textMuted }]}>
            0%
          </Text>
          <Text style={[styles.sliderMark, { color: colors.textMuted }]}>
            25%
          </Text>
          <Text style={[styles.sliderMark, { color: colors.textMuted }]}>
            50%
          </Text>
        </View>
      </View>

      {/* Preview Card */}
      <View
        style={[
          styles.previewCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.previewHeader}>
          <Ionicons
            name="calculator-outline"
            size={16}
            color={colors.textMuted}
          />
          <Text style={[styles.previewTitle, { color: colors.textMuted }]}>
            XEM TRƯỚC
          </Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
            Khả dụng
          </Text>
          <Text
            style={[
              styles.previewValue,
              { color: available >= 0 ? colors.textPrimary : colors.danger },
            ]}
          >
            {formatVND(available)}
          </Text>
        </View>
        <View
          style={[styles.previewDivider, { backgroundColor: colors.border }]}
        />
        <View style={styles.previewRow}>
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
            Tiết kiệm ({form.savingPercent}%)
          </Text>
          <Text style={[styles.previewValue, { color: colors.accent }]}>
            {formatVND(Math.max(0, savings))}
          </Text>
        </View>
        <View
          style={[styles.previewDivider, { backgroundColor: colors.border }]}
        />
        <View style={styles.previewRow}>
          <Text
            style={[
              styles.previewLabel,
              { fontWeight: FONT_WEIGHT.semibold, color: colors.textPrimary },
            ]}
          >
            Ngân sách ngày
          </Text>
          <Text
            style={[
              styles.previewValue,
              { color: colors.success, fontSize: FONT_SIZE.lg },
            ]}
          >
            {formatVND(Math.max(0, dailyBudget))}
          </Text>
        </View>
      </View>

      {/* Submit */}
      <PrimaryButton
        title={submitLabel}
        onPress={onSubmit}
        loading={isLoading}
        disabled={isLoading}
        icon="checkmark-circle"
        style={{ marginTop: SPACING.xs }}
      />
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SavingPlanScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useCurrentSavingPlan();
  const { data: spendingCheck } = useSpendingCheck(plan?.id ?? "");

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  // Pre-fill form whenever user enters edit mode
  useEffect(() => {
    if (isEditing && plan) {
      setForm({
        monthlyIncome: String(plan.monthlyIncome),
        fixedExpenses: String(plan.fixedExpenses),
        variableExpenses: String(plan.variableExpenses),
        savingPercent: plan.savingPercent,
      });
    }
    if (!isEditing && !plan) {
      setForm(emptyForm);
    }
  }, [isEditing, plan]);

  // ── Derived form values ──────────────────────────────────────────────────
  const monthlyIncome = parseFloat(form.monthlyIncome) || 0;
  const fixedExpenses = parseFloat(form.fixedExpenses) || 0;
  const variableExpenses = parseFloat(form.variableExpenses) || 0;
  const available = monthlyIncome - fixedExpenses - variableExpenses;
  const savings = Math.max(0, available) * (form.savingPercent / 100);
  const dailyBudget = Math.max(0, available - savings) / 30;

  const updateForm = (field: keyof FormState, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: CreateSavingPlanDto) => savingPlanService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingPlanKeys.all });
    },
    onError: () => {
      Alert.alert("Lỗi", "Không thể tạo kế hoạch. Vui lòng thử lại.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateSavingPlanDto>;
    }) => savingPlanService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingPlanKeys.all });
      setIsEditing(false);
    },
    onError: () => {
      Alert.alert("Lỗi", "Không thể cập nhật kế hoạch. Vui lòng thử lại.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => savingPlanService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingPlanKeys.all });
    },
    onError: () => {
      Alert.alert("Lỗi", "Không thể xóa kế hoạch. Vui lòng thử lại.");
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (monthlyIncome <= 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập thu nhập hàng tháng.");
      return;
    }
    if (fixedExpenses + variableExpenses > monthlyIncome) {
      Alert.alert(
        "Lỗi",
        "Tổng chi phí không được vượt quá thu nhập hàng tháng",
      );
      return;
    }
    createMutation.mutate({
      monthlyIncome,
      fixedExpenses,
      variableExpenses,
      savingPercent: form.savingPercent,
    });
  };

  const handleUpdate = () => {
    if (!plan) return;
    if (monthlyIncome <= 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập thu nhập hàng tháng.");
      return;
    }
    if (fixedExpenses + variableExpenses > monthlyIncome) {
      Alert.alert(
        "Lỗi",
        "Tổng chi phí không được vượt quá thu nhập hàng tháng",
      );
      return;
    }
    updateMutation.mutate({
      id: plan.id,
      data: {
        monthlyIncome,
        fixedExpenses,
        variableExpenses,
        savingPercent: form.savingPercent,
      },
    });
  };

  const handleDelete = () => {
    if (!plan) return;
    Alert.alert(
      "Xóa kế hoạch",
      "Bạn có chắc muốn xóa kế hoạch tiết kiệm này không? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => deleteMutation.mutate(plan.id),
        },
      ],
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScreenHeader title="Kế hoạch tiết kiệm" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Đang tải...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── No plan → Create form ─────────────────────────────────────────────────
  if (!plan) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScreenHeader title="Kế hoạch tiết kiệm" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <PlanForm
              form={form}
              onUpdateForm={updateForm}
              available={available}
              savings={savings}
              dailyBudget={dailyBudget}
              isLoading={createMutation.isPending}
              onSubmit={handleCreate}
              submitLabel="Tạo kế hoạch"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Has plan, editing ─────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScreenHeader
          title="Chỉnh sửa kế hoạch"
          onBack={() => setIsEditing(false)}
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <PlanForm
              form={form}
              onUpdateForm={updateForm}
              available={available}
              savings={savings}
              dailyBudget={dailyBudget}
              isLoading={updateMutation.isPending}
              onSubmit={handleUpdate}
              submitLabel="Lưu thay đổi"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const remainingIncome = Math.max(
    0,
    plan.monthlyIncome - plan.fixedExpenses - plan.variableExpenses,
  );
  const savingAmount = remainingIncome * (plan.savingPercent / 100);

  // Spending check helpers
  const todaySpent = spendingCheck?.todaySpent ?? 0;
  const spendingBudget = spendingCheck?.dailyBudget ?? plan.dailyBudget;
  const remaining = spendingCheck?.remaining ?? plan.dailyBudget;
  const spendingPct =
    spendingBudget > 0 ? Math.min(100, (todaySpent / spendingBudget) * 100) : 0;
  const spendingColor = spendingCheck?.isOverBudget
    ? colors.danger
    : spendingCheck?.isNearThreshold
      ? colors.warning
      : colors.success;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScreenHeader title="Kế hoạch tiết kiệm" />
      <ScrollView
        contentContainerStyle={styles.dashContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero: Daily Budget ── */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.heroGlow, { backgroundColor: colors.accentDim }]}
          />
          <Text style={[styles.heroEyebrow, { color: colors.textMuted }]}>
            NGÂN SÁCH HÀNG NGÀY
          </Text>
          <Text style={[styles.heroAmount, { color: colors.accent }]}>
            {formatVND(plan.dailyBudget)}
          </Text>
          <View style={styles.heroChips}>
            <View
              style={[
                styles.heroChip,
                {
                  backgroundColor: colors.accentDim,
                  borderColor: colors.accent,
                },
              ]}
            >
              <Ionicons
                name="trending-up-outline"
                size={13}
                color={colors.accent}
              />
              <Text style={[styles.heroChipText, { color: colors.accent }]}>
                Tiết kiệm {plan.savingPercent}%
              </Text>
            </View>
            <View
              style={[
                styles.heroChip,
                {
                  backgroundColor: colors.accentDim,
                  borderColor: colors.accent,
                },
              ]}
            >
              <Ionicons name="shield-outline" size={13} color={colors.accent} />
              <Text style={[styles.heroChipText, { color: colors.accent }]}>
                {formatVND(plan.safeMoney)} an toàn
              </Text>
            </View>
          </View>
        </View>

        {/* ── Income & Expenses Breakdown ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Thu nhập & Chi phí
          </Text>
          <View style={styles.breakdownRows}>
            <View style={styles.breakdownRow}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text
                style={[styles.breakdownLabel, { color: colors.textSecondary }]}
              >
                Thu nhập
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.success }]}>
                {formatVND(plan.monthlyIncome)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={[styles.dot, { backgroundColor: colors.danger }]} />
              <Text
                style={[styles.breakdownLabel, { color: colors.textSecondary }]}
              >
                Chi phí cố định
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.danger }]}>
                {formatVND(plan.fixedExpenses)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={[styles.dot, { backgroundColor: colors.warning }]} />
              <Text
                style={[styles.breakdownLabel, { color: colors.textSecondary }]}
              >
                Chi phí phát sinh
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.warning }]}>
                {formatVND(plan.variableExpenses)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <Text
                style={[styles.breakdownLabel, { color: colors.textSecondary }]}
              >
                Tiết kiệm
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.accent }]}>
                {formatVND(savingAmount)}
              </Text>
            </View>
          </View>
          {/* Stacked proportional bar */}
          {plan.monthlyIncome > 0 && (
            <View
              style={[styles.stackedBar, { backgroundColor: colors.inactive }]}
            >
              {plan.fixedExpenses > 0 && (
                <View
                  style={[
                    styles.stackedSegment,
                    {
                      flex: plan.fixedExpenses / plan.monthlyIncome,
                      backgroundColor: colors.danger,
                    },
                  ]}
                />
              )}
              {plan.variableExpenses > 0 && (
                <View
                  style={[
                    styles.stackedSegment,
                    {
                      flex: plan.variableExpenses / plan.monthlyIncome,
                      backgroundColor: colors.warning,
                    },
                  ]}
                />
              )}
              {savingAmount > 0 && (
                <View
                  style={[
                    styles.stackedSegment,
                    {
                      flex: savingAmount / plan.monthlyIncome,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              )}
              {remainingIncome - savingAmount > 0 && (
                <View
                  style={[
                    styles.stackedSegment,
                    {
                      flex:
                        (remainingIncome - savingAmount) / plan.monthlyIncome,
                      backgroundColor: colors.success,
                      opacity: 0.5,
                    },
                  ]}
                />
              )}
            </View>
          )}
          <View style={styles.stackedLegend}>
            <Text
              style={[styles.stackedLegendText, { color: colors.textMuted }]}
            >
              Chi cố định
            </Text>
            <Text
              style={[styles.stackedLegendText, { color: colors.textMuted }]}
            >
              Chi phát sinh
            </Text>
            <Text
              style={[styles.stackedLegendText, { color: colors.textMuted }]}
            >
              Tiết kiệm
            </Text>
            <Text
              style={[styles.stackedLegendText, { color: colors.textMuted }]}
            >
              Còn lại
            </Text>
          </View>
        </View>

        {/* ── Saving Percent ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Tỷ lệ tiết kiệm
              </Text>
              <Text
                style={[styles.cardSubtitle, { color: colors.textSecondary }]}
              >
                {formatVND(savingAmount)} / tháng
              </Text>
            </View>
            <View
              style={[
                styles.percentBadge,
                {
                  backgroundColor: colors.accentDim,
                  borderColor: colors.accent,
                },
              ]}
            >
              <Text style={[styles.percentBadgeText, { color: colors.accent }]}>
                {plan.savingPercent}%
              </Text>
            </View>
          </View>
          <View
            style={[styles.progressTrack, { backgroundColor: colors.inactive }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.accent,
                  width:
                    `${(plan.savingPercent / 50) * 100}%` as unknown as number,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
              0%
            </Text>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
              25%
            </Text>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
              50%
            </Text>
          </View>
        </View>

        {/* ── Spending Check ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardRow}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Chi tiêu hôm nay
            </Text>
            {spendingCheck?.isOverBudget && (
              <View
                style={[
                  styles.statusBadge,
                  styles.statusBadgeDanger,
                  { borderColor: colors.danger },
                ]}
              >
                <Ionicons name="warning" size={11} color={colors.danger} />
                <Text
                  style={[styles.statusBadgeText, { color: colors.danger }]}
                >
                  Vượt ngân sách
                </Text>
              </View>
            )}
            {!spendingCheck?.isOverBudget && spendingCheck?.isNearThreshold && (
              <View
                style={[
                  styles.statusBadge,
                  styles.statusBadgeWarn,
                  { borderColor: colors.warning },
                ]}
              >
                <Ionicons
                  name="alert-circle"
                  size={11}
                  color={colors.warning}
                />
                <Text
                  style={[styles.statusBadgeText, { color: colors.warning }]}
                >
                  Gần ngưỡng
                </Text>
              </View>
            )}
          </View>

          {spendingCheck ? (
            <>
              <View style={styles.spendStatsRow}>
                <View style={styles.spendStat}>
                  <Text
                    style={[styles.spendStatLabel, { color: colors.textMuted }]}
                  >
                    Đã chi
                  </Text>
                  <Text
                    style={[styles.spendStatValue, { color: spendingColor }]}
                  >
                    {formatVND(todaySpent)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.spendDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View style={styles.spendStat}>
                  <Text
                    style={[styles.spendStatLabel, { color: colors.textMuted }]}
                  >
                    Ngân sách
                  </Text>
                  <Text
                    style={[
                      styles.spendStatValue,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {formatVND(spendingBudget)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.spendDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View style={styles.spendStat}>
                  <Text
                    style={[styles.spendStatLabel, { color: colors.textMuted }]}
                  >
                    Còn lại
                  </Text>
                  <Text
                    style={[
                      styles.spendStatValue,
                      {
                        color: remaining >= 0 ? colors.success : colors.danger,
                      },
                    ]}
                  >
                    {formatVND(remaining)}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.spendTrack,
                  { backgroundColor: colors.inactive },
                ]}
              >
                <View
                  style={[
                    styles.spendFill,
                    {
                      width: `${spendingPct}%` as unknown as number,
                      backgroundColor: spendingColor,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.spendPctLabel, { color: colors.textSecondary }]}
              >
                {Math.round(spendingPct)}% ngân sách ngày đã dùng
              </Text>
            </>
          ) : (
            <View style={styles.spendLoading}>
              <ActivityIndicator size="small" color={colors.textMuted} />
              <Text
                style={[styles.spendLoadingText, { color: colors.textMuted }]}
              >
                Đang tải dữ liệu...
              </Text>
            </View>
          )}
        </View>

        {/* ── Safe Money ── */}
        <View
          style={[
            styles.card,
            styles.safeCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.safeIconWrap,
              { backgroundColor: colors.accentDim, borderColor: colors.accent },
            ]}
          >
            <Ionicons name="shield-checkmark" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.safeLabel, { color: colors.textSecondary }]}>
              Quỹ an toàn
            </Text>
            <Text style={[styles.safeAmount, { color: colors.textPrimary }]}>
              {formatVND(plan.safeMoney)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[
              styles.actionBtn,
              styles.editBtn,
              { backgroundColor: colors.accentDim, borderColor: colors.accent },
            ]}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="create-outline" size={18} color={colors.accent} />
            <Text style={[styles.editBtnText, { color: colors.accent }]}>
              Chỉnh sửa
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionBtn,
              styles.deleteBtn,
              { borderColor: colors.danger },
              deleteMutation.isPending && { opacity: 0.6 },
            ]}
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <>
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                />
                <Text style={[styles.deleteBtnText, { color: colors.danger }]}>
                  Xóa kế hoạch
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.body2,
  },

  // ── Form ──────────────────────────────────────────────────────────────────
  formContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.huge,
    gap: SPACING.base,
  },
  formSectionTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
  },
  formSectionSub: {
    fontSize: FONT_SIZE.body2,
    marginTop: -8,
    marginBottom: SPACING.xs,
  },
  inputGroup: {
    gap: SPACING.s,
  },
  inputLabel: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },
  inputHint: {
    fontSize: FONT_SIZE.xs,
    marginTop: -2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xxs,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.semibold,
    paddingVertical: 14,
  },
  inputSuffix: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: SPACING.sm,
  },
  sliderLabelRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  percentDisplay: {
    paddingHorizontal: 14,
    paddingVertical: SPACING.s,
    borderRadius: 10,
    borderWidth: 1,
  },
  percentValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.extrabold,
  },
  sliderMarks: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -2,
    paddingHorizontal: SPACING.xxs,
  },
  sliderMark: {
    fontSize: FONT_SIZE.xs,
  },
  // Preview
  previewCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.base,
    gap: 10,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    marginBottom: SPACING.xxs,
  },
  previewTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.8,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewDivider: {
    height: 1,
  },
  previewLabel: {
    fontSize: FONT_SIZE.body2,
  },
  previewValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
  },
  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.huge,
    gap: 14,
  },
  // Hero
  heroCard: {
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    borderWidth: 1,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    gap: SPACING.sm,
  },
  heroGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -80,
    alignSelf: "center",
  },
  heroEyebrow: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: -0.5,
  },
  heroChips: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  heroChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  // Cards
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.bold,
  },
  cardSubtitle: {
    fontSize: FONT_SIZE.caption,
    marginTop: SPACING.xxs,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Breakdown
  breakdownRows: {
    gap: SPACING.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.xs,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: FONT_SIZE.caption,
  },
  breakdownValue: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },
  stackedBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  stackedSegment: {
    height: "100%",
  },
  stackedLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  stackedLegendText: {
    fontSize: FONT_SIZE.xxs,
  },
  // Saving percent
  percentBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
  },
  percentBadgeText: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.extrabold,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  progressLabel: {
    fontSize: FONT_SIZE.xs,
  },
  // Spending check
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  statusBadgeDanger: {
    backgroundColor: "rgba(248, 113, 113, 0.1)",
  },
  statusBadgeWarn: {
    backgroundColor: "rgba(251, 191, 36, 0.1)",
  },
  statusBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  spendStatsRow: {
    flexDirection: "row",
    gap: 0,
  },
  spendStat: {
    flex: 1,
    alignItems: "center",
    gap: SPACING.xs,
  },
  spendDivider: {
    width: 1,
    marginVertical: SPACING.xs,
  },
  spendStatLabel: {
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
  },
  spendStatValue: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: "center",
  },
  spendTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  spendFill: {
    height: "100%",
    borderRadius: 4,
  },
  spendPctLabel: {
    fontSize: FONT_SIZE.sm,
    textAlign: "center",
    marginTop: -4,
  },
  spendLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  spendLoadingText: {
    fontSize: FONT_SIZE.caption,
  },
  // Safe money
  safeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  safeIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  safeLabel: {
    fontSize: FONT_SIZE.sm,
    marginBottom: 3,
  },
  safeAmount: {
    fontSize: 17,
    fontWeight: FONT_WEIGHT.bold,
  },
  // Action buttons
  actionsRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  editBtn: {},
  editBtnText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },
  deleteBtn: {
    backgroundColor: "rgba(248, 113, 113, 0.1)",
  },
  deleteBtnText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
