"use client";

import { auth } from "./firebase";

// ── API base URL ────────────────────────────────────────────────────────────
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://fingenie-production.up.railway.app/api/v1";

// ── Authenticated fetch helper ──────────────────────────────────────────────

/**
 * Fetch wrapper that automatically attaches the Firebase ID token as
 * a Bearer token for authenticated API calls.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }

  const idToken = await user.getIdToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `API error: ${res.status} ${res.statusText}`,
    );
  }

  return res.json() as Promise<T>;
}

// ── Wallet type icon/color mapping ──────────────────────────────────────────

const WALLET_TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  cash: { icon: "💵", color: "#22c55e", label: "Tiền mặt" },
  bank: { icon: "🏦", color: "#3b82f6", label: "Ngân hàng" },
  e_wallet: { icon: "📱", color: "#a855f7", label: "Ví điện tử" },
  other: { icon: "💰", color: "#f59e0b", label: "Khác" },
};

export function getWalletMeta(type: string) {
  return WALLET_TYPE_CONFIG[type] ?? WALLET_TYPE_CONFIG.other;
}

// ── User Dashboard Types ────────────────────────────────────────────────────

export interface DashboardWallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  createdAt: string;
  _count?: { transactions: number };
}

export interface DashboardTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  note: string | null;
  date: string;
  createdAt: string;
  wallet: { id: string; name: string; type: string };
  category: { id: string; name: string; icon: string | null };
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  net: number;
  count: number;
}

export interface ApiSavingPlan {
  id: string;
  monthlyIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  savingPercent: number;
  dailyBudget: number;
  safeMoney: number;
  createdAt: string;
  updatedAt: string;
  safeMoneyConfig: {
    mode: string;
    sensitivity: number;
    threshold: number;
  } | null;
}

export interface PremiumStatus {
  isPremium: boolean;
  premiumUntil: string | null;
  subscription: {
    id: string;
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
}

export interface PaymentOrder {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
  };
}

// ── AI Chat Types ───────────────────────────────────────────────────────────

export interface AIChatSession {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

// ── API Functions ───────────────────────────────────────────────────────────

/** Fetch user profile (GET /auth/me) */
export function fetchProfile() {
  return apiFetch<{
    id: string;
    email: string | null;
    phone: string | null;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    premiumUntil: string | null;
    createdAt: string;
  }>("/auth/me");
}

/** Fetch all wallets (GET /wallets) */
export function fetchWallets() {
  return apiFetch<DashboardWallet[]>("/wallets");
}

/** Fetch recent transactions (GET /transactions) */
export function fetchTransactions(params?: {
  page?: number;
  limit?: number;
  type?: "income" | "expense";
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.type) searchParams.set("type", params.type);

  const qs = searchParams.toString();
  return apiFetch<{
    data: DashboardTransaction[];
    total: number;
    page: number;
    limit: number;
  }>(`/transactions${qs ? `?${qs}` : ""}`);
}

/** Fetch dashboard stats (GET /transactions/summary) */
export function fetchDashboardStats(query?: {
  walletId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const searchParams = new URLSearchParams();
  if (query?.walletId) searchParams.set("walletId", query.walletId);
  if (query?.startDate) searchParams.set("startDate", query.startDate);
  if (query?.endDate) searchParams.set("endDate", query.endDate);
  const qs = searchParams.toString();
  return apiFetch<DashboardStats>(`/transactions/summary${qs ? `?${qs}` : ""}`);
}

/** Fetch saving plans (GET /saving-plans) */
export function fetchSavingPlans() {
  return apiFetch<ApiSavingPlan[]>("/saving-plans");
}

/** Fetch premium status (GET /payments/status) */
export function fetchPremiumStatus() {
  return apiFetch<PremiumStatus>("/payments/status");
}

/** Fetch payment history (GET /payments/history) */
export function fetchPaymentHistory(page = 1, limit = 20) {
  return apiFetch<{
    data: PaymentOrder[];
    total: number;
    page: number;
    limit: number;
  }>(`/payments/history?page=${page}&limit=${limit}`);
}

// ── AI Chat API ─────────────────────────────────────────────────────────────

/** Get AI chat status (GET /ai-chat/status) */
export function fetchAIChatStatus() {
  return apiFetch<{
    available: boolean;
    todayMessages: number;
    dailyLimit: number;
    isPremium: boolean;
  }>("/ai-chat/status");
}

/** List all chat sessions (GET /ai-chat/sessions) */
export function fetchAISessions(params?: { page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return apiFetch<{ data: AIChatSession[]; total: number }>(
    `/ai-chat/sessions${qs ? `?${qs}` : ""}`,
  );
}

/** Create a new chat session (POST /ai-chat/sessions) */
export function createAISession(title?: string) {
  return apiFetch<AIChatSession>("/ai-chat/sessions", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

/** Get session with all messages (GET /ai-chat/sessions/:id) */
export function fetchAISession(sessionId: string) {
  return apiFetch<AIChatSession & { messages: AIMessage[] }>(
    `/ai-chat/sessions/${sessionId}`,
  );
}

/** Delete a chat session (DELETE /ai-chat/sessions/:id) */
export function deleteAISession(sessionId: string) {
  return apiFetch<void>(`/ai-chat/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

/** Send message to session (POST /ai-chat/sessions/:id/messages) */
export function sendAIMessage(sessionId: string, content: string) {
  return apiFetch<{ userMessage: AIMessage; assistantMessage: AIMessage }>(
    `/ai-chat/sessions/${sessionId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
  );
}
