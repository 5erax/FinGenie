import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useWallets, useDeleteWallet } from "../src/hooks/use-wallets";
import { formatVND } from "../src/utils/format";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
} from "../src/constants/theme";
import { useThemeColors } from "../src/hooks/use-theme-colors";
import { WALLET_TYPE_CONFIG } from "../src/constants/wallet-types";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { EmptyState } from "../src/components/EmptyState";
// Wallet type inferred from hook return value
type Wallet = NonNullable<ReturnType<typeof useWallets>["data"]>[number];

export default function WalletsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { data: wallets, isLoading, refetch, isFetching } = useWallets();
  const { mutateAsync: deleteWallet } = useDeleteWallet();

  const totalBalance =
    wallets?.reduce((sum: number, w: Wallet) => sum + w.balance, 0) ?? 0;

  const confirmDelete = (wallet: Wallet) => {
    Alert.alert(
      "Xoá ví",
      `Bạn có chắc muốn xoá ví "${wallet.name}"?\nHành động này không thể hoàn tác.`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWallet(wallet.id);
            } catch {
              Alert.alert("Lỗi", "Không thể xoá ví. Vui lòng thử lại.");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader title="Ví của tôi" />

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
        {/* Total Balance Card */}
        <View
          style={[
            styles.balanceCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.balanceGlow, { backgroundColor: colors.accentDim }]}
          />
          <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>
            Tổng số dư
          </Text>
          <Text style={[styles.balanceAmount, { color: colors.textPrimary }]}>
            {formatVND(totalBalance)}
          </Text>
          <View style={styles.balanceMeta}>
            <Ionicons
              name="wallet-outline"
              size={14}
              color={colors.textMuted}
            />
            <Text style={[styles.balanceMetaText, { color: colors.textMuted }]}>
              {wallets?.length ?? 0} ví đang hoạt động
            </Text>
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.centeredBox}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Đang tải ví...
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && (!wallets || wallets.length === 0) && (
          <EmptyState
            icon="wallet-outline"
            title="Chưa có ví nào"
            description="Nhấn nút + để thêm ví đầu tiên"
            actionLabel="Thêm ví"
            actionIcon="add-circle-outline"
            onAction={() => router.push("/add-wallet")}
          />
        )}

        {/* Wallet List */}
        {!isLoading && wallets && wallets.length > 0 && (
          <>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Danh sách ví
            </Text>
            {wallets.map((wallet: Wallet) => {
              const cfg =
                WALLET_TYPE_CONFIG[wallet.type] ?? WALLET_TYPE_CONFIG.other;
              return (
                <Pressable
                  key={wallet.id}
                  style={({ pressed }) => [
                    styles.walletCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    pressed && styles.walletCardPressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/wallet-detail",
                      params: { id: wallet.id },
                    })
                  }
                  onLongPress={() => confirmDelete(wallet)}
                  delayLongPress={500}
                  accessibilityLabel={`Ví ${wallet.name}, Số dư ${formatVND(wallet.balance)}`}
                >
                  <View
                    style={[
                      styles.walletIconWrap,
                      { backgroundColor: `${cfg.color}18` },
                    ]}
                  >
                    <Ionicons name={cfg.icon} size={24} color={cfg.color} />
                  </View>

                  <View style={styles.walletMeta}>
                    <Text
                      style={[styles.walletName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {wallet.name}
                    </Text>
                    <Text
                      style={[styles.walletType, { color: colors.textMuted }]}
                    >
                      {cfg.label}
                    </Text>
                  </View>

                  <View style={styles.walletAmountBox}>
                    <Text
                      style={[
                        styles.walletBalance,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {formatVND(wallet.balance)}
                    </Text>
                    <Text
                      style={[
                        styles.walletCurrency,
                        { color: colors.textMuted },
                      ]}
                    >
                      {wallet.currency}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textMuted}
                  />
                </Pressable>
              );
            })}
            <Text style={[styles.hintText, { color: colors.textDark }]}>
              Nhấn giữ vào ví để xoá
            </Text>
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.accent, shadowColor: colors.accent },
          pressed && styles.fabPressed,
        ]}
        onPress={() => router.push("/add-wallet")}
      >
        <Ionicons name="add" size={30} color={colors.background} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Scroll ──────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 110,
  },

  // ── Balance Card ────────────────────────────────────
  balanceCard: {
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  balanceGlow: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  balanceLabel: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.s,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  balanceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
  },
  balanceMetaText: {
    fontSize: FONT_SIZE.sm,
  },

  // ── Loading ───────────────────────────────────────────
  centeredBox: {
    alignItems: "center",
    paddingVertical: 56,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.body2,
  },

  // ── Section ──────────────────────────────────────────
  sectionTitle: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Wallet Card ──────────────────────────────────────
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: 10,
    borderWidth: 1,
  },
  walletCardPressed: {
    opacity: 0.65,
  },
  walletIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    flexShrink: 0,
  },
  walletMeta: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  walletName: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 3,
  },
  walletType: {
    fontSize: FONT_SIZE.sm,
  },
  walletAmountBox: {
    alignItems: "flex-end",
    marginRight: SPACING.sm,
  },
  walletBalance: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xxs,
  },
  walletCurrency: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  hintText: {
    textAlign: "center",
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.s,
  },

  // ── FAB ──────────────────────────────────────────────
  fab: {
    position: "absolute",
    bottom: SPACING.xxl,
    right: SPACING.xl,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: `0px 6px 14px rgba(167, 139, 250, 0.45)` },
      default: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
    }),
    elevation: 10,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
});
