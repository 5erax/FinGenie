import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#a78bfa';
const ACCENT_DIM = 'rgba(167, 139, 250, 0.15)';

const quickActions = [
  { icon: 'add-circle-outline' as const, label: 'Thu nhập', color: '#4ade80' },
  { icon: 'remove-circle-outline' as const, label: 'Chi tiêu', color: '#f87171' },
  { icon: 'wallet-outline' as const, label: 'Ví', color: '#60a5fa' },
  { icon: 'pie-chart-outline' as const, label: 'Thống kê', color: '#fbbf24' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào</Text>
            <Text style={styles.name}>FinGenie User</Text>
          </View>
          <Pressable style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color="#a1a1aa" />
          </Pressable>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceGlow} />
          <Text style={styles.balanceLabel}>Tổng số dư</Text>
          <Text style={styles.balanceAmount}>0 ₫</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <Ionicons name="trending-up" size={16} color="#4ade80" />
              <Text style={[styles.balanceStatText, { color: '#4ade80' }]}>
                +0 ₫
              </Text>
              <Text style={styles.balanceStatLabel}>Thu nhập</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceStat}>
              <Ionicons name="trending-down" size={16} color="#f87171" />
              <Text style={[styles.balanceStatText, { color: '#f87171' }]}>
                -0 ₫
              </Text>
              <Text style={styles.balanceStatLabel}>Chi tiêu</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.actionsRow}>
          {quickActions.map((action) => (
            <Pressable key={action.label} style={styles.actionItem}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${action.color}15` },
                ]}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
          <Pressable>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </Pressable>
        </View>
        <View style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={40} color="#3f3f46" />
          <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          <Text style={styles.emptySubtext}>
            Bắt đầu thêm giao dịch để theo dõi chi tiêu
          </Text>
        </View>

        {/* Saving Goal */}
        <Text style={styles.sectionTitle}>Mục tiêu tiết kiệm</Text>
        <View style={styles.savingCard}>
          <View style={styles.savingHeader}>
            <Ionicons name="flag-outline" size={20} color={ACCENT} />
            <Text style={styles.savingTitle}>Thiết lập mục tiêu</Text>
          </View>
          <Text style={styles.savingDesc}>
            Tạo kế hoạch tiết kiệm thông minh với AI Coach
          </Text>
          <Pressable style={styles.savingBtn}>
            <Text style={styles.savingBtnText}>Bắt đầu ngay</Text>
            <Ionicons name="arrow-forward" size={16} color="#09090b" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  // Balance Card
  balanceCard: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  balanceGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ACCENT_DIM,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#71717a',
    fontWeight: '500',
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceStatText: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceStatLabel: {
    fontSize: 12,
    color: '#52525b',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#27272a',
    marginHorizontal: 12,
  },
  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '500',
  },
  // Empty State
  emptyCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 28,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a1a1aa',
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#52525b',
    textAlign: 'center',
  },
  // Saving Card
  savingCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  savingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  savingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  savingDesc: {
    fontSize: 13,
    color: '#71717a',
    lineHeight: 20,
    marginBottom: 16,
  },
  savingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 12,
  },
  savingBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09090b',
  },
});
