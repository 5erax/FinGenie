"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import {
  fetchAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type AdminCategory,
  type PaginatedResponse,
} from "@/lib/admin-api";

// ─────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────

type FilterType = "all" | "system" | "custom";

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Hệ thống", value: "system" },
  { label: "Tùy chỉnh", value: "custom" },
];

const COLOR_PRESETS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#84cc16",
  "#14b8a6",
  "#a855f7",
];

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
}

const DEFAULT_FORM: CategoryFormData = {
  name: "",
  icon: "🏷️",
  color: "#6366f1",
};

// ─────────────────────────────────────────────────────────────
// CategoryModal (Create / Edit)
// ─────────────────────────────────────────────────────────────

function CategoryModal({
  mode,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  mode: "create" | "edit";
  initial?: CategoryFormData;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  submitting: boolean;
}) {
  const [form, setForm] = useState<CategoryFormData>(initial ?? DEFAULT_FORM);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="glass-strong relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10">
              <Tag className="h-4 w-4 text-primary-400" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {mode === "create" ? "Thêm danh mục" : "Chỉnh sửa danh mục"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSubmit(form);
          }}
          className="space-y-5"
        >
          {/* Icon preview + input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Biểu tượng (Emoji)
            </label>
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
                style={{
                  backgroundColor: form.color + "28",
                  border: `1.5px solid ${form.color}50`,
                }}
              >
                {form.icon || "🏷️"}
              </div>
              <input
                type="text"
                value={form.icon}
                onChange={(e) =>
                  setForm((f) => ({ ...f, icon: e.target.value }))
                }
                placeholder="🏷️"
                className="h-10 flex-1 rounded-xl border border-white/8 bg-white/5 px-3 text-sm text-white placeholder-zinc-600 transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Tên danh mục <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="Nhập tên danh mục..."
              className="h-10 w-full rounded-xl border border-white/8 bg-white/5 px-3 text-sm text-white placeholder-zinc-600 transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
            />
          </div>

          {/* Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Màu sắc
            </label>

            {/* Preset swatches */}
            <div className="mb-3 flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className="h-6 w-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: c,
                    boxShadow:
                      form.color === c
                        ? `0 0 0 2px #18181b, 0 0 0 3.5px ${c}`
                        : "none",
                  }}
                  title={c}
                />
              ))}
            </div>

            {/* Hex input + native picker */}
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 flex-shrink-0 rounded-lg border border-white/10"
                style={{ backgroundColor: form.color }}
              />
              <input
                type="text"
                value={form.color}
                onChange={(e) =>
                  setForm((f) => ({ ...f, color: e.target.value }))
                }
                placeholder="#6366f1"
                maxLength={7}
                className="h-8 flex-1 rounded-xl border border-white/8 bg-white/5 px-3 font-mono text-xs text-zinc-300 placeholder-zinc-600 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
              />
              <input
                type="color"
                value={form.color}
                onChange={(e) =>
                  setForm((f) => ({ ...f, color: e.target.value }))
                }
                className="h-8 w-10 cursor-pointer rounded-lg border border-white/8 bg-transparent p-0.5"
                title="Chọn màu"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/8 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500/80 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {mode === "create" ? "Tạo danh mục" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DeleteDialog
// ─────────────────────────────────────────────────────────────

function DeleteDialog({
  category,
  onClose,
  onConfirm,
  deleting,
}: {
  category: AdminCategory;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="glass-strong relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Warning icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>

        <h3 className="mb-2 text-base font-semibold text-white">
          Xóa danh mục?
        </h3>
        <p className="mb-1 text-sm text-zinc-400">
          Bạn có chắc muốn xóa danh mục{" "}
          <span className="font-semibold text-zinc-200">
            {category.icon} {category.name}
          </span>
          ?
        </p>
        <p className="mb-6 text-xs text-zinc-600">
          Hành động này không thể hoàn tác.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 rounded-xl border border-white/8 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Xóa
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CategoryRow
// ─────────────────────────────────────────────────────────────

function CategoryRow({
  cat,
  index,
  onEdit,
  onDelete,
  canDelete,
}: {
  cat: AdminCategory;
  index: number;
  onEdit: (cat: AdminCategory) => void;
  onDelete: (cat: AdminCategory) => void;
  canDelete: boolean;
}) {
  const txCount = cat._count?.transactions ?? 0;

  return (
    <motion.tr
      className="group border-b border-white/5 transition-colors hover:bg-white/[0.025] last:border-0"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.035, duration: 0.2 }}
    >
      {/* Icon */}
      <td className="py-4 pl-6 pr-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-xl"
          style={{
            backgroundColor: cat.color + "28",
            border: `1.5px solid ${cat.color}45`,
          }}
        >
          {cat.icon}
        </div>
      </td>

      {/* Name + ID */}
      <td className="px-3 py-4">
        <p className="text-sm font-medium text-zinc-200">{cat.name}</p>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-600">
          {cat.id.slice(0, 8)}…
        </p>
      </td>

      {/* Color */}
      <td className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 flex-shrink-0 rounded-full ring-1 ring-white/10"
            style={{ backgroundColor: cat.color }}
            title={cat.color}
          />
          <span className="font-mono text-xs text-zinc-500">{cat.color}</span>
        </div>
      </td>

      {/* Type badge */}
      <td className="px-3 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            cat.isDefault
              ? "bg-primary-500/20 text-primary-400"
              : "bg-accent-500/20 text-accent-400"
          }`}
        >
          {cat.isDefault ? "Hệ thống" : "Tùy chỉnh"}
        </span>
      </td>

      {/* Transactions */}
      <td className="px-3 py-4 text-center">
        <span className="text-sm text-zinc-400">{txCount}</span>
      </td>

      {/* Actions */}
      <td className="py-4 pl-3 pr-6">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {cat.isDefault && (
            <button
              onClick={() => onEdit(cat)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/8 hover:text-zinc-300"
              title="Chỉnh sửa"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {canDelete ? (
            <button
              onClick={() => onDelete(cat)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="Xóa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            /* Tooltip hint for non-deleteable rows */
            txCount > 0 && cat.isDefault ? (
              <button
                disabled
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-700"
                title={`Không thể xóa (có ${txCount} giao dịch)`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [data, setData] = useState<PaginatedResponse<AdminCategory> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);

  // Mutation submitting states
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // ── Fetch ──
  useEffect(() => {
    setLoading(true);
    setApiError(null);
    fetchAdminCategories({
      page,
      limit: 15,
      isDefault:
        filter === "system"
          ? "true"
          : filter === "custom"
            ? "false"
            : undefined,
    })
      .then(setData)
      .catch((err: Error) => {
        console.error(err);
        setApiError(
          "Không thể tải danh mục. Hãy đảm bảo API server đang chạy.",
        );
      })
      .finally(() => setLoading(false));
  }, [page, filter, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  // ── Create ──
  const handleCreate = async (form: CategoryFormData) => {
    setSubmitting(true);
    setMutationError(null);
    try {
      await createCategory(form);
      setShowCreate(false);
      refresh();
    } catch (err) {
      setMutationError(
        err instanceof Error ? err.message : "Tạo danh mục thất bại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ──
  const handleEdit = async (form: CategoryFormData) => {
    if (!editTarget) return;
    setSubmitting(true);
    setMutationError(null);
    try {
      await updateCategory(editTarget.id, form);
      setEditTarget(null);
      refresh();
    } catch (err) {
      setMutationError(
        err instanceof Error ? err.message : "Cập nhật danh mục thất bại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setMutationError(null);
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      setMutationError(
        err instanceof Error ? err.message : "Xóa danh mục thất bại.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const canDeleteCategory = (cat: AdminCategory) =>
    cat.isDefault && (cat._count?.transactions ?? 0) === 0;

  return (
    <div className="p-8">
      <PageHeader
        title="Danh mục"
        description="Quản lý danh mục hệ thống và danh mục tùy chỉnh của người dùng"
        actions={
          <button
            onClick={() => {
              setMutationError(null);
              setShowCreate(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-primary-500/80 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500"
          >
            <Plus className="h-4 w-4" />
            Thêm danh mục
          </button>
        }
      />

      {/* Filter tabs + summary */}
      <motion.div
        className="mb-6 flex flex-wrap items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleFilterChange(opt.value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              filter === opt.value
                ? "bg-primary-500/20 text-primary-400"
                : "border border-white/8 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            }`}
          >
            {opt.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3">
          {data && !loading && (
            <span className="text-sm text-zinc-600">
              <span className="text-zinc-400">{data.total}</span> danh mục
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 disabled:opacity-40"
            title="Làm mới"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </motion.div>

      {/* API Error banner */}
      <AnimatePresence>
        {(apiError || mutationError) && (
          <motion.div
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <p className="flex-1 text-sm text-red-400">
              {apiError ?? mutationError}
            </p>
            <button
              onClick={() => {
                setApiError(null);
                setMutationError(null);
              }}
              className="text-red-400/60 hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table card */}
      <motion.div
        className="glass-strong overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="py-3 pl-6 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Icon
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Tên
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Màu sắc
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Loại
              </th>
              <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Giao dịch
              </th>
              <th className="py-3 pl-3 pr-6 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                    <p className="text-sm text-zinc-600">Đang tải...</p>
                  </div>
                </td>
              </tr>
            ) : !data || data.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <Tag className="mx-auto mb-3 h-9 w-9 text-zinc-700" />
                  <p className="text-sm text-zinc-500">
                    {filter === "all"
                      ? "Không có danh mục nào"
                      : filter === "system"
                        ? "Không có danh mục hệ thống"
                        : "Không có danh mục tùy chỉnh"}
                  </p>
                </td>
              </tr>
            ) : (
              <AnimatePresence mode="popLayout">
                {data.data.map((cat, idx) => (
                  <CategoryRow
                    key={cat.id}
                    cat={cat}
                    index={idx}
                    onEdit={(c) => {
                      setMutationError(null);
                      setEditTarget(c);
                    }}
                    onDelete={(c) => {
                      setMutationError(null);
                      setDeleteTarget(c);
                    }}
                    canDelete={canDeleteCategory(cat)}
                  />
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="border-t border-white/5 px-6 py-4">
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </motion.div>

      {/* Legend */}
      {!loading && data && data.data.length > 0 && (
        <motion.p
          className="mt-3 text-xs text-zinc-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          * Chỉ danh mục{" "}
          <span className="text-primary-500/70">Hệ thống</span> có thể chỉnh
          sửa. Xóa chỉ khả dụng khi chưa có giao dịch nào.
        </motion.p>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {showCreate && (
          <CategoryModal
            key="create-modal"
            mode="create"
            onClose={() => setShowCreate(false)}
            onSubmit={handleCreate}
            submitting={submitting}
          />
        )}

        {editTarget && (
          <CategoryModal
            key="edit-modal"
            mode="edit"
            initial={{
              name: editTarget.name,
              icon: editTarget.icon,
              color: editTarget.color,
            }}
            onClose={() => setEditTarget(null)}
            onSubmit={handleEdit}
            submitting={submitting}
          />
        )}

        {deleteTarget && (
          <DeleteDialog
            key="delete-dialog"
            category={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            deleting={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
