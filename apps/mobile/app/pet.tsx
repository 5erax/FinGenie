import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  Platform,
} from "react-native";

import { shadow } from "../src/utils/shadow";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTransactionSummary } from "../src/hooks/use-transactions";
import {
  usePet,
  useFeedPet,
  usePlayWithPet,
  useDailyTasks,
  useCompleteTask,
  useStreak,
  useCheckIn,
  useAchievements,
} from "../src/hooks/use-gamification";
import { getStartOfMonth, getEndOfMonth } from "../src/utils/format";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
} from "../src/constants/theme";
import { useThemeColors } from "../src/hooks/use-theme-colors";
import { ScreenHeader } from "../src/components/ScreenHeader";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_TIPS = [
  "Ghi lại mọi khoản chi tiêu, dù nhỏ nhất, để có cái nhìn tổng quan về tài chính của bạn.",
  "Quy tắc 50/30/20: 50% cho nhu cầu thiết yếu, 30% cho giải trí, 20% cho tiết kiệm.",
  "Trước khi mua gì đó, hãy đợi 24 giờ — nếu vẫn muốn mua thì mới thực sự cần.",
  "Tiết kiệm trước, chi tiêu sau. Tự động chuyển tiền tiết kiệm ngay khi nhận lương.",
  "So sánh giá từ nhiều nơi trước khi mua và luôn tìm kiếm ưu đãi, mã giảm giá.",
  "Đặt mục tiêu tài chính cụ thể để có động lực tiết kiệm và theo dõi tiến độ mỗi ngày.",
];

// ─── Evolution Stages ─────────────────────────────────────────────────────────

interface EvolutionStage {
  minLevel: number;
  name: string;
  emoji: (health: number) => string;
  stageName: string;
  color: string;
  nextDesc: string;
}

function buildEvolutionStages(
  colors: ReturnType<typeof useThemeColors>,
): EvolutionStage[] {
  return [
    {
      minLevel: 1,
      name: "Trứng Thần Kỳ",
      emoji: () => "🥚",
      stageName: "Giai đoạn trứng",
      color: "#c084fc",
      nextDesc: "Nở thành Mèo Con ở Lv.3",
    },
    {
      minLevel: 3,
      name: "Mèo Con",
      emoji: (h) => (h > 60 ? "🐱" : "😿"),
      stageName: "Giai đoạn sơ sinh",
      color: "#f9a8d4",
      nextDesc: "Trưởng thành ở Lv.6",
    },
    {
      minLevel: 6,
      name: "FinGenie Cat",
      emoji: (h) => (h > 70 ? "🐱" : h > 40 ? "😺" : h > 20 ? "🙀" : "😿"),
      stageName: "Giai đoạn trưởng thành",
      color: colors.accent,
      nextDesc: "Tiến hóa thành Rồng ở Lv.11",
    },
    {
      minLevel: 11,
      name: "Rồng Tài Chính",
      emoji: (h) => (h > 50 ? "🐲" : "😤"),
      stageName: "Huyền thoại",
      color: colors.warning,
      nextDesc: "Đã đạt cấp độ tối thượng!",
    },
  ];
}

function getEvolutionStage(
  level: number,
  stages: EvolutionStage[],
): EvolutionStage {
  for (let i = stages.length - 1; i >= 0; i--) {
    if (level >= stages[i].minLevel) return stages[i];
  }
  return stages[0];
}

function getNextEvolutionLevel(level: number): number | null {
  const thresholds = [3, 6, 11];
  for (const t of thresholds) {
    if (level < t) return t;
  }
  return null;
}

// ─── Floating Reaction ────────────────────────────────────────────────────────

interface FloatingReactionProps {
  emoji: string;
  onDone: () => void;
}

