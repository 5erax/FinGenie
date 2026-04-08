"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, Loader2, Bot, User } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history
  useEffect(() => {
    apiFetch<{ data: ChatMessage[] }>("/ai-chat/history?limit=50")
      .then((res) => setMessages(res.data?.reverse?.() ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await apiFetch<{ reply: string; message: ChatMessage }>(
        "/ai-chat/send",
        {
          method: "POST",
          body: JSON.stringify({ message: userMessage.content }),
        },
      );

      setMessages((prev) => [
        ...prev,
        {
          id: res.message?.id ?? `ai-${Date.now()}`,
          role: "assistant",
          content: res.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
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
    <div className="flex h-full flex-col">
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
        {loading ? (
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
  );
}
