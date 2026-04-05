import { api } from "@/lib/api";

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
};
