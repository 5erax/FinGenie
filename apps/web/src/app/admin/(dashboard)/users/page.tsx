"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpDown,
  Ban,
  ChevronDown,
  Download,
  Eye,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import {
  banUser,
  deleteUser,
  fetchUsers,
  restoreUser,
  updateUserRole,
  type AdminUser,
  type PaginatedResponse,
} from "@/lib/admin-api";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { UserDetailModal } from "@/components/admin/user-detail-modal";

const LIMIT = 20;

type SortField = "displayName" | "email" | "createdAt" | "role";
type SortDir = "asc" | "desc";

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

function StatusBadge({ status }: { status?: string }) {
  if (status === "banned") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
        <Ban className="h-3 w-3" />
        Bị khóa
      </span>
    );
  }
  return null;
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

function SortHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const isActive = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      className="cursor-pointer select-none pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 transition-colors hover:text-zinc-400"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${isActive ? "text-primary-400" : "text-zinc-700"}`}
        />
        {isActive && (
          <span className="text-[9px] text-primary-400">
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    </th>
  );
}

// ── CSV Export ──────────────────────────────────────────────────────────────────

function exportUsersCSV(users: AdminUser[]) {
  const header = "Tên,Email,SĐT,Vai trò,Premium,Ngày tạo\n";
  const rows = users
    .map((u) => {
      const name = (u.displayName ?? "").replace(/,/g, " ");
      const email = u.email ?? "";
      const phone = u.phone ?? "";
      const role = u.role;
      const premium =
        u.premiumUntil && new Date(u.premiumUntil) > new Date()
          ? "Premium"
          : "Free";
      const created = new Date(u.createdAt).toLocaleDateString("vi-VN");
      return `${name},${email},${phone},${role},${premium},${created}`;
    })
    .join("\n");

  const blob = new Blob(["\uFEFF" + header + rows], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fingenie-users-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />

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
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Per-row action states
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [banningId, setBanningId] = useState<string | null>(null);

  // User detail modal
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadUsers = useCallback(
    (p: number, s: string, role: string) => {
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
    },
    [],
  );

  // Fetch when page or role filter changes
  useEffect(() => {
    loadUsers(page, search, roleFilter);
  }, [page, roleFilter, loadUsers, search]);

  // ── Sorting (client-side on current page) ───────────────────────────────────

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedUsers = data?.data
    ? [...data.data].sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        const aVal = a[sortField] ?? "";
        const bVal = b[sortField] ?? "";
        if (sortField === "createdAt") {
          return dir * (new Date(aVal).getTime() - new Date(bVal).getTime());
        }
        return dir * String(aVal).localeCompare(String(bVal), "vi");
      })
    : [];

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
  };

  const handleRoleUpdate = async (user: AdminUser, newRole: string) => {
    if (newRole === user.role || updatingRole) return;
    setUpdatingRole(user.id);
    try {
      const updated = await updateUserRole(user.id, newRole);
      setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((u) => (u.id === user.id ? updated : u)),
            }
          : prev,
      );
    } catch (err) {
      console.error("updateUserRole:", err);
      setError("Cập nhật vai trò thất bại. Vui lòng thử lại.");
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
      setError("Xóa người dùng thất bại. Vui lòng thử lại.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBanUser = async (id: string) => {
    setBanningId(id);
    try {
      await banUser(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((u) =>
                u.id === id
                  ? { ...u, status: "banned" as never }
                  : u,
              ),
            }
          : prev,
      );
      setDetailUser(null);
    } catch (err) {
      console.error("banUser:", err);
      setError("Khóa tài khoản thất bại. Vui lòng thử lại.");
    } finally {
      setBanningId(null);
    }
  };

  const handleRestoreUser = async (id: string) => {
    setBanningId(id);
    try {
      await restoreUser(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((u) =>
                u.id === id
                  ? { ...u, status: "active" as never }
                  : u,
              ),
            }
          : prev,
      );
      setDetailUser(null);
    } catch (err) {
      console.error("restoreUser:", err);
      setError("Mở khóa tài khoản thất bại. Vui lòng thử lại.");
    } finally {
      setBanningId(null);
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
        actions={
          <button
            onClick={() => data?.data && exportUsersCSV(data.data)}
            disabled={!data?.data.length}
            className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/8 disabled:pointer-events-none disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Xuất CSV
          </button>
        }
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
        ) : sortedUsers.length === 0 ? (
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] table-fixed">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-white/5">
                  <SortHeader
                    label="Người dùng"
                    field="displayName"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Email"
                    field="email"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Vai trò"
                    field="role"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Trạng thái
                  </th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Premium
                  </th>
                  <SortHeader
                    label="Ngày tạo"
                    field="createdAt"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => {
                  const userStatus =
                    "status" in user
                      ? (user as AdminUser & { status?: string }).status
                      : undefined;
                  const isBanned = userStatus === "banned";

                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-white/3 transition-colors last:border-0 hover:bg-white/3 ${
                        isBanned ? "opacity-60" : ""
                      }`}
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
                            <p
                              className="truncate text-xs text-zinc-600"
                              title={user.firebaseUid}
                            >
                              {user.firebaseUid.slice(0, 14)}…
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email / Phone */}
                      <td className="py-3 pr-3">
                        <p className="truncate text-sm text-zinc-300">
                          {user.email ?? (
                            <span className="text-zinc-600">—</span>
                          )}
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

                      {/* Status */}
                      <td className="py-3 pr-3">
                        {isBanned ? (
                          <StatusBadge status="banned" />
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                            <UserCheck className="h-3 w-3" />
                            Active
                          </span>
                        )}
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
                        <div className="flex items-center gap-1.5">
                          {/* View detail */}
                          <button
                            onClick={() => setDetailUser(user)}
                            title="Xem chi tiết"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-zinc-600 transition-colors hover:bg-white/5 hover:text-primary-400"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

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
                                User
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

                          {/* Ban / Restore */}
                          {isBanned ? (
                            <button
                              onClick={() => handleRestoreUser(user.id)}
                              disabled={banningId === user.id}
                              title="Mở khóa tài khoản"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-zinc-600 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 disabled:pointer-events-none disabled:opacity-50"
                            >
                              {banningId === user.id ? (
                                <span className="h-3 w-3 animate-spin rounded-full border border-emerald-400 border-t-transparent" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(user.id)}
                              disabled={banningId === user.id}
                              title="Khóa tài khoản"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-zinc-600 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400 disabled:pointer-events-none disabled:opacity-50"
                            >
                              {banningId === user.id ? (
                                <span className="h-3 w-3 animate-spin rounded-full border border-amber-400 border-t-transparent" />
                              ) : (
                                <Ban className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}

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
                  );
                })}
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

      {/* ── User detail modal ── */}
      <UserDetailModal
        user={detailUser}
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        onBan={handleBanUser}
        onRestore={handleRestoreUser}
      />
    </motion.div>
  );
}
