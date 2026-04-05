import { useAuthStore } from "@/stores/auth-store";

/**
 * Helper to check if the user is authenticated.
 * Used by hooks to gate queries behind auth state.
 */
export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.isAuthenticated);
}
