"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Inbox,
  MessageSquare,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import {
  approveReview,
  featureReview,
  fetchAdminReviews,
  fetchReviewStats,
  rejectReview,
  unfeatureReview,
  type AdminReview,
  type PaginatedResponse,
  type ReviewStats,
} from "@/lib/admin-api";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatCard } from "@/components/admin/stat-card";

const LIMIT = 15;

// ── Filter tab config ──────────────────────────────────────────────────────────

type FilterKey = "all" | "pending" | "approved" | "rejected" | "featured";

const FILTERS: { label: string; value: FilterKey }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đã duyệt", value: "approved" },
  { label: "Từ chối", value: "rejected" },
  { label: "Nổi bật", value: "featured" },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-sm tracking-wide">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-amber-400" : "text-zinc-700"}>
          {i < rating ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminReview["status"] }) {
  const map: Record<
    AdminReview["status"],
    { label: string; cls: string }
  > = {
    pending: {
      label: "Chờ duyệt",
      cls: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    },
    approved: {
      label: "Đã duyệt",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    },
    rejected: {
      label: "Từ chối",
      cls: "bg-red-500/15 text-red-400 border-red-500/25",
    },
  };
  const { label, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function UserCell({ user }: { user: AdminReview["user"] }) {
  const name = user?.displayName ?? user?.email ?? "Ẩn danh";
  const initials = name.trim().slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={name}
          className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-white/10"
        />
      ) : (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-xs font-bold text-primary-400 ring-1 ring-primary-500/20">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-300">{name}</p>
        {user?.email && (
          <p className="truncate text-xs text-zinc-600">{user.email}</p>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const [data, setData] = useState<PaginatedResponse<AdminReview> | null>(null);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterKey>("all");

  // Tracks "reviewId:action" while a mutation is in-flight
  const [actioning, setActioning] = useState<string | null>(null);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const loadStats = useCallback(() => {
    fetchReviewStats()
      .then(setStats)
      .catch((err: unknown) => console.error("fetchReviewStats:", err));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ── Reviews ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params: { page: number; limit: number; status?: string; isFeatured?: string } =
      { page, limit: LIMIT };
    if (filter !== "all") {
      if (filter === "featured") params.isFeatured = "true";
      else params.status = filter;
    }

    fetchAdminReviews(params)
      .then(setData)
      .catch((err: unknown) => {
        console.error("fetchAdminReviews:", err);
        setError(
          "Không thể tải danh sách đánh giá. Hãy đảm bảo API server đang chạy.",
        );
      })
      .finally(() => setLoading(false));
  }, [page, filter]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleFilterChange = (value: FilterKey) => {
    setFilter(value);
    setPage(1);
  };

  const handleAction = useCallback(
    async (
      reviewId: string,
      action: "approve" | "reject" | "feature" | "unfeature",
    ) => {
      if (actioning) return;
      setActioning(`${reviewId}:${action}`);
      setError(null);
      try {
        const fn = { approve: approveReview, reject: rejectReview, feature: featureReview, unfeature: unfeatureReview }[action];
        const updated = await fn(reviewId);
        // Optimistic update: swap the row in-place
        setData((prev) =>
          prev
            ? { ...prev, data: prev.data.map((r) => (r.id === reviewId ? updated : r)) }
            : prev,
        );
        // Recount stats
        loadStats();
      } catch (err) {
        console.error(`${action} review ${reviewId}:`, err);
        setError("Thao tác thất bại. Vui lòng thử lại.");
      } finally {
        setActioning(null);
      }
    },
    [actioning, loadStats],
  );

  // ── Derived ──────────────────────────────────────────────────────────────────

  const reviews = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-8"
    >
      <PageHeader
        title="Đánh giá"
        description="Kiểm duyệt và quản lý đánh giá từ người dùng"
      />

      {/* ── KPI Cards ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Tổng đánh giá"
          value={stats?.total ?? "—"}
          icon={MessageSquare}
          delay={0}
        />
        <StatCard
          title="Chờ duyệt"
          value={stats?.pending ?? "—"}
          icon={Clock}
          delay={0.05}
        />
        <StatCard
          title="Đã duyệt"
          value={stats?.approved ?? "—"}
          icon={CheckCircle}
          delay={0.1}
        />
        <StatCard
          title="Nổi bật"
          value={stats?.featured ?? "—"}
          icon={Star}
          delay={0.15}
        />
        <StatCard
          title="Điểm trung bình"
          value={stats ? `${stats.averageRating.toFixed(1)} / 5` : "—"}
          icon={Star}
          delay={0.2}
        />
      </div>

      {/* ── Filter tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mb-6 flex flex-wrap items-center gap-3"
      >
        <div className="flex gap-1 rounded-xl border border-white/8 bg-white/3 p-1">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleFilterChange(value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                filter === value
                  ? "bg-primary-500/25 text-primary-300 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {data && (
          <span className="text-sm tabular-nums text-zinc-600">
            {data.total.toLocaleString("vi-VN")} kết quả
          </span>
        )}
      </motion.div>

      {/* ── Error banner ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* ── Table card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="glass-strong rounded-2xl p-6"
      >
        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            <p className="text-sm text-zinc-500">Đang tải đánh giá…</p>
          </div>
        ) : reviews.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/60">
              <Inbox className="h-7 w-7 text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-500">
              Không có đánh giá nào
            </p>
            <p className="text-xs text-zinc-700">Thử chọn bộ lọc khác</p>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[11%]" />
                <col className="w-[27%]" />
                <col className="w-[13%]" />
                <col className="w-[11%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    "Người dùng",
                    "Đánh giá",
                    "Nội dung",
                    "Trạng thái",
                    "Ngày tạo",
                    "Hành động",
                  ].map((col) => (
                    <th
                      key={col}
                      className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => {
                  const rowActioning = actioning?.startsWith(`${review.id}:`);
                  const isApproving = actioning === `${review.id}:approve`;
                  const isRejecting = actioning === `${review.id}:reject`;
                  const isFeaturingOrUnfeaturing =
                    actioning === `${review.id}:feature` ||
                    actioning === `${review.id}:unfeature`;

                  return (
                    <tr
                      key={review.id}
                      className={`border-b border-white/3 transition-colors last:border-0 hover:bg-white/3 ${
                        rowActioning ? "opacity-70" : ""
                      }`}
                    >
                      {/* User */}
                      <td className="py-3.5 pr-4">
                        <UserCell user={review.user} />
                      </td>

                      {/* Star rating */}
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-col gap-0.5">
                          <StarRating rating={review.rating} />
                          <span className="text-xs text-zinc-600">
                            {review.rating}/5
                          </span>
                        </div>
                      </td>

                      {/* Content preview */}
                      <td className="py-3.5 pr-4">
                        <p
                          className="truncate text-sm text-zinc-400"
                          title={review.content}
                        >
                          {review.content.length > 100
                            ? `${review.content.slice(0, 100)}…`
                            : review.content}
                        </p>
                      </td>

                      {/* Status + featured flag */}
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={review.status} />
                          {review.isFeatured && (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                              <Star className="h-3 w-3 fill-yellow-400" />
                              Nổi bật
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 pr-4">
                        <p className="text-sm text-zinc-400">
                          {new Date(review.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {new Date(review.createdAt).toLocaleTimeString(
                            "vi-VN",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Approve — shown for pending / rejected */}
                          {(review.status === "pending" ||
                            review.status === "rejected") && (
                            <button
                              onClick={() =>
                                handleAction(review.id, "approve")
                              }
                              disabled={!!actioning}
                              title="Duyệt đánh giá"
                              className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:pointer-events-none disabled:opacity-50"
                            >
                              {isApproving ? (
                                <span className="h-3 w-3 animate-spin rounded-full border border-emerald-400 border-t-transparent" />
                              ) : (
                                <ThumbsUp className="h-3 w-3" />
                              )}
                              Duyệt
                            </button>
                          )}

                          {/* Reject — shown for pending / approved */}
                          {(review.status === "pending" ||
                            review.status === "approved") && (
                            <button
                              onClick={() =>
                                handleAction(review.id, "reject")
                              }
                              disabled={!!actioning}
                              title="Từ chối đánh giá"
                              className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:pointer-events-none disabled:opacity-50"
                            >
                              {isRejecting ? (
                                <span className="h-3 w-3 animate-spin rounded-full border border-red-400 border-t-transparent" />
                              ) : (
                                <ThumbsDown className="h-3 w-3" />
                              )}
                              Từ chối
                            </button>
                          )}

                          {/* Feature / Unfeature toggle — only for approved */}
                          {review.status === "approved" && (
                            <button
                              onClick={() =>
                                handleAction(
                                  review.id,
                                  review.isFeatured ? "unfeature" : "feature",
                                )
                              }
                              disabled={!!actioning}
                              title={
                                review.isFeatured
                                  ? "Bỏ nổi bật"
                                  : "Đặt nổi bật"
                              }
                              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
                                review.isFeatured
                                  ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                                  : "border-white/8 bg-white/5 text-zinc-400 hover:border-yellow-500/20 hover:bg-yellow-500/10 hover:text-yellow-400"
                              }`}
                            >
                              {isFeaturingOrUnfeaturing ? (
                                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                              ) : (
                                <Star
                                  className={`h-3 w-3 ${review.isFeatured ? "fill-yellow-400" : ""}`}
                                />
                              )}
                              {review.isFeatured ? "Bỏ nổi bật" : "Nổi bật"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer: record count + pagination */}
        {!loading && reviews.length > 0 && (
          <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
            <p className="text-xs text-zinc-600">
              Tổng{" "}
              <span className="font-semibold text-zinc-400">
                {data?.total ?? 0}
              </span>{" "}
              đánh giá
            </p>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
