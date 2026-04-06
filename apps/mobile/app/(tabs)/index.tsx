import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { shadow } from '../../src/utils/shadow';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useRouter } from 'expo-router';

import { useAuthStore } from '../../src/stores/auth-store';
import { useWallets } from '../../src/hooks/use-wallets';
import {
  useTransactions,
  useTransactionSummary,
} from '../../src/hooks/use-transactions';
import { useCurrentSavingPlan } from '../../src/hooks/use-saving-plan';
import { useUnreadAlertCount } from '../../src/hooks/use-alerts';
import { useCategories } from '../../src/hooks/use-categories';
import { usePet } from '../../src/hooks/use-gamification';
import {
  formatVND,
  formatVNDSigned,
  formatRelativeTime,
  getStartOfMonth,
  getEndOfMonth,
} from '../../src/utils/format';
import { useThemeColors } from '../../src/hooks/use-theme-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, HIT_SLOP } from '../../src/constants/theme';
import { SkeletonBox } from '../../src/components/SkeletonBox';
import { resolveIcon } from '../../src/utils/icons';

// ─── Minimal inline types to avoid workspace resolution issues ────────────────

type CategoryInfo = { id: string; name: string; icon: string; color: string };

type TxItem = {
  id: string;
  categoryId: string;
  note: string | null;
  amount: number;
  type: 'income' | 'expense';
  date: string;
};

// ─── Module-level date constants (stable for the entire session) ─────────────

const MONTH_START = getStartOfMonth();
const MONTH_END = getEndOfMonth();

