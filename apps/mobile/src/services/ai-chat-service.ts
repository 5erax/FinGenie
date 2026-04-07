import { api } from "@/lib/api";
import { API_BASE_URL } from "@/constants/config";

export interface AIStatus {
  available: boolean;
  todayMessages: number;
  dailyLimit: number | null;
  isPremium: boolean;
  unavailableReason?: string;
}

export interface AIChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
  messages?: { content: string; createdAt: string }[];
}

export interface AIMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface SendMessageResponse {
  userMessage: AIMessage;
  assistantMessage: AIMessage;
}

// SSE event types from the streaming endpoint
export type StreamEvent =
  | { type: "user_message"; userMessage: AIMessage }
  | { type: "chunk"; content: string }
  | { type: "done"; assistantMessage: AIMessage }
  | { type: "error"; message: string; statusCode: number };

// Get auth token for fetch-based requests (bypasses axios)
function getAuthToken(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require("@/stores/auth-store");
  return useAuthStore.getState().token;
}

export const aiChatService = {
  async getStatus(): Promise<AIStatus> {
    const response = await api.get<AIStatus>("/ai-chat/status");
    return response.data;
  },

  async getSessions(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<AIChatSession>> {
    const response = await api.get<PaginatedResponse<AIChatSession>>(
      "/ai-chat/sessions",
      { params: { page, limit } },
    );
    return response.data;
  },

  async createSession(title?: string): Promise<AIChatSession> {
    const response = await api.post<AIChatSession>("/ai-chat/sessions", {
      title: title ?? "Cuộc trò chuyện mới",
    });
    return response.data;
  },

  async getSession(
    sessionId: string,
  ): Promise<AIChatSession & { messages: AIMessage[] }> {
    const response = await api.get<AIChatSession & { messages: AIMessage[] }>(
      `/ai-chat/sessions/${sessionId}`,
    );
    return response.data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/ai-chat/sessions/${sessionId}`);
  },

  async sendMessage(
    sessionId: string,
    content: string,
  ): Promise<SendMessageResponse> {
    const response = await api.post<SendMessageResponse>(
      `/ai-chat/sessions/${sessionId}/messages`,
      { content },
    );
    return response.data;
  },

  /**
   * Send a message and stream the AI response via SSE.
   * Uses native fetch to consume the text/event-stream on web.
   * Falls back to non-streaming endpoint on native (ReadableStream unsupported).
   * Calls `onEvent` for each parsed SSE event.
   * Returns an AbortController so the caller can cancel the stream.
   */
  sendMessageStream(
    sessionId: string,
    content: string,
    onEvent: (event: StreamEvent) => void,
    onError?: (error: Error) => void,
  ): AbortController {
    const controller = new AbortController();

    const runStreaming = async () => {
      const token = getAuthToken();
      const url = `${API_BASE_URL}/ai-chat/sessions/${sessionId}/messages/stream`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        // ReadableStream not supported (React Native) — fall back to non-streaming
        throw new Error("ReadableStream not supported");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines: each event is "data: {...}\n\n"
        const lines = buffer.split("\n");
        buffer = "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6)) as StreamEvent;
              onEvent(parsed);
            } catch {
              // Incomplete JSON — put it back in the buffer
              buffer = lines.slice(i).join("\n");
              break;
            }
          } else if (line !== "") {
            // Non-empty, non-data line — keep in buffer (might be partial)
            buffer = lines.slice(i).join("\n");
            break;
          }
        }
      }
    };

    /**
     * Fallback: use the non-streaming endpoint and simulate stream events.
     * This works on all platforms (React Native included).
     */
    const runFallback = async () => {
      const result = await aiChatService.sendMessage(sessionId, content);

      // Emit events in the same order as the streaming endpoint
      onEvent({ type: "user_message", userMessage: result.userMessage });
      onEvent({ type: "chunk", content: result.assistantMessage.content });
      onEvent({
        type: "done",
        assistantMessage: result.assistantMessage,
      });
    };

    runStreaming()
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;

        // If streaming failed (e.g. ReadableStream not supported), try non-streaming
        return runFallback();
      })
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        onError?.(err instanceof Error ? err : new Error(String(err)));
      });

    return controller;
  },
};
