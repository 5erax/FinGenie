// API Configuration
// In development, use your local network IP for physical devices
// or localhost for emulators
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// Firebase Web Config (for Expo/React Native)
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "fingenie-60788.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "fingenie-60788",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

// Google Sign-In (OAuth)
// Get the Web Client ID from Firebase Console → Authentication → Sign-in method → Google
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

// Android client ID with SHA-1 fingerprint for native Google Sign-In
// Created in Google Cloud Console → Credentials → OAuth 2.0 → Android
export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";

// App Constants
export const APP_NAME = "FinGenie";
export const APP_VERSION = "0.1.0";
export const DEEP_LINK_SCHEME = "fingenie";

// Theme Colors — Dark palette (default)
export const DARK_COLORS = {
  background: "#09090b",
  surface: "#18181b",
  border: "#27272a",
  borderLight: "#1c1c1f",
  accent: "#a78bfa",
  accentDim: "rgba(167, 139, 250, 0.15)",
  textPrimary: "#ffffff",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  textDark: "#52525b",
  success: "#4ade80",
  danger: "#f87171",
  info: "#60a5fa",
  warning: "#fbbf24",
  inactive: "#3f3f46",
} as const;

// Theme Colors — Light palette
export const LIGHT_COLORS = {
  background: "#ffffff",
  surface: "#f4f4f5",
  border: "#e4e4e7",
  borderLight: "#f0f0f2",
  accent: "#7c3aed",
  accentDim: "rgba(124, 58, 237, 0.1)",
  textPrimary: "#09090b",
  textSecondary: "#52525b",
  textMuted: "#71717a",
  textDark: "#a1a1aa",
  success: "#16a34a",
  danger: "#dc2626",
  info: "#2563eb",
  warning: "#d97706",
  inactive: "#d4d4d8",
} as const;

// Default export for backward compatibility (used during StyleSheet creation)
export const COLORS = DARK_COLORS;

// Rate Limits
export const AI_FREE_LIMIT = 5; // messages per day
