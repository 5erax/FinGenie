import { AuthProvider } from "@/lib/auth-context";
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  return (
    <AuthProvider>
      <LandingPage />
    </AuthProvider>
  );
}
