import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import {
  useTransactions,
  useTransactionSummary,
} from "../src/hooks/use-transactions";
import { useCategories } from "../src/hooks/use-categories";
import {
  formatVND,
  formatRelativeTime,
  getStartOfMonth,
  getEndOfMonth,
} from "../src/utils/format";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
} from "../src/constants/theme";
import { useThemeColors } from "../src/hooks/use-theme-colors";
import { SkeletonBox } from "../src/components/SkeletonBox";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { EmptyState } from "../src/components/EmptyState";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "week" | "month" | "3months" | "year";

type CategoryBreakdown = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
};

type DailyBar = {
  date: string;
  label: string;
  amount: number;
};

type TxItem = {
  id: string;
  categoryId: string;
  note: string | null;
  amount: number;
  type: "income" | "expense";
  date: string;
};

type CategoryInfo = { id: string; name: string; icon: string; color: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
  { key: "3months", label: "3 tháng" },
  { key: "year", label: "Năm nay" },
];

const VN_WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const now = new Date();
  const todayStr = toISO(now);

  switch (period) {
    case "week": {
      const day = now.getDay(); // 0 = Sun, 1 = Mon …
      const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { startDate: toISO(monday), endDate: toISO(sunday) };
    }
    case "month":
      return { startDate: getStartOfMonth(), endDate: getEndOfMonth() };
    case "3months": {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 2);
      start.setDate(1);
      return { startDate: toISO(start), endDate: todayStr };
    }
    case "year":
      return {
        startDate: `${now.getFullYear()}-01-01`,
        endDate: `${now.getFullYear()}-12-31`,
      };
  }
}

