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

// ── User Dashboard API ──────────────────────────────────────────────────────

export interface DashboardWallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  icon: string | null;
  color: string | null;
}

export interface DashboardTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  note: string | null;
  categoryName: string;
  categoryIcon: string | null;
  walletName: string;
  date: string;
  createdAt: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface SavingPlan {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  status: string;
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

/** Fetch dashboard stats (GET /transactions/stats) */
export function fetchDashboardStats(period?: string) {
  const qs = period ? `?period=${period}` : "";
  return apiFetch<DashboardStats>(`/transactions/stats${qs}`);
}

/** Fetch saving plans (GET /saving-plans) */
export function fetchSavingPlans() {
  return apiFetch<SavingPlan[]>("/saving-plans");
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
