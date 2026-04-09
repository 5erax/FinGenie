import { auth } from "./firebase";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://fingenie-production.up.railway.app/api/v1";

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

interface FetchOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

export async function adminFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { method = "GET", body, params } = options;
  const headers = await getAuthHeaders();

  let url = `${API_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json();
}

// ── Dashboard ──
export interface DashboardStats {
  totalUsers: number;
  totalTransactions: number;
  totalWallets: number;
  activeSubscriptions: number;
  recentTransactions: {
    id: string;
    amount: string;
    type: "income" | "expense";
    categoryName: string;
    userName: string;
    date: string;
  }[];
  recentUsers: {
    id: string;
    displayName: string;
    email: string;
    createdAt: string;
  }[];
}

export function fetchDashboardStats() {
  return adminFetch<DashboardStats>("/users/admin/stats");
}

// ── Users ──
export interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  premiumUntil: string | null;
  firebaseUid: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
    wallets: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function fetchUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) {
  return adminFetch<PaginatedResponse<AdminUser>>("/users", { params });
}

export function fetchUserById(id: string) {
  return adminFetch<AdminUser>(`/users/${id}`);
}

export function updateUserRole(id: string, role: string) {
  return adminFetch<AdminUser>(`/users/${id}/role`, {
    method: "PATCH",
    body: { role },
  });
}

export function deleteUser(id: string) {
  return adminFetch<void>(`/users/${id}`, { method: "DELETE" });
}

// ── Transactions ──
export interface AdminTransaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  note: string | null;
  date: string;
  createdAt: string;
  category: { id: string; name: string; icon: string; color: string } | null;
  wallet: { id: string; name: string; type: string } | null;
  user: { id: string; displayName: string | null; email: string | null } | null;
}

export function fetchAdminTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return adminFetch<PaginatedResponse<AdminTransaction>>(
    "/admin/transactions",
    { params },
  );
}

// ── Wallets ──
export interface AdminWallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  createdAt: string;
  user: { id: string; displayName: string | null; email: string | null } | null;
  _count?: { transactions: number };
}

export function fetchAdminWallets(params?: {
  page?: number;
  limit?: number;
  type?: string;
  userId?: string;
}) {
  return adminFetch<PaginatedResponse<AdminWallet>>("/admin/wallets", {
    params,
  });
}

// ── Categories ──
export interface AdminCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  userId: string | null;
  createdAt: string;
  _count?: { transactions: number };
}

export function fetchAdminCategories(params?: {
  page?: number;
  limit?: number;
  isDefault?: string;
}) {
  return adminFetch<PaginatedResponse<AdminCategory>>("/admin/categories", {
    params,
  });
}

export function createCategory(data: {
  name: string;
  icon: string;
  color: string;
}) {
  return adminFetch<AdminCategory>("/admin/categories", {
    method: "POST",
    body: { ...data, isDefault: true },
  });
}

export function updateCategory(
  id: string,
  data: { name?: string; icon?: string; color?: string },
) {
  return adminFetch<AdminCategory>(`/admin/categories/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export function deleteCategory(id: string) {
  return adminFetch<void>(`/admin/categories/${id}`, { method: "DELETE" });
}

// ── Subscriptions ──
export interface AdminSubscription {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  user: { id: string; displayName: string | null; email: string | null } | null;
}

export function fetchAdminSubscriptions(params?: {
  page?: number;
  limit?: number;
  status?: string;
  plan?: string;
}) {
  return adminFetch<PaginatedResponse<AdminSubscription>>(
    "/admin/subscriptions",
    { params },
  );
}

// ── Payments ──
export interface AdminPayment {
  id: string;
  stripeSessionId: string | null;
  amount: number;
  status: string;
  createdAt: string;
  user: { id: string; displayName: string | null; email: string | null } | null;
  subscription: { id: string; plan: string } | null;
}

export function fetchAdminPayments(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return adminFetch<PaginatedResponse<AdminPayment>>("/admin/payments", {
    params,
  });
}

// ── Gamification ──
export interface AdminPet {
  id: string;
  name: string;
  type: string;
  level: number;
  xp: number;
  mood: string;
  hunger: number;
  happiness: number;
  user: { id: string; displayName: string | null; email: string | null } | null;
}

export interface AdminAchievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  conditionType: string;
  conditionValue: number;
  _count?: { userAchievements: number };
}

export function fetchAdminPets(params?: { page?: number; limit?: number }) {
  return adminFetch<PaginatedResponse<AdminPet>>("/admin/pets", { params });
}

export function fetchAdminAchievements() {
  return adminFetch<AdminAchievement[]>("/admin/achievements");
}

// ── AI Chat ──
export interface AdminAIChatSession {
  id: string;
  title: string;
  createdAt: string;
  user: { id: string; displayName: string | null; email: string | null } | null;
  _count?: { messages: number };
}

export interface AIChatStats {
  total: number;
  thisMonth: number;
}

export function fetchAdminAIChatSessions(params?: {
  page?: number;
  limit?: number;
}) {
  return adminFetch<PaginatedResponse<AdminAIChatSession>>(
    "/admin/ai-sessions",
    { params },
  );
}

export function fetchAIChatStats() {
  return adminFetch<AIChatStats>("/admin/ai-sessions/stats");
}

// ── Analytics ──
export interface AnalyticsOverview {
  userGrowth: { date: string; count: number }[];
  transactionVolume: { date: string; income: number; expense: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  topCategories: { name: string; count: number; total: number }[];
}

export function fetchAnalytics(params?: { period?: string }) {
  return adminFetch<AnalyticsOverview>("/admin/analytics", { params });
}

// ── Reviews ──
export interface AdminReview {
  id: string;
  rating: number;
  content: string;
  status: "pending" | "approved" | "rejected";
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    displayName: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  featured: number;
  averageRating: number;
}

export function fetchAdminReviews(params?: {
  page?: number;
  limit?: number;
  status?: string;
  isFeatured?: string;
}) {
  return adminFetch<PaginatedResponse<AdminReview>>("/admin/reviews", {
    params,
  });
}

export function fetchReviewStats() {
  return adminFetch<ReviewStats>("/admin/reviews/stats");
}

export function approveReview(id: string) {
  return adminFetch<AdminReview>(`/admin/reviews/${id}/approve`, {
    method: "PATCH",
  });
}

export function rejectReview(id: string) {
  return adminFetch<AdminReview>(`/admin/reviews/${id}/reject`, {
    method: "PATCH",
  });
}

export function featureReview(id: string) {
  return adminFetch<AdminReview>(`/admin/reviews/${id}/feature`, {
    method: "PATCH",
  });
}

export function unfeatureReview(id: string) {
  return adminFetch<AdminReview>(`/admin/reviews/${id}/unfeature`, {
    method: "PATCH",
  });
}

// ── User Ban / Restore ──
export function banUser(id: string) {
  return adminFetch<{ id: string; status: string }>(`/admin/users/${id}/ban`, {
    method: "PATCH",
  });
}

export function restoreUser(id: string) {
  return adminFetch<{ id: string; status: string }>(
    `/admin/users/${id}/restore`,
    { method: "PATCH" },
  );
}

// ── System Info ──
export interface SystemInfo {
  api: { status: string; uptime: number };
  database: { status: string };
  memory: { heapUsed: number; heapTotal: number; rss: number };
  node: { version: string };
  counts: { users: number; transactions: number; reviews: number };
}

export function fetchSystemInfo() {
  return adminFetch<SystemInfo>("/admin/system-info");
}
