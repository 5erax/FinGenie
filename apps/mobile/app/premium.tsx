import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

import {
  usePaymentStatus,
  usePaymentHistory,
  useCreatePaymentLink,
  useCancelPayment,
  useVerifyPayment,
} from "../src/hooks/use-payment";
import { formatVND, formatDate } from "../src/utils/format";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
} from "../src/constants/theme";
import { useThemeColors } from "../src/hooks/use-theme-colors";
import type { ThemeColors } from "../src/hooks/use-theme-colors";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PrimaryButton } from "../src/components/PrimaryButton";
import type { PaymentStatus } from "@fingenie/shared-types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Plan = "monthly" | "yearly";

// ─── Constants ───────────────────────────────────────────────────────────────

const PLAN_PRICES: Record<Plan, number> = {
  monthly: 79_000,
  yearly: 790_000,
};

interface FeatureItem {
  icon: "chatbubble-ellipses" | "analytics" | "paw" | "eye-off" | "headset";
  /** Theme color key (e.g. "accent") or a literal hex value (e.g. "#f472b6") */
  colorKey: string;
  title: string;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: "chatbubble-ellipses",
    colorKey: "accent",
    title: "AI Coach không giới hạn",
    description: "Trò chuyện với AI không giới hạn lượt mỗi ngày",
  },
  {
    icon: "analytics",
    colorKey: "info",
    title: "Phân tích chi tiêu nâng cao",
    description: "Báo cáo chuyên sâu, biểu đồ xu hướng và dự báo",
  },
  {
    icon: "paw",
    colorKey: "warning",
    title: "Thú cưng đặc biệt",
    description: "Mở khóa tất cả thú cưng độc quyền Premium",
  },
  {
    icon: "eye-off",
    colorKey: "success",
    title: "Không quảng cáo",
    description: "Trải nghiệm hoàn toàn sạch, không gián đoạn",
  },
  {
    icon: "headset",
    colorKey: "#f472b6", // literal — not a theme key
    title: "Hỗ trợ ưu tiên",
    description: "Đội ngũ hỗ trợ phản hồi nhanh trong 2 giờ",
  },
];

function getStatusMeta(
  colors: ThemeColors,
): Record<PaymentStatus, { label: string; color: string; bg: string }> {
  return {
    success: {
      label: "Thành công",
      color: colors.success,
      bg: `${colors.success}22`,
    },
    pending: {
      label: "Đang xử lý",
      color: colors.warning,
      bg: `${colors.warning}22`,
    },
    failed: {
      label: "Thất bại",
      color: colors.danger,
      bg: `${colors.danger}22`,
    },
    cancelled: {
      label: "Đã huỷ",
      color: colors.textMuted,
      bg: `${colors.textMuted}22`,
    },
  };
}

