"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  deleteUser,
  fetchUsers,
  updateUserRole,
  type AdminUser,
  type PaginatedResponse,
} from "@/lib/admin-api";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";

const LIMIT = 20;

// ── Sub-components ─────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: AdminUser }) {
  const initials = (user.displayName ?? user.email ?? "?")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName ?? "avatar"}
        className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-white/10"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-xs font-bold text-primary-400 ring-1 ring-primary-500/20">
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/20 px-2.5 py-0.5 text-xs font-medium text-primary-400">
        <Shield className="h-3 w-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/20 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
      <ShieldOff className="h-3 w-3" />
      User
    </span>
  );
}

function PremiumBadge({ premiumUntil }: { premiumUntil: string | null }) {
  const isActive = !!premiumUntil && new Date(premiumUntil) > new Date();

  if (isActive) {
    return (
      <div>
        <span className="inline-flex rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
          Premium
        </span>
        <p className="mt-0.5 text-xs text-zinc-600">
          đến {new Date(premiumUntil!).toLocaleDateString("vi-VN")}
        </p>
      </div>
    );
  }

  if (premiumUntil) {
    return (
      <div>
        <span className="inline-flex rounded-full bg-zinc-500/20 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
          Hết hạn
        </span>
        <p className="mt-0.5 text-xs text-zinc-600">
          {new Date(premiumUntil).toLocaleDateString("vi-VN")}
        </p>
      </div>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-zinc-500/20 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
      Free
    </span>
  );
}

// ── Delete confirmation dialog ─────────────────────────────────────────────────

interface DeleteDialogProps {
  user: AdminUser;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteDialog({
  user,
  loading,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="glass-strong relative z-10 w-full max-w-md rounded-2xl p-6"
      >
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Xóa người dùng
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
              Bạn có chắc muốn xóa{" "}
              <span className="font-medium text-zinc-200">
                {user.displayName ?? user.email ?? "người dùng này"}
              </span>
              ? Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn và không thể khôi
              phục.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-white/8 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
            )}
            Xóa người dùng
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [data, setData] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Per-row action states
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadUsers = (p: number, s: string, role: string) => {
    setLoading(true);
    setError(null);
    fetchUsers({
      page: p,
      limit: LIMIT,
      search: s.trim() || undefined,
      role: role === "all" ? undefined : role,
    })
      .then(setData)
      .catch((err: unknown) => {
        console.error("fetchUsers:", err);
        setError(
          "Không thể tải danh sách người dùng. Hãy đảm bảo API server đang chạy.",
        );
      })
      .finally(() => setLoading(false));
  };

  // Fetch when page or role filter changes
  useEffect(() => {
    loadUsers(page, search, roleFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadUsers(1, value, roleFilter);
    }, 300);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
    // useEffect will re-fire via roleFilter dependency
  };

  const handleRoleUpdate = async (user: AdminUser, newRole: string) => {
    if (newRole === user.role || updatingRole) return;
    setUpdatingRole(user.id);
    try {
      const updated = await updateUserRole(user.id, newRole);
      setData((prev) =>
        prev
          ? { ...prev, data: prev.data.map((u) => (u.id === user.id ? updated : u)) }
          : prev,
      );
    } catch (err) {
      console.error("updateUserRole:", err);
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.filter((u) => u.id !== deleteTarget.id),
              total: prev.total - 1,
            }
          : prev,
      );
      setDeleteTarget(null);
    } catch (err) {
      console.error("deleteUser:", err);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = data?.totalPages ?? 1;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-8"
    >
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản và phân quyền người dùng hệ thống"
      />

      {/* ── Toolbar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm kiếm tên, email..."
            className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pl-10 pr-9 text-sm text-white placeholder-zinc-600 focus:border-primary-500/50 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors hover:text-zinc-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Role filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              className="appearance-none rounded-xl border border-white/8 bg-white/5 py-2.5 pl-4 pr-8 text-sm text-zinc-300 focus:border-primary-500/50 focus:outline-none"
            >
              <option value="all" className="bg-zinc-900">
                Tất cả vai trò
              </option>
              <option value="user" className="bg-zinc-900">
                Người dùng
              </option>
              <option value="admin" className="bg-zinc-900">
                Admin
              </option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          </div>

          {/* Total badge */}
          {data && (
            <div className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
              <Users className="h-4 w-4 text-zinc-500" />
              <span className="text-sm tabular-nums text-zinc-400">
                {data.total.toLocaleString("vi-VN")}
              </span>
            </div>
          )}
        </div>
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
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : data?.data.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/60">
              <Users className="h-7 w-7 text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-500">
              Không tìm thấy người dùng nào
            </p>
            {search && (
              <p className="mt-1 text-xs text-zinc-700">
                Thử thay đổi từ khóa tìm kiếm
              </p>
            )}
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    "Người dùng",
                    "Email / SĐT",
                    "Vai trò",
                    "Premium",
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
                {data?.data.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/3 transition-colors last:border-0 hover:bg-white/3"
                  >
                    {/* Avatar + Name */}
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-300">
                            {user.displayName ?? (
                              <span className="text-zinc-600">—</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-zinc-600" title={user.firebaseUid}>
                            {user.firebaseUid.slice(0, 14)}…
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email / Phone */}
                    <td className="py-3 pr-3">
                      <p className="truncate text-sm text-zinc-300">
                        {user.email ?? <span className="text-zinc-600">—</span>}
                      </p>
                      {user.phone && (
                        <p className="mt-0.5 truncate text-xs text-zinc-600">
                          {user.phone}
                        </p>
                      )}
                    </td>

                    {/* Role badge */}
                    <td className="py-3 pr-3">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Premium */}
                    <td className="py-3 pr-3">
                      <PremiumBadge premiumUntil={user.premiumUntil} />
                    </td>

                    {/* Created at */}
                    <td className="py-3 pr-3">
                      <p className="text-sm text-zinc-400">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {new Date(user.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {/* Role select */}
                        <div className="relative">
                          <select
                            value={user.role}
                            disabled={updatingRole === user.id}
                            onChange={(e) =>
                              handleRoleUpdate(user, e.target.value)
                            }
                            className="appearance-none rounded-lg border border-white/8 bg-white/5 py-1.5 pl-3 pr-7 text-xs text-zinc-300 transition-colors hover:bg-white/8 focus:border-primary-500/50 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                          >
                            <option value="user" className="bg-zinc-900">
                              Người dùng
                            </option>
                            <option value="admin" className="bg-zinc-900">
                              Admin
                            </option>
                          </select>
                          {updatingRole === user.id ? (
                            <span className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border border-primary-400 border-t-transparent" />
                          ) : (
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-600" />
                          )}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => setDeleteTarget(user)}
                          title="Xóa người dùng"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-zinc-600 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </motion.div>

      {/* ── Delete dialog ── */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteDialog
            user={deleteTarget}
            loading={deleting}
            onConfirm={handleDeleteConfirm}
            onCancel={() => {
              if (!deleting) setDeleteTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
