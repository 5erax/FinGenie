"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ShieldX, LogOut, ArrowLeft } from "lucide-react";

/**
 * Wraps admin pages that require authentication AND admin role.
 * Checks Firebase custom claims for admin role.
 * - Not authenticated → redirect to /admin/login
 * - Authenticated but NOT admin → show Access Denied (no redirect to avoid loop)
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/admin/login");
      return;
    }

    // Check Firebase custom claims for admin role
    user
      .getIdTokenResult()
      .then((tokenResult) => {
        const role = tokenResult.claims.role as string | undefined;
        setIsAdmin(role === "admin");
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, [user, loading, router]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  // User is authenticated but NOT admin → show Access Denied (not redirect, to avoid loop)
  if (user && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <ShieldX className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">
            Truy cập bị từ chối
          </h2>
          <p className="mb-6 text-sm text-zinc-500">
            Tài khoản <span className="text-zinc-300">{user.email}</span> không
            có quyền admin. Liên hệ quản trị viên để được cấp quyền.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={async () => {
                await signOut();
                router.replace("/admin/login");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất & dùng tài khoản khác
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm text-zinc-600 transition-colors hover:text-zinc-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
