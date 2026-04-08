"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  Plus,
  Trash2,
} from "lucide-react";
import {
  fetchAISessions,
  fetchAISession,
  createAISession,
  deleteAISession,
  sendAIMessage,
  type AIChatSession,
  type AIMessage,
} from "@/lib/api";

export default function AiChatPage() {
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    fetchAISessions({ limit: 50 })
      .then((res) => {
        setSessions(res.data ?? []);
        // Auto-select the most recent session
        if (res.data?.length > 0) {
          setActiveSessionId(res.data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, []);

  // Load messages when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    fetchAISession(activeSessionId)
      .then((res) => setMessages(res.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [activeSessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewSession = useCallback(async () => {
    try {
      const session = await createAISession("Cuộc trò chuyện mới");
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    } catch {
      // Silently fail
    }
  }, []);

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await deleteAISession(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
        }
      } catch {
        // Silently fail
      }
    },
    [activeSessionId],
  );

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    let sessionId = activeSessionId;

    // Create session if none active
    if (!sessionId) {
      try {
        const session = await createAISession("Cuộc trò chuyện mới");
        setSessions((prev) => [session, ...prev]);
        setActiveSessionId(session.id);
        sessionId = session.id;
      } catch {
        return;
      }
    }

    const userContent = input.trim();
    // Optimistic UI: add user message immediately
    const tempUserMsg: AIMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userContent,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await sendAIMessage(sessionId, userContent);
      // Replace temp message with real ones
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        res.userMessage,
        res.assistantMessage,
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* ── Session Sidebar ── */}
      <div className="flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-zinc-950/50">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <span className="text-sm font-semibold text-white">Chat</span>
          <button
            onClick={handleNewSession}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            title="Cuộc trò chuyện mới"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingSessions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-600">
              Chưa có cuộc trò chuyện nào
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between px-4 py-2.5 transition-colors ${
                  activeSessionId === session.id
                    ? "bg-primary-500/10 text-primary-400"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <button
                  onClick={() => setActiveSessionId(session.id)}
                  className="flex-1 truncate text-left text-sm"
                >
                  {session.title ?? "Cuộc trò chuyện"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  className="hidden rounded p-1 text-zinc-600 transition-colors hover:text-red-400 group-hover:block"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h1 className="font-display text-xl font-bold text-white">
            AI Financial Coach
          </h1>
          <p className="text-sm text-zinc-400">
            Hỏi bất cứ điều gì về tài chính cá nhân.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingMessages ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <MessageSquare size={48} className="text-zinc-600" />
              <p className="text-zinc-400">
                Bắt đầu cuộc trò chuyện với AI Coach!
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "Làm sao tiết kiệm hiệu quả?",
                  "Phân tích chi tiêu của tôi",
                  "Lời khuyên đầu tư cho người mới",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary-500/20"
                        : "bg-accent-500/20"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User size={14} className="text-primary-400" />
                    ) : (
                      <Bot size={14} className="text-accent-400" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary-500/15 text-white"
                        : "border border-white/[0.06] bg-white/[0.02] text-zinc-300"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/20">
                    <Bot size={14} className="text-accent-400" />
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.06] px-6 py-4">
          <div className="mx-auto flex max-w-3xl gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Hỏi AI Coach về tài chính..."
              disabled={sending}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-primary-500/50 focus:bg-white/[0.06] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-400 text-zinc-950 shadow-lg shadow-primary-500/25 transition-all hover:shadow-primary-500/40 hover:brightness-110 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