// ─── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const colors = useThemeColors();

  // ── Quick-action config (uses theme colors) ────────────────────────────────

  const QUICK_ACTIONS = useMemo(
    () => [
      {
        icon: 'add-circle-outline' as const,
        label: 'Thu nhập',
        color: colors.success,
        route: '/add-transaction?type=income',
      },
      {
        icon: 'remove-circle-outline' as const,
        label: 'Chi tiêu',
        color: colors.danger,
        route: '/add-transaction?type=expense',
      },
      {
        icon: 'wallet-outline' as const,
        label: 'Ví',
        color: colors.info,
        route: '/wallets',
      },
      {
        icon: 'pie-chart-outline' as const,
        label: 'Thống kê',
        color: colors.warning,
        route: '/stats',
      },
    ],
    [colors]
  );

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: wallets,
    isLoading: walletsLoading,
    refetch: refetchWallets,
  } = useWallets();

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useTransactionSummary({ startDate: MONTH_START, endDate: MONTH_END });

  const {
    data: transactionsPage,
    isLoading: txLoading,
    refetch: refetchTx,
  } = useTransactions({ limit: 5 });

  const {
    data: savingPlan,
    isLoading: savingLoading,
    refetch: refetchSaving,
  } = useCurrentSavingPlan();

  const { data: alertData, refetch: refetchAlerts } = useUnreadAlertCount();

  const { data: categories, refetch: refetchCategories } = useCategories();

  const { data: pet } = usePet();

  // ── Derived values ─────────────────────────────────────────────────────────

  const totalBalance = useMemo(
    () => (wallets ?? []).reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  );

  const categoryMap = useMemo(() => {
    const map: Record<string, CategoryInfo> = {};
    if (categories) {
      for (const cat of categories) {
        map[cat.id] = cat;
      }
    }
    return map;
  }, [categories]);

  const recentTransactions: TxItem[] = transactionsPage?.data?.slice(0, 5) ?? [];
  const unreadCount = alertData ?? 0;

  // ── Pull-to-refresh ────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchWallets(),
      refetchSummary(),
      refetchTx(),
      refetchSaving(),
      refetchAlerts(),
      refetchCategories(),
    ]);
    setRefreshing(false);
  }, [
    refetchWallets,
    refetchSummary,
    refetchTx,
    refetchSaving,
    refetchAlerts,
    refetchCategories,
  ]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>Xin chào</Text>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {user?.displayName ?? 'FinGenie User'}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.notifBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.push('/alerts' as never)}
            hitSlop={HIT_SLOP.sm}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.textSecondary}
            />
            {unreadCount > 0 && (
              <View style={[styles.badge, { borderColor: colors.background }]}>
                <Text style={[styles.badgeText, { color: colors.textPrimary }]} numberOfLines={1}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Balance Card ──────────────────────────────────────────── */}
        <View style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.balanceGlow, { backgroundColor: colors.accentDim }]} />
          <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Tổng số dư</Text>

          {walletsLoading ? (
            <>
              <SkeletonBox
                width="55%"
                height={42}
                borderRadius={10}
                style={{ marginBottom: SPACING.lg }}
              />
              <View style={styles.balanceRow}>
                <View style={styles.balanceStat}>
                  <SkeletonBox width={16} height={16} borderRadius={RADIUS.md} />
                  <SkeletonBox width={80} height={14} />
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.balanceStat}>
                  <SkeletonBox width={16} height={16} borderRadius={RADIUS.md} />
                  <SkeletonBox width={80} height={14} />
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.balanceAmount, { color: colors.textPrimary }]}>{formatVND(totalBalance)}</Text>
              <View style={styles.balanceRow}>
                <View style={styles.balanceStat}>
                  <Ionicons
                    name="trending-up"
                    size={16}
                    color={colors.success}
                  />
                  {summaryLoading ? (
                    <SkeletonBox width={72} height={14} />
                  ) : (
                    <Text
                      style={[
                        styles.balanceStatText,
                        { color: colors.success },
                      ]}
                    >
                      +{formatVND(summary?.totalIncome ?? 0)}
                    </Text>
                  )}
                  <Text style={[styles.balanceStatLabel, { color: colors.textDark }]}>Thu nhập</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.balanceStat}>
                  <Ionicons
                    name="trending-down"
                    size={16}
                    color={colors.danger}
                  />
                  {summaryLoading ? (
                    <SkeletonBox width={72} height={14} />
                  ) : (
                    <Text
                      style={[styles.balanceStatText, { color: colors.danger }]}
                    >
                      -{formatVND(summary?.totalExpense ?? 0)}
                    </Text>
                  )}
                  <Text style={[styles.balanceStatLabel, { color: colors.textDark }]}>Chi tiêu</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── Quick Actions ──────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Thao tác nhanh</Text>
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [
                styles.actionItem,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => router.push(action.route as never)}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${action.color}20` },
                ]}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Pet Mini Card ─────────────────────────────────────────── */}
        {(() => {
          // Pet data from API
          const petLevel = pet?.level ?? 1;
          const petXp = pet?.xp ?? 0;
          const petXpForNext = petLevel * 100;
          const petHealth = pet?.hunger ?? 80;
          const petHappiness = pet?.happiness ?? 80;

          const petStage =
            petLevel >= 11 ? 'Rồng' : petLevel >= 6 ? 'Mèo' : petLevel >= 3 ? 'Mèo con' : 'Trứng';
          const petEmoji =
            petLevel >= 11 ? '🐉' : petLevel >= 6 ? '🐱' : petLevel >= 3 ? '🐾' : '🥚';

          const petColor = (() => {
            if (petHealth > 70 && petHappiness > 70) return '#22c55e';
            if (petHealth > 40 && petHappiness > 40) return '#eab308';
            return '#ef4444';
          })();

          const hpWidth = `${Math.round(petHealth)}%` as const;
          const xpWidth = `${Math.min(100, Math.round((petXp / petXpForNext) * 100))}%` as const;

          return (
            <Pressable
              style={({ pressed }) => [
                styles.petMiniCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.88 },
              ]}
              onPress={() => router.push('/pet' as never)}
            >
              {/* Glow */}
              <View style={[styles.petMiniGlow, { backgroundColor: `${petColor}12` }]} />

              {/* Left: emoji */}
              <View style={[styles.petMiniCircle, { borderColor: petColor, backgroundColor: colors.background }, shadow(petColor, 0, 0, 0.6, 10, 8)]}>
                <Text style={styles.petMiniEmoji}>{petEmoji}</Text>
              </View>

              {/* Middle: info */}
              <View style={styles.petMiniInfo}>
                <View style={styles.petMiniTitleRow}>
                  <Text style={[styles.petMiniName, { color: colors.textPrimary }]}>{petStage}</Text>
                  <View style={[styles.petMiniLvBadge, { borderColor: `${petColor}70`, backgroundColor: `${petColor}18` }]}>
                    <Text style={[styles.petMiniLvText, { color: petColor }]}>Lv.{petLevel}</Text>
                  </View>
                </View>
                {/* HP bar */}
                <View style={styles.petMiniBarRow}>
                  <Text style={styles.petMiniBarLabel}>❤️</Text>
                  <View style={[styles.petMiniBarTrack, { backgroundColor: colors.inactive }]}>
                    <View style={[styles.petMiniBarFill, { width: hpWidth, backgroundColor: colors.success }]} />
                  </View>
                </View>
                {/* XP bar */}
                <View style={styles.petMiniBarRow}>
                  <Text style={styles.petMiniBarLabel}>⚡</Text>
                  <View style={[styles.petMiniBarTrack, { backgroundColor: colors.inactive }]}>
                    <View style={[styles.petMiniBarFill, { width: xpWidth, backgroundColor: colors.info }]} />
                  </View>
                </View>
              </View>

              {/* Right: arrow */}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          );
        })()}

        {/* ── Recent Transactions ────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Giao dịch gần đây</Text>
          <Pressable
            onPress={() => router.push('/transactions' as never)}
            hitSlop={HIT_SLOP.sm}
          >
            <Text style={[styles.seeAll, { color: colors.accent }]}>Xem tất cả</Text>
          </Pressable>
        </View>

        {txLoading ? (
          <View style={[styles.transactionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.txItem,
                  i < 2 && styles.txItemBorder,
                  i < 2 && { borderBottomColor: colors.borderLight },
                ]}
              >
                <SkeletonBox width={44} height={44} borderRadius={14} />
                <View style={styles.txSkeletonInfo}>
                  <SkeletonBox width="55%" height={14} />
                  <SkeletonBox width="35%" height={12} />
                </View>
                <SkeletonBox width={76} height={14} />
              </View>
            ))}
          </View>
        ) : recentTransactions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons
              name="receipt-outline"
              size={40}
              color={colors.inactive}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có giao dịch nào</Text>
            <Text style={[styles.emptySubtext, { color: colors.textDark }]}>
              Bắt đầu thêm giao dịch để theo dõi chi tiêu
            </Text>
          </View>
        ) : (
          <View style={[styles.transactionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {recentTransactions.map((tx, index) => {
              const category = categoryMap[tx.categoryId];
              const isLast = index === recentTransactions.length - 1;
              return (
                <Pressable
                  key={tx.id}
                  style={({ pressed }) => [
                    styles.txItem,
                    !isLast && styles.txItemBorder,
                    !isLast && { borderBottomColor: colors.borderLight },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() =>
                    router.push(`/add-transaction?id=${tx.id}&type=${tx.type}` as never)
                  }
                >
                  {/* Category icon */}
                  <View
                    style={[
                      styles.txIcon,
                      {
                        backgroundColor: category
                          ? `${category.color}20`
                          : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={resolveIcon(category?.icon ?? (tx.type === 'income' ? 'income' : 'expense')) as ComponentProps<typeof Ionicons>['name']}
                      size={22}
                      color={category?.color ?? colors.textMuted}
                    />
                  </View>

                  {/* Info */}
                  <View style={styles.txInfo}>
                    <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {tx.note ??
                        category?.name ??
                        (tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu')}
                    </Text>
                    <Text style={[styles.txTime, { color: colors.textMuted }]}>
                      {formatRelativeTime(tx.date)}
                    </Text>
                  </View>

                  {/* Amount */}
                  <Text
                    style={[
                      styles.txAmount,
                      {
                        color:
                          tx.type === 'income'
                            ? colors.success
                            : colors.danger,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {formatVNDSigned(tx.amount, tx.type)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Saving Goal Card ───────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: 28, color: colors.textPrimary }]}>
          Mục tiêu tiết kiệm
        </Text>

        {savingLoading ? (
          <View style={[styles.savingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.savingHeader}>
              <SkeletonBox width={20} height={20} borderRadius={10} />
              <SkeletonBox width="45%" height={16} />
            </View>
            <SkeletonBox
              width="70%"
              height={14}
              style={{ marginBottom: SPACING.md }}
            />
            <View style={styles.savingStats}>
              <View style={styles.savingStat}>
                <SkeletonBox width="60%" height={12} style={{ marginBottom: SPACING.s }} />
                <SkeletonBox width="80%" height={18} />
              </View>
              <View style={[styles.savingDivider, { backgroundColor: colors.border }]} />
              <View style={styles.savingStat}>
                <SkeletonBox width="60%" height={12} style={{ marginBottom: SPACING.s }} />
                <SkeletonBox width="50%" height={18} />
              </View>
            </View>
            <SkeletonBox height={8} borderRadius={RADIUS.xs} style={{ marginTop: SPACING.base }} />
          </View>
        ) : savingPlan ? (
          <View style={[styles.savingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.savingHeader}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={[styles.savingTitle, { color: colors.textPrimary }]}>Kế hoạch tiết kiệm</Text>
            </View>

            <View style={styles.savingStats}>
              <View style={styles.savingStat}>
                <Text style={[styles.savingStatLabel, { color: colors.textMuted }]}>
                  Ngân sách hàng ngày
                </Text>
                <Text style={[styles.savingStatValue, { color: colors.textPrimary }]}>
                  {formatVND(savingPlan.dailyBudget)}
                </Text>
              </View>
              <View style={[styles.savingDivider, { backgroundColor: colors.border }]} />
              <View style={styles.savingStat}>
                <Text style={[styles.savingStatLabel, { color: colors.textMuted }]}>Mục tiêu tiết kiệm</Text>
                <Text
                  style={[styles.savingStatValue, { color: colors.success }]}
                >
                  {savingPlan.savingPercent}%
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      Math.max(savingPlan.savingPercent, 0),
                      100
                    )}%`,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            </View>

            <Text style={[styles.savingCaption, { color: colors.textMuted }]}>
              Số tiền an toàn:{' '}
              <Text style={{ color: colors.accent }}>
                {formatVND(savingPlan.safeMoney)}
              </Text>
            </Text>
          </View>
        ) : (
          <View style={[styles.savingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.savingHeader}>
              <Ionicons
                name="flag-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={[styles.savingTitle, { color: colors.textPrimary }]}>Thiết lập mục tiêu</Text>
            </View>
            <Text style={[styles.savingDesc, { color: colors.textMuted }]}>
              Tạo kế hoạch tiết kiệm thông minh với AI Coach
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.savingBtn,
                { backgroundColor: colors.accent },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => router.push('/saving-plan' as never)}
            >
              <Text style={[styles.savingBtnText, { color: colors.background }]}>Bắt đầu ngay</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.background} />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  headerText: {
    flex: 1,
    marginRight: SPACING.md,
  },
  greeting: {
    fontSize: FONT_SIZE.body2,
    marginBottom: SPACING.xxs,
  },
  name: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
    borderWidth: 1.5,
  },
  badgeText: {
    fontSize: FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: 13,
  },

  // ── Balance Card ──────────────────────────────────────────────────────────
  balanceCard: {
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    marginBottom: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  balanceGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  balanceLabel: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.s,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: -1,
    marginBottom: SPACING.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    flexWrap: 'wrap',
  },
  balanceStatText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },
  balanceStatLabel: {
    fontSize: FONT_SIZE.sm,
  },
  divider: {
    width: 1,
    height: 28,
    marginHorizontal: SPACING.md,
  },

  // ── Quick Actions ─────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  actionItem: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Section header ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
  },
  seeAll: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Transactions ──────────────────────────────────────────────────────────
  transactionsCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    gap: SPACING.md,
  },
  txItemBorder: {
    borderBottomWidth: 1,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txIconEmoji: {
    fontSize: FONT_SIZE.xl,
  },
  txInfo: {
    flex: 1,
    gap: 3,
  },
  txTitle: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },
  txTime: {
    fontSize: FONT_SIZE.sm,
  },
  txAmount: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.bold,
    flexShrink: 0,
    maxWidth: 110,
  },
  txSkeletonInfo: {
    flex: 1,
    gap: SPACING.s,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyCard: {
    borderRadius: RADIUS.xl,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.caption,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Saving card ───────────────────────────────────────────────────────────
  savingCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  savingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  savingTitle: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
  },
  savingDesc: {
    fontSize: FONT_SIZE.caption,
    lineHeight: 20,
    marginBottom: SPACING.base,
  },
  savingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  savingStat: {
    flex: 1,
    gap: SPACING.xs,
  },
  savingDivider: {
    width: 1,
    height: 36,
    marginHorizontal: SPACING.base,
  },
  savingStatLabel: {
    fontSize: FONT_SIZE.sm,
  },
  savingStatValue: {
    fontSize: 17,
    fontWeight: FONT_WEIGHT.bold,
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.xs,
  },
  savingCaption: {
    fontSize: FONT_SIZE.caption,
  },
  savingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  savingBtnText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // ── Pet Mini Card ─────────────────────────────────────────────────────────
  petMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 28,
    overflow: 'hidden',
  },
  petMiniGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  petMiniCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    // shadow applied inline via shadow() + dynamic color
    flexShrink: 0,
  },
  petMiniEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  petMiniInfo: {
    flex: 1,
    gap: 5,
  },
  petMiniTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xxs,
  },
  petMiniName: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.bold,
  },
  petMiniLvBadge: {
    paddingHorizontal: 7,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  petMiniLvText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  petMiniBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  petMiniBarLabel: {
    fontSize: FONT_SIZE.xxs,
    lineHeight: 13,
    width: 14,
  },
  petMiniBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  petMiniBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
