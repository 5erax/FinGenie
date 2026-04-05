"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Calendar,
  Hash,
  MessageSquare,
  User,
} from "lucide-react";
import {
  fetchAdminAIChatSessions,
  type AdminAIChatSession,
  type PaginatedResponse,
} from "@/lib/admin-api";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatCard } from "@/components/admin/stat-card";

const LIMIT = 20;

export default function AdminAIChatPage() {
  const [data, setData] = useState<PaginatedResponse<AdminAIChatSession> | null>(
    null,
  );
  const [allSessions, setAllSessions] = useState<AdminAIChatSession[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compute "this month" count from the bulk-fetched stats data
  const thisMonthCount = (() => {
    if (!allSessions.length) return 0;
    const now = new Date();
    return allSessions.filter((s) => {
      const d = new Date(s.createdAt);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;
  })();

  const fetchTablePage = useCallback((p: number) => {
    setLoading(true);
    setError(null);
    fetchAdminAIChatSessions({ page: p, limit: LIMIT })
      .then(setData)
      .catch((err) => {
        console.error("Failed to fetch AI chat sessions:", err);
        setError(
          "Không thể tải dữ liệu. Hãy đảm bảo API server đang chạy trên localhost:4000.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // One-time bulk fetch for stats computation (this month count)
    fetchAdminAIChatSessions({ page: 1, limit: 1000 })
      .then((res) => setAllSessions(res.data))
      .catch(console.error)
      .finally(() => setStatsLoading(false));

    fetchTablePage(1);
  }, [fetchTablePage]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchTablePage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sessions = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  return (
    <div className="p-8">
      <PageHeader
        title="Phiên AI Chat"
        description="Quản lý các phiên hội thoại AI của người dùng"
      />

      {/* API Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <Activity className="mb-1 inline h-4 w-4" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Tổng phiên chat"
          value={loading ? "..." : total}
          icon={MessageSquare}
          delay={0}
        />
        <StatCard
          title="Tháng này"
          value={statsLoading ? "..." : thisMonthCount}
          icon={Calendar}
          delay={0.1}
        />
      </div>

      {/* Sessions Table */}
      <motion.div
        className="glass-strong rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Table Title */}
        <div className="mb-5 flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary-400" />
          <h3 className="font-semibold text-white">Danh sách phiên chat</h3>
          {!loading && total > 0 && (
            <span className="ml-auto text-sm text-zinc-500">
              {total} phiên
            </span>
          )}
        </div>

        {/* Column Headers */}
        <div className="mb-2 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_96px_128px] gap-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          <span className="flex items-center gap-1.5">
            <User className="h-3 w-3" />
            Người dùng
          </span>
          <span className="flex items-center gap-1.5">
            <Bot className="h-3 w-3" />
            Tiêu đề
          </span>
          <span className="flex items-center gap-1.5">
            <Hash className="h-3 w-3" />
            Số tin nhắn
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Ngày tạo
          </span>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 py-16 text-zinc-600">
            <MessageSquare className="h-12 w-12 opacity-30" />
            <p className="text-sm">Chưa có phiên chat nào</p>
          </div>
        ) : (
          /* Rows */
          <div className="space-y-1.5">
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_96px_128px] gap-4 rounded-lg bg-white/3 px-3 py-3 text-sm transition-colors hover:bg-white/5"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.025 }}
              >
                {/* User */}
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-300">
                    {session.user?.displayName ?? (
                      <span className="text-zinc-600">—</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-zinc-600">
                    {session.user?.email ?? ""}
                  </p>
                </div>

                {/* Title */}
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
                    <Bot className="h-3.5 w-3.5 text-primary-400" />
                  </div>
                  <p className="truncate text-zinc-300">
                    {session.title ? (
                      session.title
                    ) : (
                      <span className="italic text-zinc-600">
                        Không có tiêu đề
                      </span>
                    )}
                  </p>
                </div>

                {/* Message count badge */}
                <div className="flex items-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-400">
                    <MessageSquare className="h-3 w-3" />
                    {session._count?.messages ?? 0}
                  </span>
                </div>

                {/* Created At */}
                <div className="flex items-center text-xs text-zinc-500">
                  {new Date(session.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </motion.div>
    </div>
  );
}
