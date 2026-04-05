import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';

import {
  useTransactions,
  useTransactionSummary,
  useDeleteTransaction,
} from '../../src/hooks/use-transactions';
import { useCategories } from '../../src/hooks/use-categories';
import {
  formatVND,
  formatVNDSigned,
  formatRelativeTime,
  formatDate,
  getStartOfMonth,
  getEndOfMonth,
} from '../../src/utils/format';
import { useThemeColors } from '../../src/hooks/use-theme-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, HIT_SLOP } from '../../src/constants/theme';
import { resolveIcon } from '../../src/utils/icons';
import { SkeletonBox } from '../../src/components/SkeletonBox';
import { EmptyState } from '../../src/components/EmptyState';

// ─── Local Types ────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  note: string | null;
  date: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

type FilterType = 'all' | 'income' | 'expense';

type ListItem =
  | { kind: 'header'; dateKey: string; label: string }
  | { kind: 'transaction'; transaction: Transaction };

// ─── Constants ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'income', label: 'Thu nhập' },
  { key: 'expense', label: 'Chi tiêu' },
];

const PAGE_SIZE = 20;

// ─── Sub-components ──────────────────────────────────────────────────────────

function TransactionSkeleton() {
  return (
    <View style={styles.txItem}>
      <SkeletonBox width={44} height={44} borderRadius={14} />
      <View style={{ flex: 1, gap: SPACING.sm, marginLeft: SPACING.md }}>
        <SkeletonBox width="65%" />
        <SkeletonBox width="40%" height={11} />
      </View>
      <SkeletonBox width={72} />
    </View>
  );
}

