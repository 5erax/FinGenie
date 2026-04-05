"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Trophy,
  Heart,
  Zap,
  Star,
  Coins,
  Users,
  AlertCircle,
  Target,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import {
  fetchAdminPets,
  fetchAdminAchievements,
  type AdminPet,
  type AdminAchievement,
  type PaginatedResponse,
} from "@/lib/admin-api";

// ── helpers ──────────────────────────────────────────────────────────────────

const PET_EMOJI: Record<string, string> = {
  cat: "🐱",
  dog: "🐕",
  rabbit: "🐰",
  fox: "🦊",
  dragon: "🐉",
};

function petEmoji(type: string) {
  return PET_EMOJI[type.toLowerCase()] ?? "🐾";
}

const MOOD_CONFIG: Record<
  string,
  { label: string; colorClass: string; dotClass: string }
> = {
  happy: {
    label: "Vui vẻ",
    colorClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dotClass: "bg-emerald-400",
  },
  neutral: {
    label: "Bình thường",
    colorClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dotClass: "bg-amber-400",
  },
  sad: {
    label: "Buồn",
    colorClass: "bg-red-500/10 text-red-400 border border-red-500/20",
    dotClass: "bg-red-400",
  },
};

function MoodBadge({ mood }: { mood: string }) {
  const cfg = MOOD_CONFIG[mood.toLowerCase()] ?? {
    label: mood,
    colorClass: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
    dotClass: "bg-zinc-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.colorClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
}

function StatBar({
  value,
  max = 100,
  color,
}: {
  value: number;
  max?: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs text-zinc-500">{value}</span>
    </div>
  );
}

// ── tabs ─────────────────────────────────────────────────────────────────────

type Tab = "pets" | "achievements";

// ── main component ────────────────────────────────────────────────────────────

export default function GamificationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pets");

  // Pets state
  const [pets, setPets] = useState<PaginatedResponse<AdminPet> | null>(null);
  const [petsPage, setPetsPage] = useState(1);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState<string | null>(null);

  // Achievements state
  const [achievements, setAchievements] = useState<AdminAchievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [achievementsError, setAchievementsError] = useState<string | null>(
    null,
  );

  // ── fetch pets ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setPetsLoading(true);
    setPetsError(null);
    fetchAdminPets({ page: petsPage, limit: 10 })
      .then(setPets)
      .catch((err: Error) => {
        console.error("Failed to fetch pets:", err);
        setPetsError("Không thể tải danh sách thú cưng. Vui lòng thử lại.");
      })
      .finally(() => setPetsLoading(false));
  }, [petsPage]);

  // ── fetch achievements ──────────────────────────────────────────────────────
  useEffect(() => {
    if (achievements.length > 0) return; // already loaded
    setAchievementsLoading(true);
    setAchievementsError(null);
    fetchAdminAchievements()
      .then(setAchievements)
      .catch((err: Error) => {
        console.error("Failed to fetch achievements:", err);
        setAchievementsError(
          "Không thể tải danh sách thành tựu. Vui lòng thử lại.",
        );
      })
      .finally(() => setAchievementsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      <PageHeader
        title="Gamification"
        description="Quản lý thú cưng và thành tựu của người dùng"
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-1.5">
            <Gamepad2 className="h-4 w-4 text-primary-400" />
            <span className="text-sm font-medium text-zinc-300">
              Hệ thống Gamification
            </span>
          </div>
        }
      />

      {/* ── Summary stats ──────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={Heart}
          label="Tổng thú cưng"
          value={pets ? String(pets.total) : "—"}
          color="text-rose-400"
          bg="bg-rose-500/10"
          delay={0}
        />
        <SummaryCard
          icon={Trophy}
          label="Thành tựu"
          value={achievementsLoading ? "—" : String(achievements.length)}
          color="text-amber-400"
          bg="bg-amber-500/10"
          delay={0.1}
        />
        <SummaryCard
          icon={Star}
          label="Mở khoá nhiều nhất"
          value={
            achievements.length > 0
              ? String(
                  Math.max(...achievements.map((a) => a._count?.userAchievements ?? 0)),
                )
              : "—"
          }
          color="text-violet-400"
          bg="bg-violet-500/10"
          delay={0.2}
        />
        <SummaryCard
          icon={Zap}
          label="XP cao nhất"
          value={
            pets?.data.length
              ? String(Math.max(...pets.data.map((p) => p.xp)))
              : "—"
          }
          color="text-sky-400"
          bg="bg-sky-500/10"
          delay={0.3}
        />
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <motion.div
        className="glass-strong mb-6 flex gap-1 rounded-2xl p-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <TabButton
          active={activeTab === "pets"}
          icon={Heart}
          label="Thú cưng"
          count={pets?.total}
          onClick={() => setActiveTab("pets")}
        />
        <TabButton
          active={activeTab === "achievements"}
          icon={Trophy}
          label="Thành tựu"
          count={achievements.length || undefined}
          onClick={() => setActiveTab("achievements")}
        />
      </motion.div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {activeTab === "pets" ? (
        <PetsTab
          data={pets}
          loading={petsLoading}
          error={petsError}
          page={petsPage}
          onPageChange={setPetsPage}
        />
      ) : (
        <AchievementsTab
          data={achievements}
          loading={achievementsLoading}
          error={achievementsError}
        />
      )}
    </div>
  );
}

// ── SummaryCard ───────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  bg: string;
  delay: number;
}) {
  return (
    <motion.div
      className="glass-strong rounded-2xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-zinc-500">{label}</p>
          <p className="mt-0.5 text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── TabButton ─────────────────────────────────────────────────────────────────

function TabButton({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-primary-500/10 text-primary-400 border-b-2 border-primary-400"
          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            active
              ? "bg-primary-500/20 text-primary-400"
              : "bg-white/5 text-zinc-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── PetsTab ───────────────────────────────────────────────────────────────────

function PetsTab({
  data,
  loading,
  error,
  page,
  onPageChange,
}: {
  data: PaginatedResponse<AdminPet> | null;
  loading: boolean;
  error: string | null;
  page: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <motion.div
      className="glass-strong rounded-2xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
        <Heart className="h-5 w-5 text-rose-400" />
        <h3 className="font-semibold text-white">Danh sách thú cưng</h3>
        {data && (
          <span className="ml-auto text-sm text-zinc-500">
            {data.total} thú cưng
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="m-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : !error && data?.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-zinc-600">
          <Heart className="h-8 w-8" />
          <p className="text-sm">Chưa có thú cưng nào</p>
        </div>
      ) : !error && data ? (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    "Chủ sở hữu",
                    "Tên thú cưng",
                    "Loại",
                    "Cấp độ",
                    "XP",
                    "Tâm trạng",
                    "Đói",
                    "Hạnh phúc",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {data.data.map((pet, i) => (
                  <motion.tr
                    key={pet.id}
                    className="group transition-colors hover:bg-white/3"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                  >
                    {/* Owner */}
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {pet.user?.displayName ?? "—"}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {pet.user?.email ?? ""}
                        </p>
                      </div>
                    </td>

                    {/* Pet name */}
                    <td className="px-6 py-3 text-sm font-semibold text-white">
                      {pet.name}
                    </td>

                    {/* Type */}
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-sm text-zinc-300">
                        <span className="text-base leading-none">
                          {petEmoji(pet.type)}
                        </span>
                        <span className="capitalize">{pet.type}</span>
                      </span>
                    </td>

                    {/* Level */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-sm font-bold text-amber-400">
                          {pet.level}
                        </span>
                      </div>
                    </td>

                    {/* XP */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-sky-400" />
                        <span className="text-sm text-sky-300">
                          {pet.xp.toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </td>

                    {/* Mood */}
                    <td className="px-6 py-3">
                      <MoodBadge mood={pet.mood} />
                    </td>

                    {/* Hunger */}
                    <td className="px-6 py-3">
                      <StatBar value={pet.hunger} color="bg-orange-400" />
                    </td>

                    {/* Happiness */}
                    <td className="px-6 py-3">
                      <StatBar value={pet.happiness} color="bg-emerald-400" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-white/5 px-6 py-4">
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </>
      ) : null}
    </motion.div>
  );
}

// ── AchievementsTab ───────────────────────────────────────────────────────────

function AchievementsTab({
  data,
  loading,
  error,
}: {
  data: AdminAchievement[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header bar */}
      <div className="glass-strong mb-4 flex items-center gap-3 rounded-2xl px-6 py-4">
        <Trophy className="h-5 w-5 text-amber-400" />
        <h3 className="font-semibold text-white">Danh sách thành tựu</h3>
        {!loading && !error && (
          <span className="ml-auto text-sm text-zinc-500">
            {data.length} thành tựu
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : !error && data.length === 0 ? (
        <div className="glass-strong flex flex-col items-center gap-2 rounded-2xl py-16 text-zinc-600">
          <Trophy className="h-8 w-8" />
          <p className="text-sm">Chưa có thành tựu nào</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((ach, i) => (
            <AchievementCard key={ach.id} achievement={ach} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── AchievementCard ───────────────────────────────────────────────────────────

function AchievementCard({
  achievement: ach,
  index,
}: {
  achievement: AdminAchievement;
  index: number;
}) {
  const unlockedBy = ach._count?.userAchievements ?? 0;

  return (
    <motion.div
      className="glass-strong group rounded-2xl p-5 transition-all hover:border-primary-500/20 hover:bg-white/[0.04]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      {/* Top row: icon + name */}
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-2xl">
          {ach.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-white">
            {ach.name}
          </h4>
          <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">
            {ach.description}
          </p>
        </div>
      </div>

      {/* Rewards row */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2.5 py-1">
          <Zap className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-sky-300">
            +{ach.xpReward} XP
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1">
          <Coins className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-amber-300">
            +{ach.coinReward} xu
          </span>
        </div>
      </div>

      {/* Condition */}
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-white/3 px-3 py-2">
        <Target className="h-3.5 w-3.5 flex-shrink-0 text-violet-400" />
        <span className="truncate text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">{ach.conditionType}</span>
          {" ≥ "}
          <span className="font-medium text-violet-300">
            {ach.conditionValue.toLocaleString("vi-VN")}
          </span>
        </span>
      </div>

      {/* Divider */}
      <div className="mb-3 border-t border-white/5" />

      {/* Unlocked by */}
      <div className="flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-xs text-zinc-500">Đã mở khoá bởi</span>
        <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-400">
          <Sparkles className="h-3 w-3" />
          {unlockedBy.toLocaleString("vi-VN")} người dùng
        </span>
      </div>
    </motion.div>
  );
}
