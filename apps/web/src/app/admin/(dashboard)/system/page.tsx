"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpDown,
  Clock,
  Cpu,
  Database,
  MessageSquare,
  RefreshCw,
  Server,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { fetchSystemInfo, type SystemInfo } from "@/lib/admin-api";

// ── Constants ─────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 30_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function toMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1);
}

function heapPercent(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((used / total) * 100), 100);
}

function memColor(pct: number): string {
  if (pct > 90) return "bg-red-400";
  if (pct > 70) return "bg-amber-400";
  return "bg-emerald-400";
}

function memTextColor(pct: number): string {
  if (pct > 90) return "text-red-400";
  if (pct > 70) return "text-amber-400";
  return "text-emerald-400";
}

function formatLastRefresh(date: Date): string {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {ok && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`}
      />
    </span>
  );
}

function SectionSpinner() {
  return (
    <div className="flex h-32 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>
  );
}

// ── API Health Card ───────────────────────────────────────────────────────────

function ApiHealthCard({
  data,
  loading,
}: {
  data: SystemInfo | null;
  loading: boolean;
}) {
  const ok = data?.api.status === "ok";
  const uptime = data?.api.uptime ?? 0;

  return (
    <motion.div
      className="glass-strong rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10">
          <Activity className="h-5 w-5 text-primary-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Trạng thái API</h3>
          <p className="text-xs text-zinc-500">Kiểm tra kết nối máy chủ</p>
        </div>
      </div>

      {loading ? (
        <SectionSpinner />
      ) : (
        <div className="space-y-5">
          {/* Big status indicator */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                ok ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"} shadow-lg ${ok ? "shadow-emerald-400/40" : "shadow-red-400/40"}`}
              />
            </div>
            <div>
              <p
                className={`text-xl font-bold ${ok ? "text-emerald-400" : "text-red-400"}`}
              >
                {ok ? "Hoạt động" : "Lỗi"}
              </p>
              <p className="text-sm text-zinc-500">
                {ok ? "API đang hoạt động bình thường" : "API không phản hồi"}
              </p>
            </div>
          </div>

          {/* Uptime row */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Clock className="h-4 w-4 text-zinc-600" />
              Thời gian hoạt động
            </div>
            <span className="font-mono text-sm font-semibold text-white">
              {formatUptime(uptime)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Database Health Card ──────────────────────────────────────────────────────

function DatabaseHealthCard({
  data,
  loading,
}: {
  data: SystemInfo | null;
  loading: boolean;
}) {
  const ok = data?.database.status === "ok";

  return (
    <motion.div
      className="glass-strong rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10">
          <Database className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Cơ sở dữ liệu</h3>
          <p className="text-xs text-zinc-500">Trạng thái kết nối database</p>
        </div>
      </div>

      {loading ? (
        <SectionSpinner />
      ) : (
        <div className="space-y-5">
          {/* Big status indicator */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                ok ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"} shadow-lg ${ok ? "shadow-emerald-400/40" : "shadow-red-400/40"}`}
              />
            </div>
            <div>
              <p
                className={`text-xl font-bold ${ok ? "text-emerald-400" : "text-red-400"}`}
              >
                {ok ? "Đã kết nối" : "Mất kết nối"}
              </p>
              <p className="text-sm text-zinc-500">
                {ok
                  ? "Database phản hồi bình thường"
                  : "Không thể kết nối database"}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <StatusDot ok={ok} />
              Kết nối hiện tại
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                ok
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {data?.database.status ?? "—"}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Memory Usage Card ─────────────────────────────────────────────────────────

function MemoryUsageCard({
  data,
  loading,
}: {
  data: SystemInfo | null;
  loading: boolean;
}) {
  const used = data?.memory.heapUsed ?? 0;
  const total = data?.memory.heapTotal ?? 1;
  const rss = data?.memory.rss ?? 0;
  const pct = heapPercent(used, total);
  const barColor = memColor(pct);
  const textColor = memTextColor(pct);

  return (
    <motion.div
      className="glass-strong rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
          <Cpu className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Bộ nhớ Heap</h3>
          <p className="text-xs text-zinc-500">Mức sử dụng bộ nhớ Node.js</p>
        </div>
      </div>

      {loading ? (
        <SectionSpinner />
      ) : (
        <div className="space-y-5">
          {/* Percentage display */}
          <div className="flex items-end justify-between">
            <p className={`text-3xl font-bold tabular-nums ${textColor}`}>
              {pct}%
            </p>
            <p className="text-right text-xs text-zinc-500">
              {toMB(used)} MB / {toMB(total)} MB
            </p>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              style={{ transformOrigin: "left" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: pct / 100 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Threshold labels */}
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>0%</span>
            <span className="text-amber-600/70">70%</span>
            <span className="text-red-600/70">90%</span>
            <span>100%</span>
          </div>

          {/* RSS row */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-sm text-zinc-400">RSS (tổng bộ nhớ)</span>
            <span className="font-mono text-sm font-semibold text-zinc-300">
              {toMB(rss)} MB
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Platform Counts Card ──────────────────────────────────────────────────────

function PlatformCountsCard({
  data,
  loading,
}: {
  data: SystemInfo | null;
  loading: boolean;
}) {
  const counts = data?.counts;

  const rows: { label: string; value: number | undefined; icon: typeof Users; color: string; bg: string }[] = [
    {
      label: "Người dùng",
      value: counts?.users,
      icon: Users,
      color: "text-primary-400",
      bg: "bg-primary-500/10",
    },
    {
      label: "Giao dịch",
      value: counts?.transactions,
      icon: ArrowUpDown,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Đánh giá",
      value: counts?.reviews,
      icon: MessageSquare,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <motion.div
      className="glass-strong rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
          <Server className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Thống kê nền tảng</h3>
          <p className="text-xs text-zinc-500">Tổng số bản ghi trong hệ thống</p>
        </div>
      </div>

      {loading ? (
        <SectionSpinner />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${row.bg}`}
                >
                  <row.icon className={`h-4 w-4 ${row.color}`} />
                </div>
                <span className="text-sm text-zinc-400">{row.label}</span>
              </div>
              <span className={`font-mono text-lg font-bold ${row.color}`}>
                {(row.value ?? 0).toLocaleString("vi-VN")}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Refresh Button ────────────────────────────────────────────────────────────

function RefreshButton({
  onClick,
  spinning,
}: {
  onClick: () => void;
  spinning: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={spinning}
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCw
        className={`h-4 w-4 ${spinning ? "animate-spin text-primary-400" : ""}`}
      />
      <span>Tự động làm mới: 30s</span>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SystemPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const info = await fetchSystemInfo();
      setSystemInfo(info);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch system info:", err);
      setApiError(
        "Không thể tải thông tin hệ thống. Vui lòng kiểm tra kết nối API server.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 30 s
  useEffect(() => {
    void load();
    intervalRef.current = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  // Derived KPI values
  const apiOk = systemInfo?.api.status === "ok";
  const dbOk = systemInfo?.database.status === "ok";
  const heapUsedMB = toMB(systemInfo?.memory.heapUsed ?? 0);
  const heapTotalMB = toMB(systemInfo?.memory.heapTotal ?? 0);

  return (
    <div className="p-8">
      <PageHeader
        title="Sức khỏe hệ thống"
        description="Giám sát trạng thái API, cơ sở dữ liệu và tài nguyên máy chủ"
        actions={
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <p className="hidden text-xs text-zinc-600 sm:block">
                Cập nhật lúc{" "}
                <span className="text-zinc-400">
                  {formatLastRefresh(lastRefresh)}
                </span>
              </p>
            )}
            <RefreshButton onClick={load} spinning={loading} />
          </div>
        }
      />

      {/* API error banner */}
      {apiError && (
        <motion.div
          className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Activity className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{apiError}</span>
        </motion.div>
      )}

      {/* ── KPI row ── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* API Status */}
        <div className="relative">
          <StatCard
            title="Trạng thái API"
            value={loading ? "..." : apiOk ? "Hoạt động" : "Lỗi"}
            icon={Activity}
            delay={0}
          />
          {!loading && (
            <span
              className={`absolute right-4 top-4 flex h-2.5 w-2.5 items-center justify-center`}
            >
              <StatusDot ok={apiOk} />
            </span>
          )}
        </div>

        {/* Database Status */}
        <div className="relative">
          <StatCard
            title="Cơ sở dữ liệu"
            value={loading ? "..." : dbOk ? "Đã kết nối" : "Lỗi"}
            icon={Database}
            delay={0.08}
          />
          {!loading && (
            <span className="absolute right-4 top-4">
              <StatusDot ok={dbOk} />
            </span>
          )}
        </div>

        {/* Uptime */}
        <StatCard
          title="Thời gian hoạt động"
          value={
            loading ? "..." : formatUptime(systemInfo?.api.uptime ?? 0)
          }
          icon={Clock}
          delay={0.16}
        />

        {/* Heap */}
        <StatCard
          title="Bộ nhớ Heap"
          value={
            loading ? "..." : `${heapUsedMB} / ${heapTotalMB} MB`
          }
          icon={Cpu}
          delay={0.24}
        />

        {/* Node version */}
        <StatCard
          title="Phiên bản Node"
          value={loading ? "..." : (systemInfo?.node.version ?? "—")}
          icon={Server}
          delay={0.32}
        />
      </div>

      {/* ── Detail cards 2-column grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiHealthCard data={systemInfo} loading={loading} />
        <DatabaseHealthCard data={systemInfo} loading={loading} />
        <MemoryUsageCard data={systemInfo} loading={loading} />
        <PlatformCountsCard data={systemInfo} loading={loading} />
      </div>
    </div>
  );
}
