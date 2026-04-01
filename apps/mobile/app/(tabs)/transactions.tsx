import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#a78bfa';

const FILTERS = ['Tất cả', 'Thu nhập', 'Chi tiêu'] as const;

export default function TransactionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giao dịch</Text>
        <Pressable style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#09090b" />
        </Pressable>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((filter, index) => (
          <Pressable
            key={filter}
            style={[styles.filterChip, index === 0 && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterText,
                index === 0 && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="arrow-up-circle" size={20} color="#4ade80" />
          <Text style={styles.summaryLabel}>Thu nhập</Text>
          <Text style={[styles.summaryAmount, { color: '#4ade80' }]}>0 ₫</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="arrow-down-circle" size={20} color="#f87171" />
          <Text style={styles.summaryLabel}>Chi tiêu</Text>
          <Text style={[styles.summaryAmount, { color: '#f87171' }]}>0 ₫</Text>
        </View>
      </View>

      {/* Transaction List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="receipt-outline" size={48} color="#3f3f46" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
          <Text style={styles.emptyDesc}>
            Nhấn nút + để thêm giao dịch đầu tiên
          </Text>
          <Pressable style={styles.emptyBtn}>
            <Ionicons name="add-circle-outline" size={18} color="#09090b" />
            <Text style={styles.emptyBtnText}>Thêm giao dịch</Text>
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
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Filters
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#a1a1aa',
  },
  filterTextActive: {
    color: '#09090b',
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  // List
  listContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#52525b',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09090b',
  },
});
