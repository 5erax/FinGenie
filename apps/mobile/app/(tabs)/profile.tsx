import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuthStore } from '../../src/stores/auth-store';
import { APP_VERSION } from '../../src/constants/config';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, HIT_SLOP } from '../../src/constants/theme';
import { useThemeColors, type ThemeColors } from '../../src/hooks/use-theme-colors';
import { formatDate } from '../../src/utils/format';
import { useUnreadAlertCount } from '../../src/hooks/use-alerts';
import { queryClient } from '../../src/lib/query-client';

// ─── helpers ────────────────────────────────────────────────────────────────

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

function isPremiumActive(premiumUntil?: string | null): boolean {
  if (!premiumUntil) return false;
  return new Date(premiumUntil) > new Date();
}

// ─── Edit Profile Modal ──────────────────────────────────────────────────────

interface EditModalProps {
  visible: boolean;
  initialName: string;
  colors: ThemeColors;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}

function EditProfileModal({ visible, initialName, colors, onSave, onClose }: EditModalProps) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      onClose();
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Chỉnh sửa hồ sơ</Text>

          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Tên hiển thị</Text>
          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên của bạn"
            placeholderTextColor={colors.textMuted}
            autoFocus
            maxLength={50}
          />

          <View style={styles.modalActions}>
            <Pressable
              style={[
                styles.modalBtn,
                styles.modalBtnCancel,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>Huỷ</Text>
            </Pressable>

            <Pressable
              style={[
                styles.modalBtn,
                styles.modalBtnSave,
                saving && styles.modalBtnDisabled,
                { backgroundColor: colors.accent },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={[styles.modalBtnSaveText, { color: colors.textPrimary }]}>Lưu</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const { data: unreadCount } = useUnreadAlertCount();
  const colors = useThemeColors();

  const [editVisible, setEditVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const hasPremium = isPremiumActive(user?.premiumUntil);

  // ── Derived display values ─────────────────────────────────────────────────
  const displayName = user?.displayName ?? 'FinGenie User';
  const displayContact = user?.email ?? user?.phone ?? 'Chưa cập nhật';

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleSaveProfile(newName: string) {
    await updateProfile({ displayName: newName });
  }

  async function handleLogout() {
    const doLogout = async () => {
      setLoggingOut(true);
      try {
        queryClient.clear();
        await logout();
        // Auth guard in _layout.tsx will redirect to login automatically
      } catch {
        if (Platform.OS === 'web') {
          window.alert('Đăng xuất thất bại. Vui lòng thử lại.');
        } else {
          Alert.alert('Lỗi', 'Đăng xuất thất bại. Vui lòng thử lại.');
        }
        setLoggingOut(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc muốn đăng xuất không?')) {
        await doLogout();
      }
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất không?', [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  }

  function handleMenuPress(key: string) {
    switch (key) {
      case 'wallets':
        router.push('/wallets');
        break;
      case 'stats':
        router.push('/stats');
        break;
      case 'saving-plan':
        router.push('/saving-plan');
        break;
      case 'alerts':
        router.push('/alerts');
        break;
      case 'security':
        router.push('/security');
        break;
      case 'settings':
        router.push('/settings');
        break;
    }
  }

  // ── Menu config ─────────────────────────────────────────────────────────────
  const MENU_ITEMS = [
    {
      key: 'wallets',
      icon: 'wallet-outline' as const,
      label: 'Ví của tôi',
      color: colors.info,
      badge: null,
    },
    {
      key: 'stats',
      icon: 'pie-chart-outline' as const,
      label: 'Thống kê chi tiêu',
      color: colors.success,
      badge: null,
    },
    {
      key: 'saving-plan',
      icon: 'flag-outline' as const,
      label: 'Mục tiêu tiết kiệm',
      color: colors.warning,
      badge: null,
    },
    {
      key: 'alerts',
      icon: 'notifications-outline' as const,
      label: 'Thông báo',
      color: colors.danger,
      badge: unreadCount && unreadCount > 0 ? unreadCount : null,
    },
    {
      key: 'security',
      icon: 'shield-checkmark-outline' as const,
      label: 'Bảo mật',
      color: colors.accent,
      badge: null,
    },
    {
      key: 'settings',
      icon: 'settings-outline' as const,
      label: 'Cài đặt',
      color: colors.textSecondary,
      badge: null,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cá nhân</Text>

        {/* ── Profile Card ───────────────────────────────────────────────── */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Avatar */}
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.border }]}>
              {user ? (
                <Text style={[styles.avatarInitials, { color: colors.accent }]}>
                  {getInitials(user.displayName)}
                </Text>
              ) : (
                <Ionicons name="person" size={28} color={colors.textMuted} />
              )}
            </View>
          )}

          {/* Info */}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]} numberOfLines={1}>
              {displayContact}
            </Text>
          </View>

          {/* Edit button */}
          <Pressable
            style={[styles.editBtn, { backgroundColor: colors.accentDim }]}
            onPress={() => setEditVisible(true)}
            hitSlop={HIT_SLOP.sm}
          >
            <Ionicons name="create-outline" size={18} color={colors.accent} />
          </Pressable>
        </View>

        {/* ── Premium Banner ─────────────────────────────────────────────── */}
        {hasPremium ? (
          <View
            style={[
              styles.premiumBanner,
              styles.premiumBannerActive,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.premiumGlow} />
            <View style={styles.premiumContent}>
              <Ionicons name="diamond" size={22} color={colors.warning} />
              <View style={styles.premiumText}>
                <View style={styles.premiumTitleRow}>
                  <Text style={[styles.premiumTitle, { color: colors.warning }]}>Premium</Text>
                  <View style={styles.premiumBadge}>
                    <Text style={[styles.premiumBadgeText, { color: colors.warning }]}>ACTIVE</Text>
                  </View>
                </View>
                <Text style={[styles.premiumDesc, { color: colors.textMuted }]}>
                  Hết hạn: {formatDate(user!.premiumUntil!)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Pressable
            style={[styles.premiumBanner, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/premium')}
          >
            <View style={styles.premiumGlow} />
            <View style={styles.premiumContent}>
              <Ionicons name="diamond-outline" size={22} color={colors.warning} />
              <View style={styles.premiumText}>
                <Text style={[styles.premiumTitle, { color: colors.warning }]}>Nâng cấp Premium</Text>
                <Text style={[styles.premiumDesc, { color: colors.textMuted }]}>
                  Mở khóa AI Coach &amp; nhiều tính năng hơn
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}

        {/* ── Menu Items ─────────────────────────────────────────────────── */}
        <View
          style={[
            styles.menuSection,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {MENU_ITEMS.map((item, index) => (
            <Pressable
              key={item.key}
              style={[
                styles.menuItem,
                { borderBottomColor: colors.borderLight },
                index === MENU_ITEMS.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => handleMenuPress(item.key)}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>{item.label}</Text>

              {/* Unread badge */}
              {item.badge !== null && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}

              <Ionicons name="chevron-forward" size={16} color={colors.inactive} />
            </Pressable>
          ))}
        </View>

        {/* ── Logout ─────────────────────────────────────────────────────── */}
        <Pressable
          style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          )}
          <Text style={[styles.logoutText, { color: colors.danger }]}>Đăng xuất</Text>
        </Pressable>

        {/* ── Version ────────────────────────────────────────────────────── */}
        <Text style={[styles.version, { color: colors.inactive }]}>FinGenie v{APP_VERSION}</Text>
      </ScrollView>

      {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
      <EditProfileModal
        visible={editVisible}
        initialName={user?.displayName ?? ''}
        colors={colors}
        onSave={handleSaveProfile}
        onClose={() => setEditVisible(false)}
      />
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
    paddingBottom: SPACING.xxl,
  },

  // ── Header
  headerTitle: {
    fontSize: FONT_SIZE.h3,
    fontWeight: FONT_WEIGHT.bold,
    paddingTop: SPACING.md,
    marginBottom: SPACING.xl,
  },

  // ── Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
  avatarInitials: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 17,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.xxs,
  },
  profileEmail: {
    fontSize: FONT_SIZE.caption,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Premium Banner
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    overflow: 'hidden',
  },
  premiumBannerActive: {
    borderColor: 'rgba(251, 191, 36, 0.35)',
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
    gap: SPACING.md,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xxs,
  },
  premiumTitle: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
  },
  premiumBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: RADIUS.xs,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xxs,
  },
  premiumBadgeText: {
    fontSize: FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.5,
  },
  premiumDesc: {
    fontSize: FONT_SIZE.sm,
  },

  // ── Menu
  menuSection: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.base,
    borderBottomWidth: 1,
  },
  menuItemLast: {
    borderBottomWidth: 0,
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
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Unread badge
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.s,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },

  // ── Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.15)',
    marginBottom: SPACING.base,
  },
  logoutBtnDisabled: {
    opacity: 0.5,
  },
  logoutText: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // ── Version
  version: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
  },

  // ── Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.lg,
  },
  modalLabel: {
    fontSize: FONT_SIZE.caption,
    marginBottom: SPACING.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  modalInput: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.body,
    marginBottom: SPACING.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    borderWidth: 1,
  },
  modalBtnCancelText: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
  },
  modalBtnSave: {},
  modalBtnSaveText: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
  },
  modalBtnDisabled: {
    opacity: 0.6,
  },
});