function FloatingReaction({ emoji, onDone }: FloatingReactionProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -90,
        duration: 1100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 180,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 180,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.sequence([
        Animated.delay(550),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 550,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    ]).start(onDone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.Text
      style={{
        position: "absolute",
        fontSize: FONT_SIZE.h1,
        lineHeight: 40,
        transform: [{ translateY }, { scale }],
        opacity,
        zIndex: 20,
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

// ─── Pulse Ring ───────────────────────────────────────────────────────────────

function PulseRing({ color, delay = 0 }: { color: string; delay?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.55,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        Animated.delay(300),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={{
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ─── Sparkle Particle ─────────────────────────────────────────────────────────

function Sparkle({
  x,
  y,
  delay,
  size = 5,
}: {
  x: number;
  y: number;
  delay: number;
  size?: number;
}) {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.9,
            duration: 500,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(scale, {
            toValue: 0.4,
            duration: 700,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        Animated.delay(900),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accent,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ─── Stat Bar ─────────────────────────────────────────────────────────────────

function StatBar({
  label,
  value,
  color,
  emoji,
}: {
  label: string;
  value: number;
  color: string;
  emoji: string;
}) {
  const colors = useThemeColors();
  const clamped = Math.max(0, Math.min(100, value));
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: clamped,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animWidth, clamped]);

  const widthPct = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const statusText =
    clamped >= 80
      ? "Tuyệt vời"
      : clamped >= 60
        ? "Tốt"
        : clamped >= 40
          ? "Bình thường"
          : clamped >= 20
            ? "Cần cải thiện"
            : "Nguy hiểm";

  return (
    <View style={styles.statBar}>
      <View style={styles.statBarHeader}>
        <Text style={styles.statBarEmoji}>{emoji}</Text>
        <Text style={[styles.statBarLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.statBarValue, { color }]}>
            {Math.round(clamped)}
          </Text>
          <Text style={[styles.statBarSub, { color: colors.textMuted }]}>
            {statusText}
          </Text>
        </View>
      </View>
      <View style={[styles.statBarTrack, { backgroundColor: colors.inactive }]}>
        <Animated.View
          style={[
            styles.statBarFill,
            { width: widthPct, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

// ─── XP Bar ───────────────────────────────────────────────────────────────────

function XPBar({
  xp,
  level,
  xpToNext,
}: {
  xp: number;
  level: number;
  xpToNext: number;
}) {
  const colors = useThemeColors();
  const xpInLevel = xp;
  const animWidth = useRef(new Animated.Value(0)).current;
  const max = xpToNext > 0 ? xpToNext : 100;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: Math.min(xpInLevel, max),
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animWidth, xpInLevel, max]);

  const widthPct = animWidth.interpolate({
    inputRange: [0, max],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.statBar}>
      <View style={styles.statBarHeader}>
        <Text style={styles.statBarEmoji}>⚡</Text>
        <Text style={[styles.statBarLabel, { color: colors.textSecondary }]}>
          Kinh nghiệm
        </Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.statBarValue, { color: colors.info }]}>
            {xpInLevel}
            <Text style={[styles.statBarValueSub, { color: colors.textMuted }]}>
              /{max} XP
            </Text>
          </Text>
          <Text style={[styles.statBarSub, { color: colors.textMuted }]}>
            {max - xpInLevel} XP để lên Lv.{level + 1}
          </Text>
        </View>
      </View>
      <View style={[styles.statBarTrack, { backgroundColor: colors.inactive }]}>
        <Animated.View
          style={[
            styles.statBarFill,
            { width: widthPct, backgroundColor: colors.info },
          ]}
        />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PetScreen() {
  const colors = useThemeColors();
  const stages = buildEvolutionStages(colors);
  const startDate = getStartOfMonth();
  const endDate = getEndOfMonth();

  // ── API Data ────────────────────────────────────────────────────────────────
  const { data: summary } = useTransactionSummary({ startDate, endDate });
  const { data: pet } = usePet();
  const { data: achievements } = useAchievements();
  const { data: streak } = useStreak();
  const { data: dailyTasks } = useDailyTasks();
  const feedPetMut = useFeedPet();
  const playPetMut = usePlayWithPet();
  const completeTaskMut = useCompleteTask();
  const checkInMut = useCheckIn();

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const net = summary?.net ?? 0;
  const count = summary?.count ?? 0;

  // Use API pet data if available, else fallback to local calc
  const health =
    pet?.hunger ??
    (net >= 0
      ? 100
      : Math.max(0, 100 - (Math.abs(net) / (totalIncome || 1)) * 100));
  const happiness = pet?.happiness ?? 50;
  const xp = pet?.xp ?? 0;
  const level = pet?.level ?? 1;
  const xpToNext = pet?.xpToNext ?? 100;
  const stage = getEvolutionStage(level, stages);
  const petEmoji = stage.emoji(health);
  const nextLevel = getNextEvolutionLevel(level);

  const dayOfMonth = new Date().getDate();
  const todayTip = DAILY_TIPS[dayOfMonth % DAILY_TIPS.length];

  // ── Animations ─────────────────────────────────────────────────────────────
  const bobAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const squishX = useRef(new Animated.Value(1)).current;
  const squishY = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -12,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    ).start();
  }, [bobAnim]);

  // ── Reactions ──────────────────────────────────────────────────────────────
  const [reactions, setReactions] = useState<{ id: number; emoji: string }[]>(
    [],
  );
  const reactionId = useRef(0);

  const removeReaction = useCallback((id: number) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const triggerReaction = useCallback(
    (emoji: string, anim: "bounce" | "shake" | "squish") => {
      const id = ++reactionId.current;
      setReactions((prev) => [...prev, { id, emoji }]);

      if (anim === "bounce") {
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.18,
            duration: 100,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.spring(bounceAnim, {
            toValue: 1,
            useNativeDriver: USE_NATIVE_DRIVER,
            friction: 4,
            tension: 280,
          }),
        ]).start();
      } else if (anim === "shake") {
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 9,
            duration: 55,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(shakeAnim, {
            toValue: -9,
            duration: 55,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(shakeAnim, {
            toValue: 6,
            duration: 55,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(shakeAnim, {
            toValue: -6,
            duration: 55,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(shakeAnim, {
            toValue: 3,
            duration: 55,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 55,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]).start();
      } else {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(squishX, {
              toValue: 1.35,
              duration: 100,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
            Animated.timing(squishY, {
              toValue: 0.75,
              duration: 100,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
          ]),
          Animated.parallel([
            Animated.spring(squishX, {
              toValue: 1,
              useNativeDriver: USE_NATIVE_DRIVER,
              friction: 4,
            }),
            Animated.spring(squishY, {
              toValue: 1,
              useNativeDriver: USE_NATIVE_DRIVER,
              friction: 4,
            }),
          ]),
        ]).start();
      }
    },
    [bounceAnim, shakeAnim, squishX, squishY],
  );

  // ── API Action Handlers ────────────────────────────────────────────────────
  const handleFeed = useCallback(() => {
    triggerReaction("🍖", "bounce");
    feedPetMut.mutate(undefined, {
      onError: () =>
        Alert.alert("Lỗi", "Không thể cho thú ăn. Vui lòng thử lại."),
    });
  }, [triggerReaction, feedPetMut]);

  const handlePlay = useCallback(() => {
    triggerReaction("🎮", "shake");
    playPetMut.mutate(undefined, {
      onError: () =>
        Alert.alert("Lỗi", "Không thể chơi với thú. Vui lòng thử lại."),
    });
  }, [triggerReaction, playPetMut]);

  const handleCheckIn = useCallback(() => {
    checkInMut.mutate();
  }, [checkInMut]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <ScreenHeader
        title="Thú cưng"
        rightElement={
          <View
            style={[
              styles.levelChip,
              {
                borderColor: `${stage.color}80`,
                backgroundColor: `${stage.color}15`,
              },
            ]}
          >
            <Text style={[styles.levelChipText, { color: stage.color }]}>
              Lv.{level}
            </Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Pet Display ── */}
        <View
          style={[
            styles.petSection,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Background glow */}
          <View
            style={[styles.petGlow, { backgroundColor: `${stage.color}0d` }]}
          />

          {/* Sparkles */}
          <Sparkle x={18} y={22} delay={0} size={7} />
          <Sparkle x={248} y={38} delay={600} size={5} />
          <Sparkle x={42} y={148} delay={1100} size={4} />
          <Sparkle x={232} y={128} delay={300} size={6} />
          <Sparkle x={135} y={8} delay={850} size={4} />
          <Sparkle x={100} y={170} delay={1500} size={5} />

          {/* Stage pill */}
          <View
            style={[
              styles.stagePill,
              {
                borderColor: `${stage.color}60`,
                backgroundColor: `${stage.color}15`,
              },
            ]}
          >
            <Text style={[styles.stagePillText, { color: stage.color }]}>
              {stage.stageName}
            </Text>
          </View>

          {/* Pet center area */}
          <View style={styles.petCenterWrap}>
            {/* Pulse rings – centered via absoluteFillObject wrapper */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                },
              ]}
            >
              <PulseRing color={stage.color} delay={0} />
            </View>
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                },
              ]}
            >
              <PulseRing color={stage.color} delay={700} />
            </View>

            {/* Floating reactions */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                },
              ]}
            >
              {reactions.map((r) => (
                <FloatingReaction
                  key={r.id}
                  emoji={r.emoji}
                  onDone={() => removeReaction(r.id)}
                />
              ))}
            </View>

            {/* Pet circle */}
            <Pressable
              onPress={() => triggerReaction("💜", "squish")}
              accessibilityLabel="Tương tác với thú cưng"
            >
              <Animated.View
                style={[
                  styles.petCircleOuter,
                  shadow(stage.color, 0, 0, 0.7, 28, 14),
                  {
                    borderColor: stage.color,
                    transform: [
                      { translateY: bobAnim },
                      { scale: bounceAnim },
                      { translateX: shakeAnim },
                    ],
                  },
                ]}
              >
                <View style={styles.petCircleInner}>
                  <Animated.Text
                    style={[
                      styles.petEmoji,
                      { transform: [{ scaleX: squishX }, { scaleY: squishY }] },
                    ]}
                  >
                    {petEmoji}
                  </Animated.Text>
                </View>
              </Animated.View>
            </Pressable>
          </View>

          {/* Pet name & mood */}
          <Text style={[styles.petName, { color: colors.textPrimary }]}>
            {stage.name}
          </Text>
          <Text style={[styles.petMood, { color: colors.textSecondary }]}>
            {health > 70
              ? "Vui vẻ & Khỏe mạnh ✨"
              : health > 40
                ? "Khá ổn 😌"
                : health > 20
                  ? "Đang lo lắng 😟"
                  : "Cần được chăm sóc 🆘"}
          </Text>

          {/* Interaction buttons */}
          <View style={styles.interactRow}>
            <Pressable
              style={({ pressed }) => [
                styles.interactBtn,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
                pressed && styles.interactBtnPressed,
              ]}
              onPress={() => triggerReaction("🤗", "squish")}
            >
              <Text style={styles.interactIcon}>🤗</Text>
              <Text
                style={[styles.interactLabel, { color: colors.textSecondary }]}
              >
                Vuốt ve
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.interactBtn,
                styles.interactBtnPrimary,
                { backgroundColor: colors.accent, borderColor: colors.accent },
                pressed && styles.interactBtnPressed,
              ]}
              onPress={handleFeed}
              disabled={feedPetMut.isPending}
              accessibilityLabel="Cho thú ăn"
            >
              <Text style={styles.interactIcon}>🍖</Text>
              <Text
                style={[styles.interactLabel, { color: colors.background }]}
              >
                {feedPetMut.isPending ? "..." : "Cho ăn"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.interactBtn,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
                pressed && styles.interactBtnPressed,
              ]}
              onPress={handlePlay}
              disabled={playPetMut.isPending}
              accessibilityLabel="Chơi với thú"
            >
              <Text style={styles.interactIcon}>⚽</Text>
              <Text
                style={[styles.interactLabel, { color: colors.textSecondary }]}
              >
                {playPetMut.isPending ? "..." : "Chơi đùa"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Evolution Progress ── */}
        {nextLevel !== null && (
          <View
            style={[
              styles.evolutionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.evolutionHeader}>
              <View style={styles.evolutionIconWrap}>
                <Text style={{ fontSize: FONT_SIZE.xl }}>🔮</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.evolutionTitle, { color: colors.textPrimary }]}
                >
                  Tiến hóa tiếp theo
                </Text>
                <Text
                  style={[styles.evolutionDesc, { color: colors.textMuted }]}
                >
                  {stage.nextDesc}
                </Text>
              </View>
              <View
                style={[
                  styles.evolutionLevelBadge,
                  {
                    backgroundColor: colors.accentDim,
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Text
                  style={[styles.evolutionLevelText, { color: colors.accent }]}
                >
                  Lv.{nextLevel}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.evolutionTrack,
                { backgroundColor: colors.inactive },
              ]}
            >
              <Animated.View
                style={[
                  styles.evolutionFill,
                  {
                    width: `${xpToNext > 0 ? Math.min(100, (xp / xpToNext) * 100) : 0}%`,
                    backgroundColor: stage.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.evolutionHint, { color: colors.textMuted }]}>
              {xpToNext - xp > 0 ? xpToNext - xp : 0} XP nữa để lên cấp
            </Text>
          </View>
        )}

        {/* ── Stats Card ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart" size={16} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Chỉ số thú cưng
            </Text>
          </View>
          <StatBar
            label="Sức khỏe"
            value={health}
            color={colors.success}
            emoji="❤️"
          />
          <StatBar
            label="Hạnh phúc"
            value={happiness}
            color={colors.warning}
            emoji="😊"
          />
          <XPBar xp={xp} level={level} xpToNext={xpToNext} />
        </View>

        {/* ── Month Summary ── */}
        <View
          style={[
            styles.summaryRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              Thu nhập
            </Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {count > 0 ? `+${totalIncome.toLocaleString("vi-VN")}₫` : "—"}
            </Text>
          </View>
          <View
            style={[styles.summaryDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              Chi tiêu
            </Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>
              {count > 0 ? `-${totalExpense.toLocaleString("vi-VN")}₫` : "—"}
            </Text>
          </View>
          <View
            style={[styles.summaryDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              Giao dịch
            </Text>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>
              {count}
            </Text>
          </View>
        </View>

        {/* ── Streak & Check-In ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: FONT_SIZE.base }}>🔥</Text>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Chuỗi đăng nhập
            </Text>
            {streak && (
              <View
                style={[
                  styles.achievementCountBadge,
                  { borderColor: colors.warning },
                ]}
              >
                <Text
                  style={[
                    styles.achievementCountText,
                    { color: colors.warning },
                  ]}
                >
                  {streak.currentStreak} ngày
                </Text>
              </View>
            )}
          </View>
          <View style={styles.streakRow}>
            <View style={styles.streakStat}>
              <Text
                style={[styles.streakStatValue, { color: colors.textPrimary }]}
              >
                {streak?.currentStreak ?? 0}
              </Text>
              <Text
                style={[styles.streakStatLabel, { color: colors.textMuted }]}
              >
                Hiện tại
              </Text>
            </View>
            <View
              style={[styles.streakDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.streakStat}>
              <Text
                style={[styles.streakStatValue, { color: colors.textPrimary }]}
              >
                {streak?.longestStreak ?? 0}
              </Text>
              <Text
                style={[styles.streakStatLabel, { color: colors.textMuted }]}
              >
                Kỷ lục
              </Text>
            </View>
            <View
              style={[styles.streakDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.streakStat}>
              <Text style={[styles.streakStatValue, { color: colors.warning }]}>
                {streak?.totalCoins ?? 0} 🪙
              </Text>
              <Text
                style={[styles.streakStatLabel, { color: colors.textMuted }]}
              >
                Xu
              </Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.checkInBtn,
              { backgroundColor: colors.accent },
              checkInMut.isSuccess && [
                styles.checkInBtnDone,
                { borderColor: colors.success },
              ],
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleCheckIn}
            disabled={checkInMut.isPending || checkInMut.isSuccess}
          >
            <Ionicons
              name={checkInMut.isSuccess ? "checkmark-circle" : "log-in"}
              size={18}
              color={checkInMut.isSuccess ? colors.success : colors.background}
            />
            <Text
              style={[
                styles.checkInBtnText,
                { color: colors.background },
                checkInMut.isSuccess && { color: colors.success },
              ]}
            >
              {checkInMut.isPending
                ? "Đang điểm danh..."
                : checkInMut.isSuccess
                  ? "Đã điểm danh hôm nay!"
                  : "Điểm danh hôm nay"}
            </Text>
          </Pressable>
        </View>

        {/* ── Daily Tasks ── */}
        {dailyTasks && dailyTasks.length > 0 && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="list" size={16} color={colors.info} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Nhiệm vụ hôm nay
              </Text>
              <View
                style={[
                  styles.achievementCountBadge,
                  { borderColor: colors.warning },
                ]}
              >
                <Text
                  style={[
                    styles.achievementCountText,
                    { color: colors.warning },
                  ]}
                >
                  {dailyTasks.filter((t) => t.status === "completed").length}/
                  {dailyTasks.length}
                </Text>
              </View>
            </View>
            {dailyTasks.map((task) => (
              <Pressable
                key={task.id}
                style={[
                  styles.taskItem,
                  { borderBottomColor: colors.border },
                  task.status === "completed" && styles.taskItemCompleted,
                ]}
                onPress={() => {
                  if (task.status === "pending")
                    completeTaskMut.mutate(task.id, {
                      onError: () =>
                        Alert.alert(
                          "Lỗi",
                          "Không thể hoàn thành nhiệm vụ. Vui lòng thử lại.",
                        ),
                    });
                }}
                disabled={
                  task.status !== "pending" || completeTaskMut.isPending
                }
              >
                <View
                  style={[
                    styles.taskCheck,
                    { borderColor: colors.border },
                    task.status === "completed" && [
                      styles.taskCheckDone,
                      {
                        backgroundColor: colors.success,
                        borderColor: colors.success,
                      },
                    ],
                  ]}
                >
                  {task.status === "completed" && (
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={colors.background}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.taskTitle,
                      { color: colors.textPrimary },
                      task.status === "completed" && [
                        styles.taskTitleDone,
                        { color: colors.textMuted },
                      ],
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text
                      style={[styles.taskDesc, { color: colors.textMuted }]}
                    >
                      {task.description}
                    </Text>
                  )}
                </View>
                <View style={styles.taskRewards}>
                  {task.xpReward > 0 && (
                    <Text
                      style={[styles.taskRewardText, { color: colors.accent }]}
                    >
                      +{task.xpReward} XP
                    </Text>
                  )}
                  {task.coinReward > 0 && (
                    <Text
                      style={[styles.taskRewardText, { color: colors.accent }]}
                    >
                      +{task.coinReward} 🪙
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Achievements ── */}
        {achievements && achievements.length > 0 && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="trophy" size={16} color={colors.warning} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Thành tựu
              </Text>
              <View
                style={[
                  styles.achievementCountBadge,
                  { borderColor: colors.warning },
                ]}
              >
                <Text
                  style={[
                    styles.achievementCountText,
                    { color: colors.warning },
                  ]}
                >
                  {achievements.filter((a) => a.unlocked).length}/
                  {achievements.length}
                </Text>
              </View>
            </View>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementBadge,
                    achievement.unlocked
                      ? [
                          styles.achievementUnlocked,
                          {
                            backgroundColor: colors.accentDim,
                            borderColor: colors.accent,
                          },
                        ]
                      : [
                          styles.achievementLocked,
                          { borderColor: colors.border },
                        ],
                  ]}
                >
                  {achievement.unlocked && (
                    <View
                      style={[
                        styles.achievementCheck,
                        { backgroundColor: colors.success },
                      ]}
                    >
                      <Ionicons
                        name="checkmark"
                        size={11}
                        color={colors.background}
                      />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.achievementEmoji,
                      !achievement.unlocked && { opacity: 0.3 },
                    ]}
                  >
                    {achievement.icon || "🏆"}
                  </Text>
                  <Text
                    style={[
                      styles.achievementTitle,
                      {
                        color: achievement.unlocked
                          ? colors.textPrimary
                          : colors.textMuted,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {achievement.name}
                  </Text>
                  {!achievement.unlocked && (
                    <Ionicons
                      name="lock-closed"
                      size={12}
                      color={colors.textMuted}
                      style={{ marginTop: SPACING.xxs }}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Daily Tip ── */}
        <View
          style={[
            styles.tipCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.tipHeader}>
            <View style={styles.tipIconWrap}>
              <Text style={styles.tipIconText}>💡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipEyebrow, { color: colors.textMuted }]}>
                MẸO TÀI CHÍNH HÔM NAY
              </Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {todayTip}
              </Text>
            </View>
          </View>
          <View style={styles.tipDots}>
            {DAILY_TIPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.tipDot,
                  { backgroundColor: colors.inactive },
                  i === dayOfMonth % DAILY_TIPS.length && [
                    styles.tipDotActive,
                    { backgroundColor: colors.accent },
                  ],
                ]}
              />
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  levelChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  levelChipText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.extrabold,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollContent: {
    padding: SPACING.lg,
    gap: 14,
  },

  // ── Pet Section ───────────────────────────────────────────────────────────
  petSection: {
    alignItems: "center",
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    gap: SPACING.sm,
  },
  petGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -60,
    alignSelf: "center",
  },
  stagePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  stagePillText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.5,
  },

  // ── Pet Center Area ───────────────────────────────────────────────────────
  petCenterWrap: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  petCircleOuter: {
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 2.5,
    padding: SPACING.xs,
  },
  petCircleInner: {
    flex: 1,
    borderRadius: 74,
    backgroundColor: "#120f1e",
    alignItems: "center",
    justifyContent: "center",
  },
  petEmoji: {
    fontSize: 70,
    lineHeight: 84,
  },

  // ── Pet Name / Mood ───────────────────────────────────────────────────────
  petName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: -0.4,
    marginTop: SPACING.xxs,
  },
  petMood: {
    fontSize: FONT_SIZE.body2,
    marginTop: -2,
  },

  // ── Interaction Buttons ───────────────────────────────────────────────────
  interactRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: SPACING.sm,
  },
  interactBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  interactBtnPrimary: {},
  interactBtnPressed: {
    opacity: 0.75,
  },
  interactIcon: {
    fontSize: FONT_SIZE.xxl,
    lineHeight: 26,
  },
  interactLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // ── Evolution Card ────────────────────────────────────────────────────────
  evolutionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: SPACING.base,
    gap: 10,
  },
  evolutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  evolutionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(192, 132, 252, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(192, 132, 252, 0.3)",
  },
  evolutionTitle: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xxs,
  },
  evolutionDesc: {
    fontSize: FONT_SIZE.sm,
  },
  evolutionLevelBadge: {
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    borderRadius: 10,
    borderWidth: 1,
  },
  evolutionLevelText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  evolutionTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  evolutionFill: {
    height: "100%",
    borderRadius: 3,
  },
  evolutionHint: {
    fontSize: FONT_SIZE.xs,
    textAlign: "right",
    marginTop: -4,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.bold,
  },

  // ── Stat Bar ──────────────────────────────────────────────────────────────
  statBar: { gap: SPACING.s },
  statBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  statBarEmoji: { fontSize: FONT_SIZE.body },
  statBarLabel: {
    flex: 1,
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.medium,
  },
  statBarValue: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
  },
  statBarValueSub: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
  },
  statBarSub: {
    fontSize: FONT_SIZE.xxs,
    textAlign: "right",
  },
  statBarTrack: {
    height: 8,
    borderRadius: RADIUS.xs,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: RADIUS.xs,
  },

  // ── Month Summary ─────────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: "row",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.base,
    gap: SPACING.xs,
  },
  summaryDivider: {
    width: 1,
    marginVertical: SPACING.md,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  summaryValue: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
  },

  // ── Achievements ──────────────────────────────────────────────────────────
  achievementCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderRadius: 10,
    borderWidth: 1,
  },
  achievementCountText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  achievementBadge: {
    width: "47.5%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: SPACING.s,
    position: "relative",
  },
  achievementUnlocked: {},
  achievementLocked: {
    backgroundColor: "rgba(39, 39, 42, 0.5)",
  },
  achievementCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementEmoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  achievementTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: "center",
    lineHeight: 17,
  },

  // ── Daily Tip ─────────────────────────────────────────────────────────────
  tipCard: {
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  tipHeader: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  tipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
    flexShrink: 0,
  },
  tipIconText: { fontSize: FONT_SIZE.xxl },
  tipEyebrow: {
    fontSize: FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  tipText: {
    fontSize: FONT_SIZE.body2,
    lineHeight: 21,
  },
  tipDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tipDotActive: {
    width: 16,
  },

  // ── Streak ────────────────────────────────────────────────────────────────
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakStat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.sm,
    gap: SPACING.xxs,
  },
  streakStatValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
  },
  streakStatLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  streakDivider: {
    width: 1,
    height: 28,
  },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 14,
  },
  checkInBtnDone: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderWidth: 1,
  },
  checkInBtnText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.bold,
  },

  // ── Daily Tasks ───────────────────────────────────────────────────────────
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: 10,
    paddingHorizontal: SPACING.xs,
    borderBottomWidth: 1,
  },
  taskItemCompleted: {
    opacity: 0.6,
  },
  taskCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckDone: {},
  taskTitle: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
  },
  taskDesc: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xxs,
  },
  taskRewards: {
    alignItems: "flex-end",
    gap: SPACING.xxs,
  },
  taskRewardText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
