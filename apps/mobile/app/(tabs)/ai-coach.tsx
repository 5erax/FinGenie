import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const ACCENT = '#a78bfa';

const SUGGESTIONS = [
  'Hôm nay tôi tiêu bao nhiêu?',
  'Gợi ý tiết kiệm cho tôi',
  'Phân tích chi tiêu tuần này',
];

export default function AiCoachScreen() {
  const [message, setMessage] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Ionicons name="sparkles" size={20} color={ACCENT} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Coach</Text>
            <Text style={styles.headerSub}>Trợ lý tài chính thông minh</Text>
          </View>
        </View>
        <Pressable style={styles.headerBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#a1a1aa" />
        </Pressable>
      </View>

      {/* Chat Area */}
      <ScrollView
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="sparkles" size={32} color={ACCENT} />
          </View>
          <Text style={styles.welcomeTitle}>Xin chào!</Text>
          <Text style={styles.welcomeDesc}>
            Tôi là AI Coach của FinGenie. Tôi có thể giúp bạn phân tích chi
            tiêu, gợi ý tiết kiệm, và đưa ra lời khuyên tài chính.
          </Text>
        </View>

        {/* Suggestion Chips */}
        <Text style={styles.suggestLabel}>Gợi ý câu hỏi</Text>
        <View style={styles.suggestList}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} style={styles.suggestChip}>
              <Ionicons name="chatbubble-outline" size={14} color={ACCENT} />
              <Text style={styles.suggestText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Hỏi AI Coach..."
            placeholderTextColor="#52525b"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            disabled={!message.trim()}
          >
            <Ionicons
              name="send"
              size={18}
              color={message.trim() ? '#09090b' : '#52525b'}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1f',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Chat
  chatContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
    flexGrow: 1,
  },
  // Welcome
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  // Suggestions
  suggestLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525b',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestList: {
    gap: 8,
  },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#18181b',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  suggestText: {
    fontSize: 14,
    color: '#d4d4d8',
    flex: 1,
  },
  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1c1c1f',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 15,
    color: '#ffffff',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#27272a',
  },
});
