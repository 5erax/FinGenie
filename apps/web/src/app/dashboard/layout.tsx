import { AuthProvider } from "@/lib/auth-context";

export const metadata = {
  title: "FinGenie Dashboard",
  description: "Quản lý tài chính cá nhân của bạn",
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
