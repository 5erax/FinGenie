import { create } from "zustand";
import {
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  PhoneAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  type User as FirebaseUser,
} from "firebase/auth";
import { secureStorage } from "@/lib/secure-storage";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";
import type { User } from "@fingenie/shared-types";

interface AuthState {
  // State
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  pendingEmailVerification: boolean;

  // Actions
  initialize: () => () => void; // returns unsubscribe
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithPhone: (verificationId: string, code: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  loginToBackend: (firebaseToken: string) => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  sendVerificationOtp: () => Promise<void>;
  verifyEmailOtp: (code: string) => Promise<boolean>;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    displayName?: string;
    avatarUrl?: string;
  }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  firebaseUser: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  isNewUser: false,
  pendingEmailVerification: false,

  // Initialize Firebase auth listener
  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          set({ firebaseUser, token });

          // Login to backend
          await get().loginToBackend(token);
        } catch (error) {
          if (__DEV__) console.error("Auth initialization error:", error);
          set({ isLoading: false, isAuthenticated: false });
        }
      } else {
        set({
          user: null,
          firebaseUser: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });
    return unsubscribe;
  },

  // Google Sign-In
  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true });
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const token = await result.user.getIdToken();
      set({ firebaseUser: result.user, token });
      await get().loginToBackend(token);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Phone OTP Sign-In
  loginWithPhone: async (verificationId: string, code: string) => {
    set({ isLoading: true });
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await signInWithCredential(auth, credential);
      const token = await result.user.getIdToken();
      set({ firebaseUser: result.user, token });
      await get().loginToBackend(token);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Email/Password Sign-In
  loginWithEmail: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      set({ firebaseUser: result.user, token });
      await get().loginToBackend(token);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Email/Password Registration
  registerWithEmail: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await sendEmailVerification(result.user);
      const token = await result.user.getIdToken();
      set({ firebaseUser: result.user, token });
      await get().loginToBackend(token);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Backend login - sends Firebase token to NestJS
  loginToBackend: async (firebaseToken: string) => {
    try {
      const response = await api.post("/auth/login", {
        idToken: firebaseToken,
      });
      const { user, isNewUser, emailVerified } = response.data;
      await secureStorage.setItemAsync("auth_token", firebaseToken);

      // Block email/password users who haven't verified their email
      // Google users always have emailVerified=true, phone users have no email
      if (!emailVerified && user.email) {
        set({
          user,
          token: firebaseToken,
          isLoading: false,
          isAuthenticated: false,
          pendingEmailVerification: true,
          isNewUser,
        });
        return;
      }

      set({
        user,
        token: firebaseToken,
        isLoading: false,
        isAuthenticated: true,
        pendingEmailVerification: false,
        isNewUser,
      });
    } catch (error) {
      if (__DEV__) console.error("Backend login error:", error);
      try {
        await firebaseSignOut(auth);
      } catch {}
      set({
        isLoading: false,
        isAuthenticated: false,
        pendingEmailVerification: false,
        firebaseUser: null,
        user: null,
        token: null,
      });
      throw error;
    }
  },

  // Check if user has verified their email (call after user clicks verification link)
  checkEmailVerification: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) return false;

    // Reload Firebase user to get latest emailVerified status
    await firebaseUser.reload();

    if (firebaseUser.emailVerified) {
      // Get fresh token with updated claims
      const token = await firebaseUser.getIdToken(true);
      set({ token });
      // Re-login to backend with verified token
      await get().loginToBackend(token);
      return true;
    }

    return false;
  },

  // Resend verification email to current user
  resendVerificationEmail: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) throw new Error("Không có người dùng đăng nhập");
    await sendEmailVerification(firebaseUser);
  },

  // Send verification OTP via backend (email with 6-digit code)
  sendVerificationOtp: async () => {
    const { token } = get();
    if (!token) throw new Error("Không có token xác thực");
    await api.post("/auth/send-verification-otp", { idToken: token });
  },

  // Verify email with OTP code via backend
  verifyEmailOtp: async (code: string) => {
    const { token } = get();
    if (!token) throw new Error("Không có token xác thực");

    const response = await api.post("/auth/verify-email-otp", {
      idToken: token,
      code,
    });

    if (response.data.verified) {
      const { user } = response.data;
      set({
        user,
        isAuthenticated: true,
        pendingEmailVerification: false,
      });
      return true;
    }
    return false;
  },

  // Refresh Firebase token
  refreshToken: async () => {
    const { firebaseUser } = get();
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken(true);
      await secureStorage.setItemAsync("auth_token", token);
      set({ token });
    }
  },

  // Logout
  logout: async () => {
    try {
      await firebaseSignOut(auth);
      await secureStorage.deleteItemAsync("auth_token");
    } catch (error) {
      if (__DEV__) console.error("Logout error:", error);
    } finally {
      set({
        user: null,
        firebaseUser: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        isNewUser: false,
        pendingEmailVerification: false,
      });
    }
  },

  // Update user profile
  // Backend PATCH /users/me returns user directly (no ApiResponse wrapper)
  updateProfile: async (data) => {
    const response = await api.patch("/users/me", data);
    set({ user: response.data });
  },
}));