function generateDays(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const curr = new Date(start);
  while (curr <= end) {
    days.push(toISO(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return days;
}

function getDayLabel(dateStr: string, useWeekday: boolean): string {
  const d = new Date(dateStr);
  return useWeekday ? VN_WEEKDAYS[d.getDay()] : String(d.getDate());
}

function txDateKey(dateStr: string): string {
  // Handles both "2024-01-15" and "2024-01-15T10:30:00.000Z"
  return dateStr.split("T")[0];
}

// ─── StatsScreen ─────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [period, setPeriod] = useState<Period>("month");
  const [refreshing, setRefreshing] = useState(false);

  const dateRange = useMemo(() => getDateRange(period), [period]);

  // ── Hooks ──────────────────────────────────────────────────────────────────

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useTransactionSummary(dateRange);

  const {
    data: txPage,
    isLoading: txLoading,
    refetch: refetchTx,
  } = useTransactions({ ...dateRange, limit: 100 });

  const {
    data: categories,
    isLoading: catLoading,
    refetch: refetchCats,
  } = useCategories();

  const allTransactions: TxItem[] = useMemo(
    () => txPage?.data ?? [],
    [txPage?.data],
  );

  // ── Derived data ───────────────────────────────────────────────────────────

  const categoryMap = useMemo(() => {
    const map: Record<string, CategoryInfo> = {};
    if (categories) {
      for (const cat of categories) {
        map[cat.id] = cat;
      }
    }
    return map;
  }, [categories]);

  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const totals: Record<string, number> = {};
    for (const tx of allTransactions) {
      if (tx.type === "expense") {
        totals[tx.categoryId] =
          (totals[tx.categoryId] ?? 0) + Math.abs(tx.amount);
      }
    }
    const totalExpense = Object.values(totals).reduce((a, b) => a + b, 0);
    if (totalExpense === 0) return [];

    return Object.entries(totals)
      .map(([categoryId, amount]) => {
        const cat = categoryMap[categoryId];
        return {
          categoryId,
          name: cat?.name ?? "Khác",
          icon: cat?.icon ?? "📌",
          color: cat?.color ?? colors.textMuted,
          amount,
          percentage: (amount / totalExpense) * 100,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [allTransactions, categoryMap, colors]);

  const dailyBars = useMemo((): DailyBar[] => {
    const allDays = generateDays(dateRange.startDate, dateRange.endDate);
    const last14 = allDays.slice(-14);
    const useWeekday = last14.length <= 7;

    const dailyExpense: Record<string, number> = {};
    for (const tx of allTransactions) {
      if (tx.type === "expense") {
        const key = txDateKey(tx.date);
        dailyExpense[key] = (dailyExpense[key] ?? 0) + Math.abs(tx.amount);
      }
    }

    return last14.map((date) => ({
      date,
      label: getDayLabel(date, useWeekday),
      amount: dailyExpense[date] ?? 0,
    }));
  }, [allTransactions, dateRange]);

  const recentTransactions = useMemo((): TxItem[] => {
    return [...allTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [allTransactions]);

  // ── Refresh ────────────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchTx(), refetchCats()]);
    setRefreshing(false);
  }, [refetchSummary, refetchTx, refetchCats]);

  // ── Values ─────────────────────────────────────────────────────────────────

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const net = summary?.net ?? 0;
  const maxDailyAmount = Math.max(...dailyBars.map((b) => b.amount), 1);
  const todayStr = toISO(new Date());
  const dataLoading = txLoading || catLoading;
  const allEmpty = dailyBars.every((b) => b.amount === 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <ScreenHeader title="Thống kê" onBack={() => router.back()} />

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
        {/* ── Period Selector ──────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={[
                styles.periodChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                period === opt.key && {
                  backgroundColor: colors.accentDim,
                  borderColor: colors.accent,
                },
              ]}
              onPress={() => setPeriod(opt.key)}
            >
              <Text
                style={[
                  styles.periodChipText,
                  { color: colors.textSecondary },
                  period === opt.key && {
                    color: colors.accent,
                    fontWeight: FONT_WEIGHT.semibold,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Summary Cards ────────────────────────────────────────── */}
        {summaryLoading ? (
          <>
            <View style={styles.summaryRow}>
              <View style={{ flex: 1 }}>
                <SkeletonBox height={100} borderRadius={RADIUS.xl} />
              </View>
              <View style={{ flex: 1 }}>
                <SkeletonBox height={100} borderRadius={RADIUS.xl} />
              </View>
            </View>
            <SkeletonBox
              height={52}
              borderRadius={RADIUS.xl}
              style={styles.netCardSkeleton}
            />
          </>
        ) : (
          <>
            <View style={styles.summaryRow}>
              {/* Income card */}
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: `${colors.success}30`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.summaryIconWrap,
                    { backgroundColor: `${colors.success}22` },
                  ]}
                >
                  <Ionicons
                    name="trending-up"
                    size={20}
                    color={colors.success}
                  />
                </View>
                <Text
                  style={[styles.summaryLabel, { color: colors.textMuted }]}
                >
                  Thu nhập
                </Text>
                <Text
                  style={[styles.summaryAmount, { color: colors.success }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatVND(totalIncome)}
                </Text>
              </View>

              {/* Expense card */}
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: `${colors.danger}30`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.summaryIconWrap,
                    { backgroundColor: `${colors.danger}22` },
                  ]}
                >
                  <Ionicons
                    name="trending-down"
                    size={20}
                    color={colors.danger}
                  />
                </View>
                <Text
                  style={[styles.summaryLabel, { color: colors.textMuted }]}
                >
                  Chi tiêu
                </Text>
                <Text
                  style={[styles.summaryAmount, { color: colors.danger }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatVND(totalExpense)}
                </Text>
              </View>
            </View>

            {/* Net balance row */}
            <View
              style={[
                styles.netCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.netLeft}>
                <Ionicons
                  name={net >= 0 ? "wallet-outline" : "alert-circle-outline"}
                  size={16}
                  color={net >= 0 ? colors.success : colors.danger}
                />
                <Text
                  style={[styles.netLabel, { color: colors.textSecondary }]}
                >
                  Số dư kỳ này
                </Text>
              </View>
              <Text
                style={[
                  styles.netAmount,
                  { color: net >= 0 ? colors.success : colors.danger },
                ]}
              >
                {net >= 0 ? "+" : ""}
                {formatVND(net)}
              </Text>
            </View>
          </>
        )}

        {/* ── Spending by Category ─────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Chi tiêu theo danh mục
        </Text>

        {dataLoading ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.catRow,
                  i > 0 && styles.catRowBorder,
                  i > 0 && { borderTopColor: colors.borderLight },
                ]}
              >
                <SkeletonBox width={40} height={40} borderRadius={RADIUS.lg} />
                <View style={styles.catInfo}>
                  <View style={styles.catInfoTop}>
                    <SkeletonBox width="42%" height={13} />
                    <SkeletonBox width={64} height={13} />
                  </View>
                  <SkeletonBox height={5} borderRadius={3} />
                  <SkeletonBox width="18%" height={11} />
                </View>
              </View>
            ))}
          </View>
        ) : categoryBreakdown.length === 0 ? (
          <EmptyState
            icon="pie-chart-outline"
            title="Chưa có chi tiêu"
            description="Không có dữ liệu chi tiêu trong kỳ đã chọn"
          />
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {categoryBreakdown.map((cat, index) => (
              <View
                key={cat.categoryId}
                style={[
                  styles.catRow,
                  index > 0 && styles.catRowBorder,
                  index > 0 && { borderTopColor: colors.borderLight },
                ]}
              >
                <View
                  style={[
                    styles.catIconWrap,
                    { backgroundColor: `${cat.color}22` },
                  ]}
                >
                  <Text style={styles.catIconEmoji}>{cat.icon}</Text>
                </View>

                <View style={styles.catInfo}>
                  <View style={styles.catInfoTop}>
                    <Text
                      style={[styles.catName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                    <Text style={[styles.catAmount, { color: colors.danger }]}>
                      {formatVND(cat.amount)}
                    </Text>
                  </View>

                  {/* Horizontal percentage bar */}
                  <View
                    style={[
                      styles.catBarTrack,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.catBarFill,
                        {
                          width:
                            `${Math.max(cat.percentage, 2)}%` as `${number}%`,
                          backgroundColor: cat.color,
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={[styles.catPercent, { color: colors.textMuted }]}
                  >
                    {cat.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Daily Spending Trend ─────────────────────────────────── */}
        <Text
          style={[
            styles.sectionTitle,
            { marginTop: 28, color: colors.textPrimary },
          ]}
        >
          Xu hướng chi tiêu
        </Text>

        {txLoading ? (
          <View
            style={[
              styles.card,
              {
                padding: SPACING.base,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <SkeletonBox height={100} borderRadius={RADIUS.md} />
          </View>
        ) : dailyBars.length === 0 || allEmpty ? (
          <EmptyState
            icon="bar-chart-outline"
            title="Chưa có dữ liệu"
            description="Không có giao dịch trong kỳ đã chọn"
          />
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.trendChart}>
              {dailyBars.map((bar) => {
                const heightFraction = bar.amount / maxDailyAmount;
                const barHeightPx = Math.max(
                  heightFraction * TREND_BAR_MAX_H,
                  bar.amount > 0 ? 5 : 0,
                );
                const isToday = bar.date === todayStr;

                return (
                  <View key={bar.date} style={styles.trendBarWrapper}>
                    {/* Vertical bar, grows from bottom */}
                    <View style={styles.trendBarSpace}>
                      <View
                        style={[
                          styles.trendBar,
                          {
                            height: barHeightPx,
                            backgroundColor: isToday
                              ? colors.accent
                              : `${colors.danger}bb`,
                          },
                        ]}
                      />
                    </View>

                    {/* Day label */}
                    <Text
                      style={[
                        styles.trendLabel,
                        { color: colors.textMuted },
                        isToday && {
                          color: colors.accent,
                          fontWeight: FONT_WEIGHT.bold,
                        },
                      ]}
                    >
                      {bar.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Recent Transactions ──────────────────────────────────── */}
        <Text
          style={[
            styles.sectionTitle,
            { marginTop: 28, color: colors.textPrimary },
          ]}
        >
          Giao dịch gần đây
        </Text>

        {txLoading ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.txRow,
                  i > 0 && styles.txRowBorder,
                  i > 0 && { borderBottomColor: colors.borderLight },
                ]}
              >
                <SkeletonBox width={44} height={44} borderRadius={14} />
                <View style={styles.txInfoSkeleton}>
                  <SkeletonBox width="52%" height={14} />
                  <SkeletonBox width="32%" height={11} />
                </View>
                <SkeletonBox width={72} height={14} />
              </View>
            ))}
          </View>
        ) : recentTransactions.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Chưa có giao dịch"
            description="Không có giao dịch trong kỳ đã chọn"
          />
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {recentTransactions.map((tx, index) => {
              const cat = categoryMap[tx.categoryId];
              const isLast = index === recentTransactions.length - 1;
              return (
                <View
                  key={tx.id}
                  style={[
                    styles.txRow,
                    !isLast && styles.txRowBorder,
                    !isLast && { borderBottomColor: colors.borderLight },
                  ]}
                >
                  <View
                    style={[
                      styles.txIconWrap,
                      {
                        backgroundColor: cat ? `${cat.color}22` : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.txIconEmoji}>
                      {cat?.icon ?? (tx.type === "income" ? "💰" : "💸")}
                    </Text>
                  </View>

                  <View style={styles.txInfo}>
                    <Text
                      style={[styles.txTitle, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {tx.note ??
                        cat?.name ??
                        (tx.type === "income" ? "Thu nhập" : "Chi tiêu")}
                    </Text>
                    <Text style={[styles.txDate, { color: colors.textMuted }]}>
                      {formatRelativeTime(tx.date)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.txAmount,
                      {
                        color:
                          tx.type === "income" ? colors.success : colors.danger,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatVND(Math.abs(tx.amount))}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Layout constant ─────────────────────────────────────────────────────────

const TREND_BAR_MAX_H = 96; // px, matches trendBarSpace height

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },

  // ── Period selector ──────────────────────────────────────────────────────────
  periodRow: {
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.xxs,
  },
  periodChip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
  },
  periodChipText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Summary ──────────────────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    gap: 5,
  },
  summaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xxs,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  summaryAmount: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.bold,
  },

  // ── Net ──────────────────────────────────────────────────────────────────────
  netCardSkeleton: {
    marginBottom: 28,
  },
  netCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: RADIUS.xl,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 28,
  },
  netLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
  },
  netLabel: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.medium,
  },
  netAmount: {
    fontSize: 17,
    fontWeight: FONT_WEIGHT.bold,
  },

  // ── Section title ─────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
  },

  // ── Card shell ────────────────────────────────────────────────────────────────
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: "hidden",
  },

  // ── Category breakdown ────────────────────────────────────────────────────────
  catRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: SPACING.md,
  },
  catRowBorder: {
    borderTopWidth: 1,
  },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  catIconEmoji: {
    fontSize: FONT_SIZE.lg,
  },
  catInfo: {
    flex: 1,
    gap: 5,
  },
  catInfoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catName: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
    flex: 1,
    marginRight: SPACING.sm,
  },
  catAmount: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
    flexShrink: 0,
  },
  catBarTrack: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  catBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  catPercent: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Trend chart ───────────────────────────────────────────────────────────────
  trendChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.md,
    gap: 3,
  },
  trendBarWrapper: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  trendBarSpace: {
    height: TREND_BAR_MAX_H,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  trendBar: {
    width: "65%",
    maxWidth: 18,
    borderRadius: RADIUS.xs,
  },
  trendLabel: {
    fontSize: FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Transactions ──────────────────────────────────────────────────────────────
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    gap: SPACING.md,
  },
  txRowBorder: {
    borderBottomWidth: 1,
  },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  txIconEmoji: {
    fontSize: FONT_SIZE.xl,
  },
  txInfo: {
    flex: 1,
    gap: 3,
  },
  txInfoSkeleton: {
    flex: 1,
    gap: 7,
  },
  txTitle: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },
  txDate: {
    fontSize: FONT_SIZE.sm,
  },
  txAmount: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.bold,
    flexShrink: 0,
    maxWidth: 110,
  },
});
