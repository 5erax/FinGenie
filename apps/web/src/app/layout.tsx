import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "FinGenie — Cuộc Phiêu Lưu Tài Chính Của Bạn",
  description:
    "FinGenie là trợ lý tài chính AI dành riêng cho Gen Z Việt Nam. Theo dõi chi tiêu, lập kế hoạch tiết kiệm và đạt mục tiêu tài chính thông minh hơn.",
  keywords: [
    "tài chính cá nhân",
    "AI",
    "Gen Z",
    "quản lý chi tiêu",
    "tiết kiệm",
    "FinGenie",
  ],
  authors: [{ name: "FinGenie Team" }],
  openGraph: {
    title: "FinGenie — Cuộc Phiêu Lưu Tài Chính Của Bạn",
    description:
      "Trợ lý tài chính AI dành riêng cho Gen Z Việt Nam. Quản lý chi tiêu thông minh hơn.",
    type: "website",
    locale: "vi_VN",
    siteName: "FinGenie",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinGenie — Cuộc Phiêu Lưu Tài Chính Của Bạn",
    description: "Trợ lý tài chính AI dành riêng cho Gen Z Việt Nam.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={jakarta.variable}>
      <body className="font-display bg-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
