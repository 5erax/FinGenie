import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useWallet, useDeleteWallet } from "../src/hooks/use-wallets";
import { useTransactions } from "../src/hooks/use-transactions";
import { formatVND, formatRelativeTime } from "../src/utils/format";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
} from "../src/constants/theme";
import { useThemeColors } from "../src/hooks/use-theme-colors";
import { WALLET_TYPE_CONFIG } from "../src/constants/wallet-types";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PrimaryButton } from "../src/components/PrimaryButton";

// Infer Transaction type from hook
type Transaction = NonNullable<
  ReturnType<typeof useTransactions>["data"]
>["data"][number];

export default function WalletDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const walletId = Array.isArray(id) ? id[0] : id;
  const colors = useThemeColors();

  const {
    data: wallet,
    isLoading,
    refetch,
    isFetching,
  } = useWallet(walletId ?? "");

  const { data: transactionsData, isLoading: isLoadingTx } = useTransactions({
    walletId: walletId,
    limit: 10,
  });

  const { mutateAsync: deleteWallet, isPending: isDeleting } =
    useDeleteWallet();

  const transactions = transactionsData?.data ?? [];
  const walletName = wallet?.name ?? "Chi tiết ví";

  // Redirect back if no wallet ID provided
  useEffect(() => {
    if (!walletId) {
      router.back();
    }
  }, [walletId, router]);

  const handleDelete = () => {
    if (!wallet) return;
    Alert.alert(
      "Xoá ví",
      `Bạn có chắc muốn xoá ví "${wallet.name}"?\n\nMọi giao dịch liên quan sẽ bị ảnh hưởng. Hành động này không thể hoàn tác.`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá ví",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWallet(walletId);
              router.back();
            } catch {
              Alert.alert("Lỗi", "Không thể xoá ví. Vui lòng thử lại.");
            }
          },
        },
      ],
    );
  };

  // ── Loading State ───────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScreenHeader title={walletName} />
        <View style={styles.centeredBox}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={[styles.centeredText, { color: colors.textMuted }]}>
            Đang tải thông tin ví...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Not Found State ─────────────────────────────────────
  if (!wallet) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScreenHeader title={walletName} />
        <View style={styles.centeredBox}>
          <View
            style={[
              styles.notFoundIcon,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="wallet-outline" size={40} color={colors.inactive} />
          </View>
          <Text style={[styles.centeredTitle, { color: colors.textSecondary }]}>
            Không tìm thấy ví
          </Text>
          <Text style={[styles.centeredText, { color: colors.textMuted }]}>
            Ví này có thể đã bị xoá hoặc không tồn tại.
          </Text>
          <Pressable
            style={[
              styles.goBackBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={16} color={colors.textPrimary} />
            <Text style={[styles.goBackText, { color: colors.textPrimary }]}>
              Quay lại
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = WALLET_TYPE_CONFIG[wallet.type] ?? WALLET_TYPE_CONFIG.other;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader
        title={wallet?.name ?? "Chi tiết ví"}
        rightElement={
          <Pressable
            style={[
              styles.editBtn,
              {
                backgroundColor: colors.accentDim,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: "/add-wallet",
                params: { id: walletId },
              })
            }
          >
            <Ionicons name="create-outline" size={20} color={colors.accent} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* ── Wallet Info Card ── */}
        <View
          style={[
            styles.walletCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[styles.walletGlow, { backgroundColor: colors.accentDim }]}
          />

          {/* Icon + type badge */}
          <View style={styles.walletCardTop}>
            <View
              style={[
                styles.walletIconBig,
                { backgroundColor: `${cfg.color}20` },
              ]}
            >
              <Ionicons name={cfg.icon} size={34} color={cfg.color} />
            </View>
            <View
              style={[styles.typeBadge, { backgroundColor: `${cfg.color}18` }]}
            >
              <Ionicons
                name={cfg.icon}
                size={12}
                color={cfg.color}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.typeBadgeText, { color: cfg.color }]}>
                {cfg.label}
              </Text>
            </View>
          </View>

          {/* Name */}
          <Text style={[styles.walletCardName, { color: colors.textPrimary }]}>
            {wallet.name}
          </Text>

          {/* Balance */}
          <Text
            style={[styles.walletBalanceLabel, { color: colors.textMuted }]}
          >
            Số dư hiện tại
          </Text>
          <Text style={[styles.walletBalance, { color: colors.textPrimary }]}>
            {formatVND(wallet.balance)}
          </Text>

          {/* Meta row */}
          <View style={styles.walletMetaRow}>
            <View style={styles.walletMetaItem}>
              <Ionicons
                name="globe-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text
                style={[styles.walletMetaText, { color: colors.textMuted }]}
              >
                Đơn vị: {wallet.currency}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Recent Transactions ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Giao dịch gần đây
          </Text>
          {transactions.length > 0 && (
            <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
              {transactions.length} mục
            </Text>
          )}
        </View>

        {isLoadingTx ? (
          <View style={styles.txLoading}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text
              style={[styles.txLoadingText, { color: colors.textSecondary }]}
            >
              Đang tải giao dịch...
            </Text>
          </View>
        ) : transactions.length === 0 ? (
          <View
            style={[
              styles.emptyTx,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={38}
              color={colors.inactive}
            />
            <Text
              style={[styles.emptyTxTitle, { color: colors.textSecondary }]}
            >
              Chưa có giao dịch
            </Text>
            <Text style={[styles.emptyTxDesc, { color: colors.textMuted }]}>
              Ví này chưa có giao dịch nào
            </Text>
          </View>
        ) : (
          transactions.map((tx: Transaction) => {
            const isIncome = tx.type === "income";
            return (
              <View
                key={tx.id}
                style={[
                  styles.txItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.txIconWrap,
                    {
                      backgroundColor: isIncome
                        ? `${colors.success}18`
                        : `${colors.danger}18`,
                    },
                  ]}
                >
                  <Ionicons
                    name={isIncome ? "arrow-down-outline" : "arrow-up-outline"}
                    size={18}
                    color={isIncome ? colors.success : colors.danger}
                  />
                </View>

                <View style={styles.txBody}>
                  <Text
                    style={[styles.txNote, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {tx.note ?? (isIncome ? "Thu nhập" : "Chi tiêu")}
                  </Text>
                  <Text style={[styles.txDate, { color: colors.textMuted }]}>
                    {formatRelativeTime(tx.date)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.txAmount,
                    { color: isIncome ? colors.success : colors.danger },
                  ]}
                >
                  {isIncome ? "+" : "-"}
                  {formatVND(Math.abs(tx.amount))}
                </Text>
              </View>
            );
          })
        )}

        {/* ── Delete Button ── */}
        <PrimaryButton
          title="Xoá ví này"
          onPress={handleDelete}
          loading={isDeleting}
          disabled={isDeleting}
          icon="trash-outline"
          variant="danger"
          style={{ marginTop: SPACING.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header Actions ───────────────────────────────────
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Centered States ──────────────────────────────────
  centeredBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xxxl,
    gap: 10,
  },
  centeredTitle: {
    fontSize: 17,
    fontWeight: FONT_WEIGHT.semibold,
  },
  centeredText: {
    fontSize: FONT_SIZE.body2,
    textAlign: "center",
  },
  notFoundIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  goBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 11,
    marginTop: SPACING.s,
  },
  goBackText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // ── Scroll ──────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.huge,
  },

  // ── Wallet Card ──────────────────────────────────────
  walletCard: {
    borderRadius: 22,
    padding: SPACING.xl,
    marginTop: SPACING.sm,
    marginBottom: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  walletGlow: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  walletCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  walletIconBig: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.xxl,
  },
  typeBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  walletCardName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    marginBottom: 18,
    letterSpacing: -0.3,
  },
  walletBalanceLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xs,
  },
  walletBalance: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  walletMetaRow: {
    flexDirection: "row",
    gap: SPACING.base,
    flexWrap: "wrap",
  },
  walletMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  walletMetaText: {
    fontSize: FONT_SIZE.sm,
  },

  // ── Section ──────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
  },
  sectionCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Transactions ─────────────────────────────────────
  txLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 10,
  },
  txLoadingText: {
    fontSize: FONT_SIZE.body2,
  },
  emptyTx: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: SPACING.lg,
    gap: 7,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  emptyTxTitle: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: SPACING.s,
  },
  emptyTxDesc: {
    fontSize: FONT_SIZE.caption,
    textAlign: "center",
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  txIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  txBody: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  txNote: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: 3,
  },
  txDate: {
    fontSize: FONT_SIZE.sm,
  },
  txAmount: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.bold,
    flexShrink: 0,
  },
});
