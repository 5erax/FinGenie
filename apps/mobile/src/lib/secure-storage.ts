import { Platform } from "react-native";

/**
 * Platform-aware secure storage.
 * - Native: uses expo-secure-store
 * - Web: falls back to localStorage
 */

async function setItemAsync(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
    } catch {
      if (__DEV__) console.warn("localStorage.setItem failed for key:", key);
    }
  } else {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      if (__DEV__)
        console.warn("localStorage.getItem failed for key:", key, error);
      return null;
    }
  } else {
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync(key);
  }
}

async function deleteItemAsync(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch {
      if (__DEV__) console.warn("localStorage.removeItem failed for key:", key);
    }
  } else {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync(key);
  }
}

export const secureStorage = { setItemAsync, getItemAsync, deleteItemAsync };
