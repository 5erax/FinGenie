import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#a78bfa';

const MENU_ITEMS = [
  { icon: 'wallet-outline' as const, label: 'Ví của tôi', color: '#60a5fa' },
  { icon: 'pie-chart-outline' as const, label: 'Thống kê chi tiêu', color: '#4ade80' },
  { icon: 'flag-outline' as const, label: 'Mục tiêu tiết kiệm', color: '#fbbf24' },
  { icon: 'notifications-outline' as const, label: 'Thông báo', color: '#f87171' },
  { icon: 'shield-checkmark-outline' as const, label: 'Bảo mật', color: ACCENT },
  { icon: 'settings-outline' as const, label: 'Cài đặt', color: '#a1a1aa' },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>Cá nhân</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color="#71717a" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>FinGenie User</Text>
            <Text style={styles.profileEmail}>user@fingenie.vn</Text>
          </View>
          <Pressable style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color={ACCENT} />
          </Pressable>
        </View>

        {/* Premium Banner */}
        <Pressable style={styles.premiumBanner}>
          <View style={styles.premiumGlow} />
          <View style={styles.premiumContent}>
            <Ionicons name="diamond-outline" size={22} color="#fbbf24" />
            <View style={styles.premiumText}>
              <Text style={styles.premiumTitle}>Nâng cấp Premium</Text>
              <Text style={styles.premiumDesc}>
                Mở khóa AI Coach & nhiều tính năng hơn
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#71717a" />
        </Pressable>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => (
            <Pressable key={item.label} style={styles.menuItem}>
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: `${item.color}15` },
                ]}
              >
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#3f3f46" />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>

        {/* Version */}
        <Text style={styles.version}>FinGenie v0.1.0</Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    paddingTop: 12,
    marginBottom: 24,
  },
  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#71717a',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Premium
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    overflow: 'hidden',
  },
  premiumGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  premiumContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 2,
  },
  premiumDesc: {
    fontSize: 12,
    color: '#71717a',
  },
  // Menu
  menuSection: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#d4d4d8',
    fontWeight: '500',
  },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.15)',
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f87171',
  },
  // Version
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#3f3f46',
  },
});
