import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
import { Platform } from "react-native";
import { FIREBASE_CONFIG } from "@/constants/config";

function createAuth(firebaseApp: FirebaseApp): Auth {
  // On web, getAuth() uses localStorage persistence by default
  if (Platform.OS === "web") {
    return getAuth(firebaseApp);
  }

  // On native, use AsyncStorage for persistence
  try {
    // Dynamic require to avoid bundling issues on web
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require("firebase/auth");
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "Firebase AsyncStorage persistence setup failed, falling back to default auth:",
        error,
      );
    }
    // Fallback if persistence setup fails
    return getAuth(firebaseApp);
  }
}

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(FIREBASE_CONFIG);
  auth = createAuth(app);
} else {
  app = getApp();
  auth = getAuth(app);
}

export { app, auth };
