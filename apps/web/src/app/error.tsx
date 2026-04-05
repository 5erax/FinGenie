"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
        <svg
          className="h-8 w-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white">Đã xảy ra lỗi</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-zinc-700">Mã lỗi: {error.digest}</p>
        )}
      </div>

      <button
        onClick={reset}
        className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:shadow-lg hover:shadow-primary-500/25"
      >
        Thử lại
      </button>
    </div>
  );
}
