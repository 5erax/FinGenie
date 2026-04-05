import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useAIStatus,
  useAISessions,
  useAISession,
  useCreateAISession,
  useDeleteAISession,
  useSendMessage,
} from "../../src/hooks/use-ai-chat";
import type { AIMessage, AIChatSession } from "../../src/services/ai-chat-service";
import { useThemeColors } from '../../src/hooks/use-theme-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, HIT_SLOP, ICON_SIZE } from "../../src/constants/theme";

const SUGGESTIONS = [
  "Hôm nay tôi tiêu bao nhiêu?",
  "Gợi ý tiết kiệm cho tôi",
  "Phân tích chi tiêu tuần này",
  "Lập kế hoạch tài chính tháng tới",
];

// ─── Session Drawer ─────────────────────────────────────
function SessionDrawer({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: {
  sessions: AIChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.drawer, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>Lịch sử trò chuyện</Text>
        <Pressable onPress={onClose} hitSlop={HIT_SLOP.sm}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable style={[styles.newChatBtn, { borderBottomColor: colors.border }]} onPress={onNew}>
        <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
        <Text style={[styles.newChatText, { color: colors.accent }]}>Cuộc trò chuyện mới</Text>
      </Pressable>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: SPACING.lg }}
        renderItem={({ item }) => {
          const lastMsg = item.messages?.[0];
          const msgCount = item._count?.messages ?? 0;
          const isActive = item.id === activeId;

          return (
            <Pressable
              style={[
                styles.sessionItem,
                isActive && styles.sessionItemActive,
              ]}
              onPress={() => onSelect(item.id)}
              onLongPress={() => {
                Alert.alert("Xoá cuộc trò chuyện?", item.title, [
                  { text: "Huỷ", style: "cancel" },
                  {
                    text: "Xoá",
                    style: "destructive",
                    onPress: () => onDelete(item.id),
                  },
                ]);
              }}
            >
              <Ionicons
                name="chatbubble-outline"
                size={ICON_SIZE.sm}
                color={isActive ? colors.accent : colors.textMuted}
              />
              <View style={styles.sessionInfo}>
                <Text
                  style={[
                    styles.sessionTitle,
                    { color: isActive ? colors.accent : colors.textSecondary },
                    isActive && styles.sessionTitleActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {lastMsg ? (
                  <Text style={[styles.sessionPreview, { color: colors.textDark }]} numberOfLines={1}>
                    {lastMsg.content}
                  </Text>
                ) : null}
              </View>
              {msgCount > 0 && (
                <Text style={[styles.sessionCount, { color: colors.textMuted, backgroundColor: colors.border }]}>
                  {msgCount}
                </Text>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có cuộc trò chuyện nào</Text>
        }
      />
    </View>
  );
}

// ─── Message Bubble ──────────────────────────────────────
function MessageBubble({ msg }: { msg: AIMessage }) {
  const colors = useThemeColors();
  const isUser = msg.role === "user";
  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAssistant,
      ]}
    >
      {!isUser && (
        <View style={styles.bubbleIcon}>
          <Ionicons name="sparkles" size={ICON_SIZE.xs} color={colors.accent} />
        </View>
      )}
      <View
        style={[
          styles.bubbleContent,
          isUser
            ? [styles.bubbleContentUser, { backgroundColor: colors.accent }]
            : [styles.bubbleContentAssistant, { backgroundColor: colors.surface, borderColor: colors.border }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser
              ? { color: colors.background }
              : { color: colors.textSecondary },
          ]}
        >
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

// ─── Typing Indicator ────────────────────────────────────
function TypingIndicator() {
  const colors = useThemeColors();
  return (
    <View style={[styles.bubble, styles.bubbleAssistant]}>
      <View style={styles.bubbleIcon}>
        <Ionicons name="sparkles" size={ICON_SIZE.xs} color={colors.accent} />
      </View>
      <View
        style={[
          styles.bubbleContent,
          styles.bubbleContentAssistant,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.typingDots}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.typingText, { color: colors.textMuted }]}>Đang suy nghĩ...</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Welcome View ────────────────────────────────────────
function WelcomeView({
  onSuggestion,
  remaining,
}: {
  onSuggestion: (text: string) => void;
  remaining: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeIcon}>
        <Ionicons name="sparkles" size={ICON_SIZE.xl} color={colors.accent} />
      </View>
      <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Xin chào!</Text>
      <Text style={[styles.welcomeDesc, { color: colors.textMuted }]}>
        Tôi là AI Coach của FinGenie. Tôi có thể giúp bạn phân tích chi tiêu,
        gợi ý tiết kiệm, và đưa ra lời khuyên tài chính.
      </Text>
      <Text style={[styles.remainingText, { color: colors.accent }]}>{remaining}</Text>

      <Text style={[styles.suggestLabel, { color: colors.textDark }]}>Gợi ý câu hỏi</Text>
      <View style={styles.suggestList}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            style={[styles.suggestChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onSuggestion(s)}
          >
            <Ionicons name="chatbubble-outline" size={ICON_SIZE.xs} color={colors.accent} />
            <Text style={[styles.suggestText, { color: colors.textSecondary }]}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export default function AiCoachScreen() {
  const colors = useThemeColors();
  const [message, setMessage] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Queries
  const { data: status } = useAIStatus();
  const { data: sessionsData, refetch: refetchSessions } = useAISessions();
  const {
    data: sessionData,
    isLoading: isLoadingSession,
    refetch: refetchSession,
  } = useAISession(activeSessionId);

  // Mutations
  const createSession = useCreateAISession();
  const deleteSession = useDeleteAISession();
  const sendMessageMutation = useSendMessage();

  const sessions = sessionsData?.data ?? [];
  const messages = sessionData?.messages ?? [];
  const isSending = sendMessageMutation.isPending;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isSending]);

  const remainingText = status
    ? status.isPremium
      ? "Premium • Không giới hạn tin nhắn"
      : `${status.todayMessages}/${status.dailyLimit ?? 5} tin nhắn hôm nay`
    : "";

  const canSend =
    message.trim().length > 0 &&
    !isSending &&
    // Allow sending if status hasn't loaded yet (optimistic)
    // or if premium, or if under daily limit
    (!status ||
      status.isPremium ||
      (status.dailyLimit != null &&
        status.todayMessages < status.dailyLimit));

  // ─── Handlers ────────────────────────────────────────
  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? message).trim();
      if (!content) return;

      let sessionId = activeSessionId;

      // Create session if none active
      if (!sessionId) {
        try {
          const newSession = await createSession.mutateAsync(
            content.slice(0, 50),
          );
          sessionId = newSession.id;
          setActiveSessionId(sessionId);
        } catch {
          Alert.alert("Lỗi", "Không thể tạo cuộc trò chuyện. Thử lại sau.");
          return;
        }
      }

      setMessage("");

      try {
        await sendMessageMutation.mutateAsync({
          sessionId,
          content,
        });
        refetchSession();
      } catch {
        Alert.alert("Lỗi", "Không thể gửi tin nhắn. Thử lại sau.");
      }
    },
    [
      message,
      activeSessionId,
      createSession,
      sendMessageMutation,
      refetchSession,
    ],
  );

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setShowDrawer(false);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setShowDrawer(false);
  }, []);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      try {
        await deleteSession.mutateAsync(id);
        if (activeSessionId === id) {
          setActiveSessionId(null);
        }
        refetchSessions();
      } catch {
        Alert.alert("Lỗi", "Không thể xoá cuộc trò chuyện.");
      }
    },
    [activeSessionId, deleteSession, refetchSessions],
  );

  // ─── Render ──────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <Pressable
          style={[styles.headerBtn, { backgroundColor: colors.surface }]}
          onPress={() => setShowDrawer(true)}
        >
          <Ionicons name="menu" size={ICON_SIZE.md} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Ionicons name="sparkles" size={ICON_SIZE.sm} color={colors.accent} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {sessionData?.title ?? "AI Coach"}
          </Text>
        </View>
        <Pressable
          style={[styles.headerBtn, { backgroundColor: colors.surface }]}
          onPress={handleNewChat}
        >
          <Ionicons name="create-outline" size={ICON_SIZE.md} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Session Drawer Overlay */}
      {showDrawer && (
        <Pressable
          style={styles.overlay}
          onPress={() => setShowDrawer(false)}
        >
          <Pressable onPress={() => {}}>
            <SessionDrawer
              sessions={sessions}
              activeId={activeSessionId}
              onSelect={handleSelectSession}
              onNew={handleNewChat}
              onDelete={handleDeleteSession}
              onClose={() => setShowDrawer(false)}
            />
          </Pressable>
        </Pressable>
      )}

      {/* Chat Content */}
      {!activeSessionId && !isLoadingSession ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <WelcomeView
              onSuggestion={(text) => handleSend(text)}
              remaining={remainingText}
            />
          }
          contentContainerStyle={styles.chatContent}
        />
      ) : isLoadingSession ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          ListFooterComponent={isSending ? <TypingIndicator /> : null}
          ListEmptyComponent={
            <WelcomeView
              onSuggestion={(text) => handleSend(text)}
              remaining={remainingText}
            />
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      {/* AI Unavailable Banner */}
      {status && !status.available && (
        <View style={[styles.statusBar, { backgroundColor: '#7f1d1d' }]}>
          <Ionicons name="warning-outline" size={ICON_SIZE.xs} color="#fca5a5" />
          <Text style={[styles.statusText, { color: '#fca5a5' }]}>
            AI Coach hiện không khả dụng. Vui lòng thử lại sau.
          </Text>
        </View>
      )}

      {/* Status Bar */}
      {status && status.available && !status.isPremium && (
        <View style={[styles.statusBar, { borderTopColor: colors.borderLight }]}>
          <Ionicons name="information-circle-outline" size={ICON_SIZE.xs} color={colors.textMuted} />
          <Text style={[styles.statusText, { color: colors.textMuted }]}>{remainingText}</Text>
        </View>
      )}

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.inputBar, { borderTopColor: colors.borderLight }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            placeholder="Hỏi AI Coach..."
            placeholderTextColor={colors.textDark}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={2000}
            editable={!isSending}
            onSubmitEditing={() => canSend && handleSend()}
          />
          <Pressable
            style={[
              styles.sendBtn,
              { backgroundColor: canSend ? colors.accent : colors.border },
            ]}
            disabled={!canSend}
            onPress={() => handleSend()}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={canSend ? colors.background : colors.textDark}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  // Drawer overlay
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 100,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    borderRightWidth: 1,
    paddingTop: 60,
    zIndex: 101,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
  },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  newChatText: {
    fontSize: FONT_SIZE.body2,
    fontWeight: FONT_WEIGHT.semibold,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  sessionItemActive: {
    backgroundColor: "rgba(167, 139, 250, 0.1)",
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionTitle: {
    fontSize: FONT_SIZE.body2,
  },
  sessionTitleActive: {
    fontWeight: FONT_WEIGHT.semibold,
  },
  sessionPreview: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 16,
  },
  sessionCount: {
    fontSize: FONT_SIZE.xs,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: "hidden",
    minWidth: 20,
    textAlign: "center",
  },
  emptyText: {
    fontSize: FONT_SIZE.caption,
    textAlign: "center",
    marginTop: SPACING.xl,
  },

  // Chat content
  chatContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.base,
    flexGrow: 1,
  },
  messageList: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.body2,
  },

  // Bubbles
  bubble: {
    flexDirection: "row",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  bubbleUser: {
    justifyContent: "flex-end",
  },
  bubbleAssistant: {
    justifyContent: "flex-start",
  },
  bubbleIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(167, 139, 250, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xxs,
  },
  bubbleContent: {
    maxWidth: "75%",
    borderRadius: RADIUS.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleContentUser: {
    borderBottomRightRadius: RADIUS.xs,
  },
  bubbleContentAssistant: {
    borderBottomLeftRadius: RADIUS.xs,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: FONT_SIZE.body,
    lineHeight: 22,
  },

  // Typing
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  typingText: {
    fontSize: FONT_SIZE.caption,
  },

  // Welcome
  welcomeContainer: {
    alignItems: "center",
    paddingTop: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "rgba(167, 139, 250, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.base,
  },
  welcomeTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
  },
  welcomeDesc: {
    fontSize: FONT_SIZE.body2,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: SPACING.sm,
  },
  remainingText: {
    fontSize: FONT_SIZE.sm,
    marginBottom: 28,
  },
  suggestLabel: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    alignSelf: "flex-start",
  },
  suggestList: {
    gap: SPACING.sm,
    width: "100%",
  },
  suggestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    borderWidth: 1,
  },
  suggestText: {
    fontSize: FONT_SIZE.body2,
    flex: 1,
  },

  // Status bar
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.s,
    paddingVertical: SPACING.s,
    borderTopWidth: 1,
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
  },

  // Input
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.body,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
