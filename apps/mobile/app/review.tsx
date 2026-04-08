import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useThemeColors } from "../src/hooks/use-theme-colors";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  HIT_SLOP,
} from "../src/constants/theme";
import { ScreenHeader } from "../src/components/ScreenHeader";
import {
  useMyReview,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from "../src/hooks/use-review";

// ─── Star Rating Component ──────────────────────────────────────────────────

function StarRating({
  rating,
  onChange,
  disabled,
  colors,
}: {
  rating: number;
  onChange: (r: number) => void;
  disabled?: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={starStyles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => !disabled && onChange(star)}
          hitSlop={HIT_SLOP.sm}
          style={starStyles.star}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={36}
            color={star <= rating ? "#fbbf24" : colors.textMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
  },
  star: { padding: SPACING.xs },
});

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    pending: {
      label: "Chờ duyệt",
      bg: "rgba(251, 191, 36, 0.15)",
      text: "#fbbf24",
    },
    approved: {
      label: "Đã duyệt",
      bg: "rgba(74, 222, 128, 0.15)",
      text: "#4ade80",
    },
    rejected: {
      label: "Bị từ chối",
      bg: "rgba(248, 113, 113, 0.15)",
      text: "#f87171",
    },
  };

  const c = config[status] ?? config.pending;

  return (
    <View style={[badgeStyles.container, { backgroundColor: c.bg }]}>
      <Text style={[badgeStyles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    alignSelf: "flex-start",
  },
  text: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
});

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function ReviewScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const { data: myReview, isLoading, refetch } = useMyReview();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const isEditing = !!myReview;

  // Pre-fill form when review loads
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setContent(myReview.content);
    }
  }, [myReview]);

  const isSaving = createReview.isPending || updateReview.isPending;
  const isValid = rating >= 1 && content.trim().length >= 10;

  async function handleSubmit() {
    if (!isValid) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng chọn số sao và nhập nội dung (tối thiểu 10 ký tự).",
      );
      return;
    }

    try {
      if (isEditing) {
        await updateReview.mutateAsync({ rating, content: content.trim() });
        Alert.alert(
          "Thành công",
          "Đánh giá đã được cập nhật. Đang chờ duyệt lại.",
        );
      } else {
        await createReview.mutateAsync({ rating, content: content.trim() });
        Alert.alert("Thành công", "Cảm ơn bạn đã đánh giá FinGenie!");
      }
      refetch();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Không thể gửi đánh giá.";
      Alert.alert("Lỗi", message);
    }
  }

  function handleDelete() {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa đánh giá?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReview.mutateAsync();
            setRating(0);
            setContent("");
            refetch();
            Alert.alert("Đã xóa", "Đánh giá của bạn đã được xóa.");
          } catch {
            Alert.alert("Lỗi", "Không thể xóa đánh giá.");
          }
        },
      },
    ]);
  }

  const s = createStyles(colors);

  return (
    <SafeAreaView style={s.safeArea}>
      <ScreenHeader title="Đánh giá FinGenie" onBack={() => router.back()} />

      {isLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Status badge if editing */}
          {isEditing && myReview && (
            <View style={s.statusRow}>
              <Text style={s.statusLabel}>Trạng thái:</Text>
              <StatusBadge status={myReview.status} />
            </View>
          )}

          {/* Star rating */}
          <View style={s.section}>
            <Text style={s.label}>Đánh giá của bạn</Text>
            <StarRating
              rating={rating}
              onChange={setRating}
              disabled={isSaving}
              colors={colors}
            />
            {rating > 0 && (
              <Text style={s.ratingText}>
                {rating === 5
                  ? "Tuyệt vời!"
                  : rating === 4
                    ? "Rất tốt!"
                    : rating === 3
                      ? "Tốt"
                      : rating === 2
                        ? "Bình thường"
                        : "Kém"}
              </Text>
            )}
          </View>

          {/* Content input */}
          <View style={s.section}>
            <Text style={s.label}>Nội dung đánh giá</Text>
            <TextInput
              style={s.textInput}
              value={content}
              onChangeText={setContent}
              placeholder="Chia sẻ trải nghiệm của bạn với FinGenie... (tối thiểu 10 ký tự)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              maxLength={1000}
              textAlignVertical="top"
              editable={!isSaving}
            />
            <Text style={s.charCount}>{content.length}/1000</Text>
          </View>

          {/* Submit button */}
          <Pressable
            style={[s.submitBtn, (!isValid || isSaving) && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? "create-outline" : "send-outline"}
                  size={20}
                  color="#fff"
                />
                <Text style={s.submitText}>
                  {isEditing ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                </Text>
              </>
            )}
          </Pressable>

          {/* Delete button (only if editing) */}
          {isEditing && (
            <Pressable
              style={s.deleteBtn}
              onPress={handleDelete}
              disabled={deleteReview.isPending}
            >
              {deleteReview.isPending ? (
                <ActivityIndicator color={colors.danger} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.danger}
                  />
                  <Text style={[s.deleteText, { color: colors.danger }]}>
                    Xóa đánh giá
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {/* Info note */}
          <View style={s.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.textMuted}
            />
            <Text style={s.infoText}>
              Đánh giá của bạn sẽ được kiểm duyệt trước khi hiển thị công khai.
              Cảm ơn bạn đã góp ý!
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    scroll: { flex: 1 },
    scrollContent: {
      padding: SPACING.lg,
      paddingBottom: SPACING.giant,
      gap: SPACING.xl,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    statusLabel: {
      fontSize: FONT_SIZE.body2,
      color: colors.textSecondary,
      fontWeight: FONT_WEIGHT.medium,
    },
    section: {
      gap: SPACING.md,
    },
    label: {
      fontSize: FONT_SIZE.base,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.textPrimary,
      textAlign: "center",
    },
    ratingText: {
      fontSize: FONT_SIZE.body2,
      color: colors.accent,
      fontWeight: FONT_WEIGHT.medium,
      textAlign: "center",
    },
    textInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: SPACING.base,
      fontSize: FONT_SIZE.body,
      color: colors.textPrimary,
      minHeight: 120,
      lineHeight: 22,
    },
    charCount: {
      fontSize: FONT_SIZE.xs,
      color: colors.textMuted,
      textAlign: "right",
    },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      backgroundColor: colors.accent,
      paddingVertical: SPACING.base,
      borderRadius: RADIUS.lg,
    },
    submitBtnDisabled: {
      opacity: 0.5,
    },
    submitText: {
      fontSize: FONT_SIZE.base,
      fontWeight: FONT_WEIGHT.bold,
      color: "#fff",
    },
    deleteBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    deleteText: {
      fontSize: FONT_SIZE.body2,
      fontWeight: FONT_WEIGHT.semibold,
    },
    infoCard: {
      flexDirection: "row",
      gap: SPACING.sm,
      padding: SPACING.base,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoText: {
      flex: 1,
      fontSize: FONT_SIZE.sm,
      color: colors.textMuted,
      lineHeight: 20,
    },
  });
}
