import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "dark" | "light" | "system";
export type AppLanguage = "vi" | "en";

interface NotificationPrefs {
  transactions: boolean;
  budgetAlerts: boolean;
  aiTips: boolean;
  promotions: boolean;
}

interface PreferencesState {
  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Language
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;

  // Notifications
  notifications: NotificationPrefs;
  setNotification: (key: keyof NotificationPrefs, value: boolean) => void;

  // Hydration
  isHydrated: boolean;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "app_preferences";

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  transactions: true,
  budgetAlerts: true,
  aiTips: true,
  promotions: false,
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  theme: "dark",
  language: "vi",
  notifications: { ...DEFAULT_NOTIFICATIONS },
  isHydrated: false,

  setTheme: (theme) => {
    set({ theme });
    persistPreferences(get());
  },

  setLanguage: (language) => {
    set({ language });
    persistPreferences(get());
  },

  setNotification: (key, value) => {
    const notifications = { ...get().notifications, [key]: value };
    set({ notifications });
    persistPreferences({ ...get(), notifications });
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<{
          theme: ThemeMode;
          language: AppLanguage;
          notifications: NotificationPrefs;
        }>;
        set({
          theme: parsed.theme ?? "dark",
          language: parsed.language ?? "vi",
          notifications: parsed.notifications ?? { ...DEFAULT_NOTIFICATIONS },
        });
      }
    } catch (err) {
      if (__DEV__) console.warn("Failed to hydrate preferences:", err);
    } finally {
      set({ isHydrated: true });
    }
  },
}));

function persistPreferences(state: PreferencesState) {
  const data = {
    theme: state.theme,
    language: state.language,
    notifications: state.notifications,
  };
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(
    (err) => __DEV__ && console.warn("Failed to persist preferences:", err),
  );
}
