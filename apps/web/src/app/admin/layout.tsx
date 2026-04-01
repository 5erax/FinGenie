import { AuthProvider } from "@/lib/auth-context";

export const metadata = {
  title: "FinGenie Admin",
  description: "FinGenie Admin Dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
