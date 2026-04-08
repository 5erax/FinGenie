"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  ArrowUpDown,
  Target,
  MessageSquare,
  Crown,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

// ── Navigation items ────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ví tiền", href: "/dashboard/wallets", icon: Wallet },
  { label: "Giao dịch", href: "/dashboard/transactions", icon: ArrowUpDown },
  { label: "Mục tiêu", href: "/dashboard/goals", icon: Target },
  { label: "AI Coach", href: "/dashboard/ai-chat", icon: MessageSquare },
  { label: "Premium", href: "/dashboard/subscription", icon: Crown },
  { label: "Hồ sơ", href: "/dashboard/profile", icon: User },
];

// ── Component ───────────────────────────────────────────────────────────────

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, backendUser, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-screen flex-col border-r border-white/[0.06] bg-zinc-950"
    >
      {/* ── Logo ── */}
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight">
            <span className="text-white">F</span>
            <span className="bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
              G
            </span>
          </span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap font-display text-lg font-bold tracking-tight"
              >
                <span className="text-white">in</span>
                <span className="bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                  Genie
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4"
        aria-label="Dashboard navigation"
      >
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary-500/10 text-primary-400"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-500"
                      transition={{
                        duration: 0.25,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  )}

                  <item.icon
                    size={18}
                    className={cn(
                      "shrink-0 transition-colors",
                      active
                        ? "text-primary-400"
                        : "text-zinc-500 group-hover:text-zinc-300",
                    )}
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User section ── */}
      <div className="border-t border-white/[0.06] p-3">
        {/* User info */}
        <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt="Avatar"
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500">
              <span className="text-xs font-bold text-zinc-950">
                {(backendUser?.displayName ??
                  user?.displayName)?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="truncate text-sm font-medium text-white">
                  {backendUser?.displayName ??
                    user?.displayName ??
                    "Người dùng"}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {backendUser?.email ?? user?.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
          title={collapsed ? "Đăng xuất" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Đăng xuất
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-900 text-zinc-500 shadow-lg transition-colors hover:bg-zinc-800 hover:text-white"
        aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
