/**
 * Format a number as Vietnamese Dong currency.
 * Guards against NaN/Infinity — returns "0 ₫" for invalid input.
 */
export function formatVND(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(safe);
}

/**
 * Format a number with + or - prefix and VND currency.
 * Guards against NaN/Infinity.
 */
export function formatVNDSigned(
  amount: number,
  type: "income" | "expense",
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const prefix = type === "income" ? "+" : "-";
  return `${prefix}${formatVND(Math.abs(safe))}`;
}

/**
 * Format a date to Vietnamese locale string
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Format a date to relative time (e.g. "2 giờ trước").
 * Returns empty string for invalid dates.
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatDate(dateStr);
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get start of current month as ISO string
 */
export function getStartOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

/**
 * Get end of current month as ISO string
 */
export function getEndOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
}
