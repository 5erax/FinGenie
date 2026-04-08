"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

// ── API base URL ────────────────────────────────────────────────────────────
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://fingenie-production.up.railway.app/api/v1";

// ── Types ───────────────────────────────────────────────────────────────────

export interface BackendUser {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: "user" | "admin";
  premiumUntil: string | null;
}

interface AuthState {
  user: User | null;
  backendUser: BackendUser | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<BackendUser>;
  signInWithGoogle: () => Promise<BackendUser>;
  signOut: () => Promise<void>;
  syncBackendUser: () => Promise<BackendUser | null>;
}

// ── Firebase error → Vietnamese ─────────────────────────────────────────────

const FIREBASE_ERROR_MAP: Record<string, string> = {
  "auth/invalid-credential": "Email hoặc mật khẩu không đúng",
  "auth/user-not-found": "Tài khoản không tồn tại",
  "auth/wrong-password": "Mật khẩu không đúng",
  "auth/too-many-requests": "Quá nhiều lần thử. Vui lòng thử lại sau.",
  "auth/invalid-email": "Email không hợp lệ",
  "auth/user-disabled": "Tài khoản đã bị vô hiệu hóa",
  "auth/popup-closed-by-user": "Đăng nhập bị hủy",
  "auth/cancelled-popup-request": "Đăng nhập bị hủy",
  "auth/account-exists-with-different-credential":
    "Tài khoản đã tồn tại với phương thức đăng nhập khác",
};

function getFirebaseErrorMessage(err: unknown): string {
  const code = (err as { code?: string }).code ?? "";
  return (
    FIREBASE_ERROR_MAP[code] ??
    (err instanceof Error ? err.message : "Đăng nhập thất bại")
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Call POST /auth/login with Firebase ID token to sync user to backend DB. */
async function loginToBackend(
  idToken: string,
): Promise<{ user: BackendUser; isNewUser: boolean; emailVerified: boolean }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `Không thể kết nối server (${res.status})`,
    );
  }

  return res.json() as Promise<{
    user: BackendUser;
    isNewUser: boolean;
    emailVerified: boolean;
  }>;
}

// ── Google provider singleton ───────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();

// ── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    backendUser: null,
    loading: true,
    error: null,
  });

  /** Sync current Firebase user with backend. Returns BackendUser or null. */
  const syncBackendUser = useCallback(async (): Promise<BackendUser | null> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    try {
      const idToken = await firebaseUser.getIdToken();
      const { user: backendUser } = await loginToBackend(idToken);
      setState((prev) => ({ ...prev, backendUser }));
      return backendUser;
    } catch {
      return null;
    }
  }, []);

  // Listen to Firebase auth state changes and auto-sync with backend
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const { user: backendUser } = await loginToBackend(idToken);
          setState({
            user: firebaseUser,
            backendUser,
            loading: false,
            error: null,
          });
        } catch {
          setState({
            user: firebaseUser,
            backendUser: null,
            loading: false,
            error: null,
          });
        }
      } else {
        setState({
          user: null,
          backendUser: null,
          loading: false,
          error: null,
        });
      }
    });
    return unsubscribe;
  }, []);

  // ── Email + Password sign-in ──────────────────────────────────────────────
  const signIn = async (
    email: string,
    password: string,
  ): Promise<BackendUser> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // 1. Authenticate with Firebase
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // 2. Sync with backend
      const idToken = await credential.user.getIdToken();
      const { user: backendUser } = await loginToBackend(idToken);

      setState({
        user: credential.user,
        backendUser,
        loading: false,
        error: null,
      });

      return backendUser;
    } catch (err) {
      const message = getFirebaseErrorMessage(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      throw err;
    }
  };

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const signInWithGoogle = async (): Promise<BackendUser> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // 1. Firebase Google popup
      const result = await signInWithPopup(auth, googleProvider);

      // 2. Sync with backend
      const idToken = await result.user.getIdToken();
      const { user: backendUser } = await loginToBackend(idToken);

      setState({
        user: result.user,
        backendUser,
        loading: false,
        error: null,
      });

      return backendUser;
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      // Don't show error for user-cancelled popups
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        setState((prev) => ({ ...prev, loading: false, error: null }));
        throw err;
      }
      const message = getFirebaseErrorMessage(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      throw err;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setState({
      user: null,
      backendUser: null,
      loading: false,
      error: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signInWithGoogle, signOut, syncBackendUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
