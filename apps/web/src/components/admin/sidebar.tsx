"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ArrowUpDown,
  Wallet,
  Tag,
  CreditCard,
  Receipt,
  Gamepad2,
  MessageSquare,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Tổng quan",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Phân tích", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { label: "Người dùng", href: "/admin/users", icon: Users },
      { label: "Giao dịch", href: "/admin/transactions", icon: ArrowUpDown },
      { label: "Ví", href: "/admin/wallets", icon: Wallet },
      { label: "Danh mục", href: "/admin/categories", icon: Tag },
    ],
  },
  {
    title: "Tài chính",
    items: [
      { label: "Đăng ký", href: "/admin/subscriptions", icon: CreditCard },
      { label: "Thanh toán", href: "/admin/payments", icon: Receipt },
    ],
  },
  {
    title: "Tính năng",
    items: [
      { label: "Gamification", href: "/admin/gamification", icon: Gamepad2 },
      { label: "AI Chat", href: "/admin/ai-chat", icon: MessageSquare },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`flex h-screen flex-col border-r border-white/5 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-white">Fin</span>
              <span className="bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                Genie
              </span>
            </h1>
            <span className="rounded-md bg-primary-500/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-400">
              Admin
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-primary-500/10 text-primary-400"
                        : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-primary-500/10"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}
                    <item.icon
                      className={`relative z-10 h-5 w-5 flex-shrink-0 ${
                        active ? "text-primary-400" : ""
                      }`}
                    />
                    {!collapsed && (
                      <span className="relative z-10">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="relative z-10 ml-auto rounded-full bg-primary-500/20 px-2 py-0.5 text-[10px] font-bold text-primary-400">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-white/5 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10 text-sm font-bold text-primary-400">
              {user?.displayName?.[0] ?? user?.email?.[0] ?? "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-zinc-300">
                {user?.displayName ?? "Admin"}
              </p>
              <p className="truncate text-[11px] text-zinc-600">
                {user?.email}
              </p>
            </div>
            <button
              onClick={signOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-white/5 hover:text-red-400"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-zinc-600 transition-colors hover:bg-white/5 hover:text-red-400"
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
