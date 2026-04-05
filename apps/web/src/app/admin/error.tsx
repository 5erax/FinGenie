"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
        <svg
          className="h-8 w-8 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white">Lỗi Admin Dashboard</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Không thể tải trang quản trị. Vui lòng thử lại hoặc kiểm tra kết nối
          API.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:shadow-lg hover:shadow-primary-500/25"
        >
          Thử lại
        </button>
        <Link
          href="/admin/login"
          className="flex items-center rounded-xl border border-white/8 px-6 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          Đăng nhập lại
        </Link>
      </div>
    </div>
  );
}
