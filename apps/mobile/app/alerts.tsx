import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert as RNAlert,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Swipeable } from "react-native-gesture-handler";
import { useAlerts, alertKeys } from "../src/hooks/use-alerts";
import { alertService } from "../src/services/alert-service";
import type { Alert as AlertEvent } from "../src/services/alert-service";
import { formatRelativeTime } from "../src/utils/format";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  HIT_SLOP,
} from "../src/constants/theme";
import { useThemeColors } from "../src/hooks/use-theme-colors";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { EmptyState } from "../src/components/EmptyState";

// ─────────────────────────────────────────────────────────────────────────────
// Type helpers
// ─────────────────────────────────────────────────────────────────────────────

type FilterTab = "all" | "unread";
type AlertType = AlertEvent["type"];

interface TypeMeta {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

function buildTypeMeta(
  colors: ReturnType<typeof useThemeColors>,
): Record<AlertType, TypeMeta> {
  return {
    overspend: {
      icon: "warning",
      color: colors.danger,
      bg: `${colors.danger}22`,
    },
    budget_warning: {
      icon: "alert-circle",
      color: colors.warning,
      bg: `${colors.warning}22`,
    },
    saving_milestone: {
      icon: "trophy",
      color: colors.success,
      bg: `${colors.success}22`,
    },
    system: {
      icon: "information-circle",
      color: colors.info,
      bg: `${colors.info}22`,
    },
  };
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
];

// ─────────────────────────────────────────────────────────────────────────────
// AlertRow
// ─────────────────────────────────────────────────────────────────────────────

interface AlertRowProps {
  item: AlertEvent;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
}

function AlertRow({ item, onPress, onDelete }: AlertRowProps) {
  const colors = useThemeColors();
  const swipeableRef = useRef<Swipeable>(null);
  const meta = buildTypeMeta(colors)[item.type];

  const handleDeletePress = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(item.id);
  }, [item.id, onDelete]);

  const renderRightActions = useCallback(
    () => (
      <TouchableOpacity
        style={[styles.deleteAction, { backgroundColor: colors.danger }]}
        onPress={handleDeletePress}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={20} color={colors.textPrimary} />
        <Text style={[styles.deleteActionText, { color: colors.textPrimary }]}>
          Xóa
        </Text>
      </TouchableOpacity>
    ),
    [handleDeletePress, colors],
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={60}
      friction={2}
      overshootRight={false}
    >
      <Pressable
        style={[
          styles.alertCard,
          { backgroundColor: colors.background },
          !item.isRead && styles.alertCardUnread,
        ]}
        onPress={() => !item.isRead && onPress(item.id)}
        android_ripple={{ color: colors.accentDim }}
      >
        {/* Unread accent bar */}
        {!item.isRead && (
          <View
            style={[styles.unreadBar, { backgroundColor: colors.accent }]}
          />
        )}

        {/* Type icon */}
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>

        {/* Text content */}
        <View style={styles.alertBody}>
          <Text
            style={[
              styles.alertMessage,
              { color: colors.textSecondary },
              !item.isRead && styles.alertMessageBold,
              !item.isRead && { color: colors.textPrimary },
            ]}
            numberOfLines={3}
          >
            {item.message}
          </Text>
          <Text style={[styles.alertTime, { color: colors.textDark }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>

        {/* Unread indicator dot */}
        {!item.isRead && (
          <View
            style={[styles.unreadDot, { backgroundColor: colors.accent }]}
          />
        )}
      </Pressable>
    </Swipeable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter tabs header component
// ─────────────────────────────────────────────────────────────────────────────

interface FilterHeaderProps {
  activeFilter: FilterTab;
  unreadCount: number;
  onFilterChange: (tab: FilterTab) => void;
}

function FilterHeader({
  activeFilter,
  unreadCount,
  onFilterChange,
}: FilterHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.filterRow}>
      {FILTER_TABS.map((tab) => {
        const isActive = activeFilter === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[
              styles.filterChip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              isActive && {
                backgroundColor: colors.accent,
                borderColor: colors.accent,
              },
            ]}
            onPress={() => onFilterChange(tab.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: colors.textSecondary },
                isActive && styles.filterChipTextActive,
                isActive && { color: colors.background },
              ]}
            >
              {tab.label}
            </Text>
            {tab.key === "unread" && unreadCount > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  { backgroundColor: colors.accentDim },
                  isActive && styles.filterBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: colors.accent },
                    isActive && { color: colors.background },
                  ]}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data: alerts = [], isLoading, refetch } = useAlerts();

  // ── Mutations ──────────────────────────────────────────────────────────────

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: alertKeys.all });
    queryClient.invalidateQueries({ queryKey: alertKeys.unreadCount });
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => alertService.markAsRead(id),
    onSuccess: invalidate,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => alertService.markAllAsRead(),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertService.delete(id),
    onSuccess: invalidate,
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate(id, {
        onError: () =>
          RNAlert.alert("Lỗi", "Không thể đánh dấu đã đọc. Vui lòng thử lại."),
      });
    },
    [markAsReadMutation],
  );

  const handleMarkAllAsRead = useCallback(() => {
    const hasUnread = alerts.some((a) => !a.isRead);
    if (!hasUnread || markAllAsReadMutation.isPending) return;
    markAllAsReadMutation.mutate(undefined, {
      onError: () =>
        RNAlert.alert(
          "Lỗi",
          "Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.",
        ),
    });
  }, [alerts, markAllAsReadMutation]);

  const handleDelete = useCallback(
    (id: string) => {
      RNAlert.alert(
        "Xóa thông báo",
        "Bạn có chắc muốn xóa thông báo này không?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
            style: "destructive",
            onPress: () =>
              deleteMutation.mutate(id, {
                onError: () =>
                  RNAlert.alert(
                    "Lỗi",
                    "Không thể xóa thông báo. Vui lòng thử lại.",
                  ),
              }),
          },
        ],
        { cancelable: true },
      );
    },
    [deleteMutation],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const filteredAlerts =
    activeFilter === "unread" ? alerts.filter((a) => !a.isRead) : alerts;

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: AlertEvent }) => (
      <AlertRow
        item={item}
        onPress={handleMarkAsRead}
        onDelete={handleDelete}
      />
    ),
    [handleMarkAsRead, handleDelete],
  );

  const keyExtractor = useCallback((item: AlertEvent) => item.id, []);

  const ListHeader = useCallback(
    () => (
      <FilterHeader
        activeFilter={activeFilter}
        unreadCount={unreadCount}
        onFilterChange={setActiveFilter}
      />
    ),
    [activeFilter, unreadCount],
  );

  const ListEmpty = useCallback(
    () =>
      isLoading ? null : (
        <EmptyState
          icon="notifications-off-outline"
          title="Không có thông báo"
          description={
            activeFilter === "unread"
              ? "Bạn đã đọc hết thông báo rồi 🎉"
              : "Chưa có thông báo nào cho bạn"
          }
        />
      ),
    [isLoading, activeFilter],
  );

  const ItemSeparator = useCallback(
    () => (
      <View style={[styles.separator, { backgroundColor: colors.border }]} />
    ),
    [colors.border],
  );

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* ── Header ── */}
      <ScreenHeader
        title="Thông báo"
        onBack={() => router.back()}
        rightElement={
          <Pressable
            style={styles.markAllBtn}
            onPress={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            hitSlop={HIT_SLOP.sm}
          >
            {markAllAsReadMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text
                style={[
                  styles.markAllText,
                  {
                    color: unreadCount === 0 ? colors.textDark : colors.accent,
                  },
                ]}
              >
                Đọc tất cả
              </Text>
            )}
          </Pressable>
        }
      />

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Đang tải thông báo…
          </Text>
        </View>
      )}

      {/* ── Alert list ── */}
      {!isLoading && (
        <FlatList
          data={filteredAlerts}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.surface}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Mark-all button (used as rightElement in ScreenHeader) ──────────────────
  markAllBtn: {
    minWidth: 80,
    alignItems: "flex-end",
    justifyContent: "center",
    height: 36,
  },
  markAllText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // ── Loading ──────────────────────────────────────────────────────────────
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.body2,
  },

  // ── List ─────────────────────────────────────────────────────────────────
  listContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },
  separator: {
    height: 1,
    marginLeft: 72, // align with text content (16 card padding + 40 icon + 16 gap)
  },

  // ── Filter tabs ───────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.medium,
  },
  filterChipTextActive: {
    fontWeight: FONT_WEIGHT.semibold,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xs,
  },
  filterBadgeActive: {
    backgroundColor: "rgba(9, 9, 11, 0.25)",
  },
  filterBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: 14,
  },

  // ── Alert card ────────────────────────────────────────────────────────────
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
  },
  alertCardUnread: {
    backgroundColor: "#0d0d10",
  },
  unreadBar: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  alertBody: {
    flex: 1,
    gap: 5,
  },
  alertMessage: {
    fontSize: FONT_SIZE.body2,
    lineHeight: 20,
  },
  alertMessageBold: {
    fontWeight: FONT_WEIGHT.medium,
  },
  alertTime: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.regular,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.xs,
    marginTop: SPACING.s,
    flexShrink: 0,
  },

  // ── Swipe delete action ───────────────────────────────────────────────────
  deleteAction: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  deleteActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