const PLAN_LABEL: Record<string, string> = {
  monthly: "Hàng tháng",
  yearly: "Hàng năm",
  free: "Miễn phí",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function FeatureRow({ icon, colorKey, title, description }: FeatureItem) {
  const colors = useThemeColors();
  // Resolve theme key → actual color value; fall back to the literal if not a key
  const color =
    colorKey in colors ? colors[colorKey as keyof ThemeColors] : colorKey;

  return (
    <View style={[styles.featureRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.featureIconBg, { backgroundColor: `${color}1f` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
          {description}
        </Text>
      </View>
      <View style={styles.featureCheck}>
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function PremiumScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const colors = useThemeColors();

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: statusData, isLoading: statusLoading } = usePaymentStatus();
  const { data: history, isLoading: historyLoading } = usePaymentHistory();
  const { mutateAsync: createLink, isPending: creating } =
    useCreatePaymentLink();
  const { mutateAsync: cancelPayment, isPending: cancelling } =
    useCancelPayment();
  const { mutateAsync: verifyPayment } = useVerifyPayment();

  const isPremium = statusData?.isPremium ?? false;
  const subscription = statusData?.subscription ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSubscribe = useCallback(async () => {
    try {
      // Build return URLs using Expo's deep link scheme
      const returnUrl = Linking.createURL("payment/success");
      const cancelUrl = Linking.createURL("payment/cancel");

      const result = await createLink({
        plan: selectedPlan,
        returnUrl,
        cancelUrl,
      });

      // Open Stripe checkout in an in-app browser
      // openAuthSessionAsync returns control to the app when the user is
      // redirected to our deep link (returnUrl or cancelUrl)
      const browserResult = await WebBrowser.openAuthSessionAsync(
        result.paymentLink,
        returnUrl,
      );

      // After returning from the browser, verify the payment status with PayOS
      setVerifying(true);
      try {
        const verification = await verifyPayment(String(result.orderCode));

        if (verification.status === "success") {
          Alert.alert(
            "Thanh toán thành công!",
            "Chúc mừng bạn đã trở thành thành viên Premium!",
            [{ text: "Tuyệt vời!" }],
          );
        } else if (
          verification.status === "expired" ||
          browserResult.type === "cancel"
        ) {
          // User cancelled or session expired — no alert needed
        } else {
          // Still pending — might take a moment
          Alert.alert(
            "Đang xử lý",
            "Thanh toán của bạn đang được xử lý. Trạng thái sẽ được cập nhật trong giây lát.",
            [{ text: "OK" }],
          );
        }
      } catch {
        // Verification failed — but payment might still succeed via webhook
        Alert.alert(
          "Không thể xác minh",
          "Không thể kiểm tra trạng thái thanh toán. Vui lòng kiểm tra lại sau.",
          [{ text: "OK" }],
        );
      } finally {
        setVerifying(false);
      }
    } catch {
      Alert.alert(
        "Không thể tạo link thanh toán",
        "Vui lòng kiểm tra kết nối và thử lại.",
        [{ text: "Đóng" }],
      );
    }
  }, [createLink, selectedPlan, verifyPayment]);

  const handleCancelSubscription = useCallback(() => {
    const latestOrder = history?.find((o) => o.status === "success");
    if (!latestOrder) {
      Alert.alert("Không tìm thấy đơn hàng", "Liên hệ hỗ trợ để huỷ đăng ký.", [
        { text: "Đóng" },
      ]);
      return;
    }

    Alert.alert(
      "Huỷ đăng ký Premium?",
      "Bạn sẽ mất quyền truy cập vào các tính năng Premium sau ngày hết hạn hiện tại.",
      [
        { text: "Giữ lại", style: "cancel" },
        {
          text: "Xác nhận huỷ",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelPayment(
                latestOrder.stripeSessionId ?? latestOrder.id,
              );
              Alert.alert(
                "Đã gửi yêu cầu huỷ",
                "Đăng ký của bạn sẽ được huỷ vào cuối kỳ thanh toán.",
                [{ text: "OK" }],
              );
            } catch {
              Alert.alert(
                "Không thể huỷ",
                "Vui lòng liên hệ hỗ trợ để được trợ giúp.",
                [{ text: "Đóng" }],
              );
            }
          },
        },
      ],
    );
  }, [history, cancelPayment]);

  // ── Loading State ─────────────────────────────────────────────────────────

  if (statusLoading) {
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

  // ── Already Premium ───────────────────────────────────────────────────────

  if (isPremium && subscription) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ScreenHeader title="Premium" />

          {/* Active Badge */}
          <View style={styles.heroSection}>
            <View
              style={[
                styles.diamondGlow,
                {
                  shadowColor: colors.accent,
                  ...Platform.select({
                    web: { boxShadow: `0px 0px 24px ${colors.accent}73` },
                    default: {
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.45,
                      shadowRadius: 24,
                    },
                  }),
                },
              ]}
            >
              <Ionicons name="diamond" size={48} color={colors.accent} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              FinGenie Premium
            </Text>
            <View
              style={[
                styles.activeBadge,
                {
                  backgroundColor: `${colors.success}1a`,
                  borderColor: `${colors.success}40`,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />
              <Text style={[styles.activeBadgeText, { color: colors.success }]}>
                Đang hoạt động
              </Text>
            </View>
          </View>

          {/* Subscription Card */}
          <View style={[styles.subCard, { backgroundColor: colors.surface }]}>
            <View style={styles.subCardRow}>
              <View style={styles.subCardIconBg}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.accent}
                />
              </View>
              <View>
                <Text
                  style={[styles.subCardLabel, { color: colors.textMuted }]}
                >
                  Gói hiện tại
                </Text>
                <Text
                  style={[styles.subCardValue, { color: colors.textPrimary }]}
                >
                  {PLAN_LABEL[subscription.plan] ?? subscription.plan}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.subCardDivider,
                { backgroundColor: colors.border },
              ]}
            />

            <View style={styles.subCardRow}>
              <View style={styles.subCardIconBg}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.warning}
                />
              </View>
              <View>
                <Text
                  style={[styles.subCardLabel, { color: colors.textMuted }]}
                >
                  Ngày hết hạn
                </Text>
                <Text
                  style={[styles.subCardValue, { color: colors.textPrimary }]}
                >
                  {subscription.endDate
                    ? formatDate(subscription.endDate)
                    : "Không giới hạn"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.subCardDivider,
                { backgroundColor: colors.border },
              ]}
            />

            <View style={styles.subCardRow}>
              <View
                style={[
                  styles.subCardIconBg,
                  {
                    backgroundColor:
                      subscription.status === "active"
                        ? `${colors.success}22`
                        : `${colors.danger}22`,
                  },
                ]}
              >
                <Ionicons
                  name={
                    subscription.status === "active"
                      ? "shield-checkmark-outline"
                      : "shield-outline"
                  }
                  size={18}
                  color={
                    subscription.status === "active"
                      ? colors.success
                      : colors.danger
                  }
                />
              </View>
              <View>
                <Text
                  style={[styles.subCardLabel, { color: colors.textMuted }]}
                >
                  Trạng thái
                </Text>
                <Text
                  style={[
                    styles.subCardValue,
                    {
                      color:
                        subscription.status === "active"
                          ? colors.success
                          : colors.danger,
                    },
                  ]}
                >
                  {subscription.status === "active"
                    ? "Đang kích hoạt"
                    : subscription.status === "cancelled"
                      ? "Đã huỷ"
                      : "Hết hạn"}
                </Text>
              </View>
            </View>
          </View>

          {/* Features reminder */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              Quyền lợi của bạn
            </Text>
          </View>
          <View
            style={[
              styles.featureList,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {FEATURES.map((f) => (
              <FeatureRow key={f.title} {...f} />
            ))}
          </View>

          {/* Cancel Button */}
          {subscription.status === "active" && (
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: `${colors.danger}12`,
                  borderColor: `${colors.danger}30`,
                },
              ]}
              onPress={handleCancelSubscription}
              disabled={cancelling}
              activeOpacity={0.8}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <>
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color={colors.danger}
                  />
                  <Text
                    style={[styles.cancelBtnText, { color: colors.danger }]}
                  >
                    Huỷ đăng ký
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Payment History */}
          <PaymentHistorySection
            historyOpen={historyOpen}
            setHistoryOpen={setHistoryOpen}
            history={history}
            historyLoading={historyLoading}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Upgrade Screen ────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ScreenHeader title="Nâng cấp Premium" />

        {/* Hero */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.diamondGlow,
              {
                shadowColor: colors.accent,
                ...Platform.select({
                  web: { boxShadow: `0px 0px 24px ${colors.accent}73` },
                  default: {
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.45,
                    shadowRadius: 24,
                  },
                }),
              },
            ]}
          >
            <View style={styles.diamondGlowRing} />
            <Ionicons name="diamond" size={48} color={colors.accent} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            FinGenie Premium
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Trải nghiệm đầy đủ tính năng
          </Text>
        </View>

        {/* Feature List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Tính năng Premium
          </Text>
        </View>
        <View
          style={[
            styles.featureList,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {FEATURES.map((f) => (
            <FeatureRow key={f.title} {...f} />
          ))}
        </View>

        {/* Plan Selection */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Chọn gói
          </Text>
        </View>
        <View style={styles.planRow}>
          {/* Monthly */}
          <Pressable
            style={[
              styles.planCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedPlan === "monthly" && {
                borderColor: colors.accent,
                backgroundColor: `${colors.accent}14`,
              },
            ]}
            onPress={() => setSelectedPlan("monthly")}
          >
            <Text style={[styles.planName, { color: colors.textSecondary }]}>
              Hàng tháng
            </Text>
            <Text style={[styles.planPrice, { color: colors.textPrimary }]}>
              {formatVND(PLAN_PRICES.monthly)}
            </Text>
            <Text style={[styles.planPeriod, { color: colors.textMuted }]}>
              /tháng
            </Text>
            {selectedPlan === "monthly" && (
              <View
                style={[
                  styles.planSelectedDot,
                  { backgroundColor: colors.accent },
                ]}
              />
            )}
          </Pressable>

          {/* Yearly */}
          <Pressable
            style={[
              styles.planCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedPlan === "yearly" && {
                borderColor: colors.accent,
                backgroundColor: `${colors.accent}14`,
              },
            ]}
            onPress={() => setSelectedPlan("yearly")}
          >
            <View
              style={[styles.savingsBadge, { backgroundColor: colors.accent }]}
            >
              <Text
                style={[styles.savingsBadgeText, { color: colors.background }]}
              >
                Tiết kiệm 17%
              </Text>
            </View>
            <Text style={[styles.planName, { color: colors.textSecondary }]}>
              Hàng năm
            </Text>
            <Text style={[styles.planPrice, { color: colors.textPrimary }]}>
              {formatVND(PLAN_PRICES.yearly)}
            </Text>
            <Text style={[styles.planPeriod, { color: colors.textMuted }]}>
              /năm
            </Text>
            <Text style={[styles.planMonthly, { color: colors.accent }]}>
              ~{formatVND(Math.round(PLAN_PRICES.yearly / 12))}/tháng
            </Text>
            {selectedPlan === "yearly" && (
              <View
                style={[
                  styles.planSelectedDot,
                  { backgroundColor: colors.accent },
                ]}
              />
            )}
          </Pressable>
        </View>

        {/* CTA Button */}
        <PrimaryButton
          title={verifying ? "Đang xác minh thanh toán..." : "Đăng ký ngay"}
          onPress={handleSubscribe}
          loading={creating || verifying}
          disabled={creating || verifying}
          icon="diamond"
          style={{ marginHorizontal: SPACING.lg, paddingVertical: 17 }}
        />

        <Text style={[styles.ctaHint, { color: colors.textMuted }]}>
          Thanh toán an toàn qua PayOS · Có thể huỷ bất cứ lúc nào
        </Text>

        {/* Payment History */}
        <PaymentHistorySection
          historyOpen={historyOpen}
          setHistoryOpen={setHistoryOpen}
          history={history}
          historyLoading={historyLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Payment History Section ─────────────────────────────────────────────────

interface PaymentHistorySectionProps {
  historyOpen: boolean;
  setHistoryOpen: (v: boolean) => void;
  history: ReturnType<typeof usePaymentHistory>["data"];
  historyLoading: boolean;
}

function PaymentHistorySection({
  historyOpen,
  setHistoryOpen,
  history,
  historyLoading,
}: PaymentHistorySectionProps) {
  const colors = useThemeColors();
  const statusMeta = useMemo(() => getStatusMeta(colors), [colors]);

  return (
    <View style={styles.historySection}>
      <TouchableOpacity
        style={[
          styles.historyToggle,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => setHistoryOpen(!historyOpen)}
        activeOpacity={0.8}
      >
        <View style={styles.historyToggleLeft}>
          <Ionicons
            name="receipt-outline"
            size={18}
            color={colors.textSecondary}
          />
          <Text
            style={[styles.historyToggleText, { color: colors.textSecondary }]}
          >
            Lịch sử thanh toán
          </Text>
        </View>
        <Ionicons
          name={historyOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {historyOpen && (
        <View
          style={[
            styles.historyList,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {historyLoading ? (
            <View style={styles.historyLoading}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : !history || history.length === 0 ? (
            <View style={styles.historyEmpty}>
              <Ionicons
                name="receipt-outline"
                size={32}
                color={colors.textDark ?? colors.textMuted}
              />
              <Text
                style={[styles.historyEmptyText, { color: colors.textMuted }]}
              >
                Chưa có giao dịch nào
              </Text>
            </View>
          ) : (
            history.map((order) => {
              const meta = statusMeta[order.status] ?? statusMeta.pending;
              return (
                <View
                  key={order.id}
                  style={[
                    styles.historyItem,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View style={styles.historyItemLeft}>
                    <Text
                      style={[
                        styles.historyItemDate,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {formatDate(order.createdAt)}
                    </Text>
                    <Text
                      style={[
                        styles.historyItemPlan,
                        { color: colors.textMuted },
                      ]}
                    >
                      {PLAN_LABEL[order.subscription?.plan ?? ""] ??
                        (order.amount >= 500_000 ? "Hàng năm" : "Hàng tháng")}
                    </Text>
                  </View>
                  <View style={styles.historyItemRight}>
                    <Text
                      style={[
                        styles.historyItemAmount,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {formatVND(order.amount)}
                    </Text>
                    <View
                      style={[styles.statusBadge, { backgroundColor: meta.bg }]}
                    >
                      <Text
                        style={[styles.statusBadgeText, { color: meta.color }]}
                      >
                        {meta.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
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
    paddingBottom: SPACING.huge,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────

  heroSection: {
    alignItems: "center",
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  diamondGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(167, 139, 250, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.25)",
    elevation: 12,
  },
  diamondGlowRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.1)",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: -0.5,
    marginTop: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.body,
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Active Badge (premium state) ──────────────────────────────────────────

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.xxl,
  },
  activeBadgeText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // ── Subscription Card (premium state) ────────────────────────────────────

  subCard: {
    marginHorizontal: SPACING.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
    padding: SPACING.lg,
    gap: 0,
    marginBottom: 28,
  },
  subCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  subCardDivider: {
    height: 1,
    marginHorizontal: SPACING.xxs,
  },
  subCardIconBg: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(167, 139, 250, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  subCardLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xxs,
  },
  subCardValue: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.2,
  },

  // ── Section Header ────────────────────────────────────────────────────────

  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // ── Feature List ──────────────────────────────────────────────────────────

  featureList: {
    marginHorizontal: SPACING.lg,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
  },
  featureIconBg: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: SPACING.xxs,
  },
  featureTitle: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: -0.1,
  },
  featureDesc: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 17,
  },
  featureCheck: {
    flexShrink: 0,
  },

  // ── Plan Selection ────────────────────────────────────────────────────────

  planRow: {
    flexDirection: "row",
    marginHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  planCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    alignItems: "center",
    gap: SPACING.xs,
    position: "relative",
  },
  planName: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.1,
    marginTop: SPACING.lg,
  },
  planPrice: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: -0.5,
    marginTop: SPACING.s,
  },
  planPeriod: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  planMonthly: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: SPACING.xs,
  },
  savingsBadge: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingVertical: 5,
    alignItems: "center",
  },
  savingsBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.2,
  },
  planSelectedDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.xs,
    marginTop: SPACING.s,
  },

  ctaHint: {
    textAlign: "center",
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.lg,
    lineHeight: 18,
  },

  // ── Cancel Button (premium state) ─────────────────────────────────────────

  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  cancelBtnText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // ── Payment History ───────────────────────────────────────────────────────

  historySection: {
    marginHorizontal: SPACING.lg,
    marginTop: 28,
  },
  historyToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
  },
  historyToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  historyToggleText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },
  historyList: {
    marginTop: SPACING.sm,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  historyLoading: {
    paddingVertical: SPACING.xl,
    alignItems: "center",
  },
  historyEmpty: {
    alignItems: "center",
    paddingVertical: 28,
    gap: SPACING.sm,
  },
  historyEmptyText: {
    fontSize: FONT_SIZE.caption,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  historyItemLeft: {
    gap: 3,
  },
  historyItemDate: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },
  historyItemPlan: {
    fontSize: FONT_SIZE.sm,
  },
  historyItemRight: {
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  historyItemAmount: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.md,
  },
  statusBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