function DeleteAction({ onPress }: { onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      style={[styles.swipeDeleteBtn, { backgroundColor: colors.danger }]}
      onPress={onPress}
    >
      <Ionicons name="trash-outline" size={20} color={colors.textPrimary} />
      <Text style={[styles.swipeDeleteText, { color: colors.textPrimary }]}>Xóa</Text>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const swipeRefs = useRef<Map<string, Swipeable | null>>(new Map());
  const currentOpenRef = useRef<Swipeable | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const { data: summaryData, isLoading: summaryLoading } =
    useTransactionSummary({
      startDate: getStartOfMonth(),
      endDate: getEndOfMonth(),
    });

  const txFilters = useMemo(
    () => ({
      ...(activeFilter !== 'all' && { type: activeFilter as 'income' | 'expense' }),
      page,
      limit: PAGE_SIZE,
    }),
    [activeFilter, page],
  );

  const {
    data: txData,
    isLoading: txLoading,
    refetch,
  } = useTransactions(txFilters);

  const { data: categoriesData } = useCategories();
  const { mutateAsync: deleteTransaction } = useDeleteTransaction();

  const categories: Category[] = (categoriesData as Category[] | undefined) ?? [];

  // ── Transaction accumulation ──────────────────────────────────────────────

  useEffect(() => {
    if (!txData?.data) return;
    const incoming = txData.data as Transaction[];
    if (page === 1) {
      setAllTransactions(incoming);
    } else {
      setAllTransactions((prev) => {
        const existing = new Set(prev.map((t) => t.id));
        return [...prev, ...incoming.filter((t) => !existing.has(t.id))];
      });
    }
  }, [txData, page]);

  // Reset when filter changes
  useEffect(() => {
    setPage(1);
    setAllTransactions([]);
  }, [activeFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setAllTransactions([]);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (txLoading || !txData) return;
    if (page < Math.ceil(txData.total / txData.limit)) {
      setPage((p) => p + 1);
    }
  }, [txLoading, txData, page]);

  const handleDelete = useCallback(
    (id: string) => {
      const ref = swipeRefs.current.get(id);
      Alert.alert(
        'Xóa giao dịch',
        'Bạn có chắc chắn muốn xóa giao dịch này không?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
            onPress: () => ref?.close(),
          },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteTransaction(id);
                setAllTransactions((prev) => prev.filter((t) => t.id !== id));
              } catch {
                Alert.alert('Lỗi', 'Không thể xóa giao dịch. Vui lòng thử lại.');
              }
            },
          },
        ],
      );
    },
    [deleteTransaction],
  );

  // ── Grouped list items ────────────────────────────────────────────────────

  const listItems = useMemo((): ListItem[] => {
    const groups: Record<string, Transaction[]> = {};
    for (const tx of allTransactions) {
      const dateKey = (tx.date ?? tx.createdAt).split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    }
    const result: ListItem[] = [];
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    for (const dateKey of sortedDates) {
      result.push({ kind: 'header', dateKey, label: formatDate(dateKey) });
      const dayTxs = groups[dateKey].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      for (const tx of dayTxs) {
        result.push({ kind: 'transaction', transaction: tx });
      }
    }
    return result;
  }, [allTransactions]);

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderRightActions = useCallback(
    (_progress: unknown, _drag: unknown, id: string) => (
      <DeleteAction onPress={() => handleDelete(id)} />
    ),
    [handleDelete],
  );

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'header') {
        return (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateHeaderText, { color: colors.textMuted }]}>
              {item.label}
            </Text>
          </View>
        );
      }

      const { transaction } = item;
      const cat = categories.find((c) => c.id === transaction.categoryId);
      const isIncome = transaction.type === 'income';
      const iconName = resolveIcon(cat?.icon ?? '');
      const catColor = cat?.color ?? colors.inactive;
      const iconBg = `${catColor}22`;

      return (
        <Swipeable
          ref={(r) => {
            swipeRefs.current.set(transaction.id, r);
          }}
          renderRightActions={(p, d) =>
            renderRightActions(p, d, transaction.id)
          }
          rightThreshold={40}
          overshootRight={false}
          onSwipeableOpen={() => {
            if (
              currentOpenRef.current &&
              currentOpenRef.current !== swipeRefs.current.get(transaction.id)
            ) {
              currentOpenRef.current.close();
            }
            currentOpenRef.current =
              swipeRefs.current.get(transaction.id) ?? null;
          }}
        >
          <Pressable
            style={[styles.txItem, { backgroundColor: colors.background }]}
            onPress={() =>
              router.push(
                `/add-transaction?id=${transaction.id}` as Parameters<typeof router.push>[0],
              )
            }
            android_ripple={{ color: 'rgba(255,255,255,0.04)' }}
          >
            {/* Icon */}
            <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
              <Ionicons
                name={iconName as keyof typeof Ionicons.glyphMap}
                size={20}
                color={catColor}
              />
            </View>

            {/* Text */}
            <View style={styles.txBody}>
              <Text
                style={[styles.txNote, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {transaction.note?.trim() || 'Không có ghi chú'}
              </Text>
              <Text
                style={[styles.txMeta, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {cat?.name ?? 'Không rõ danh mục'}
                {' · '}
                {formatRelativeTime(transaction.createdAt)}
              </Text>
            </View>

            {/* Amount */}
            <Text
              style={[
                styles.txAmount,
                { color: isIncome ? colors.success : colors.danger },
              ]}
              numberOfLines={1}
            >
              {formatVNDSigned(transaction.amount, transaction.type)}
            </Text>
          </Pressable>
        </Swipeable>
      );
    },
    [categories, colors, router, renderRightActions],
  );

  const keyExtractor = useCallback((item: ListItem) => {
    if (item.kind === 'header') return `hdr-${item.dateKey}`;
    return `tx-${item.transaction.id}`;
  }, []);

  const isInitialLoading =
    txLoading && page === 1 && allTransactions.length === 0;
  const hasMore = txData ? page < Math.ceil(txData.total / txData.limit) : false;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Giao dịch
        </Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={() =>
            router.push('/add-transaction' as Parameters<typeof router.push>[0])
          }
          hitSlop={HIT_SLOP.sm}
        >
          <Ionicons name="add" size={22} color={colors.background} />
        </Pressable>
      </View>

      {/* ── Filter Chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_OPTIONS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[
              styles.filterChip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              activeFilter === key && {
                backgroundColor: colors.accent,
                borderColor: colors.accent,
              },
            ]}
            onPress={() => setActiveFilter(key)}
            accessibilityLabel={`Lọc: ${label}`}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.textSecondary },
                activeFilter === key && {
                  color: colors.background,
                  fontWeight: FONT_WEIGHT.semibold,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Summary ── */}
      <View style={styles.summaryRow}>
        {/* Income */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryIconRow}>
            <View
              style={[styles.summaryIconBg, { backgroundColor: `${colors.success}18` }]}
            >
              <Ionicons name="arrow-up-circle" size={18} color={colors.success} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              Thu nhập
            </Text>
          </View>
          {summaryLoading ? (
            <SkeletonBox width={90} height={20} borderRadius={RADIUS.sm} style={{ marginTop: SPACING.s }} />
          ) : (
            <Text style={[styles.summaryAmount, { color: colors.success }]}>
              {formatVND(summaryData?.totalIncome ?? 0)}
            </Text>
          )}
          <Text style={[styles.summaryPeriod, { color: colors.textDark }]}>
            Tháng này
          </Text>
        </View>

        {/* Expense */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryIconRow}>
            <View
              style={[styles.summaryIconBg, { backgroundColor: `${colors.danger}18` }]}
            >
              <Ionicons name="arrow-down-circle" size={18} color={colors.danger} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              Chi tiêu
            </Text>
          </View>
          {summaryLoading ? (
            <SkeletonBox width={90} height={20} borderRadius={RADIUS.sm} style={{ marginTop: SPACING.s }} />
          ) : (
            <Text style={[styles.summaryAmount, { color: colors.danger }]}>
              {formatVND(summaryData?.totalExpense ?? 0)}
            </Text>
          )}
          <Text style={[styles.summaryPeriod, { color: colors.textDark }]}>
            Tháng này
          </Text>
        </View>
      </View>

      {/* ── List ── */}
      {isInitialLoading ? (
        <View style={styles.skeletonContainer}>
          <View
            style={[styles.skeletonHeader, { backgroundColor: colors.inactive }]}
          />
          {Array.from({ length: 5 }).map((_, i) => (
            <TransactionSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            listItems.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            hasMore && txLoading ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : hasMore ? null : allTransactions.length > 0 ? (
              <Text style={[styles.endLabel, { color: colors.textDark }]}>
                Đã hiển thị tất cả giao dịch
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="Chưa có giao dịch"
              description="Nhấn nút + để thêm giao dịch đầu tiên"
              actionLabel="Thêm giao dịch"
              actionIcon="add-circle-outline"
              onAction={() =>
                router.push(
                  '/add-transaction' as Parameters<typeof router.push>[0],
                )
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.base,
  },
  headerTitle: {
    fontSize: FONT_SIZE.h3,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filters
  filterRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.base,
  },
  filterChip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
  },
  filterText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  summaryIconBg: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  summaryAmount: {
    fontSize: 17,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.3,
  },
  summaryPeriod: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xxs,
  },

  // Date header
  dateHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.s,
    marginTop: SPACING.xs,
  },
  dateHeaderText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Transaction item
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txBody: {
    flex: 1,
    gap: 3,
  },
  txNote: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },
  txMeta: {
    fontSize: FONT_SIZE.sm,
  },
  txAmount: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.3,
    flexShrink: 0,
  },

  // Swipe delete
  swipeDeleteBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    gap: SPACING.xs,
  },
  swipeDeleteText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // List container
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Load more / end
  loadingMore: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  endLabel: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    paddingVertical: SPACING.base,
  },

  // Skeleton
  skeletonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  skeletonHeader: {
    height: 12,
    width: 100,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.base,
    marginTop: SPACING.sm,
  },
});
