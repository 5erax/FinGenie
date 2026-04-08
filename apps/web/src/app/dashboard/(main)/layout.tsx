"use client";

import { UserProtectedRoute } from "@/components/dashboard/protected-route";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProtectedRoute>
      <div className="flex h-screen bg-zinc-950">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </UserProtectedRoute>
  );
}
