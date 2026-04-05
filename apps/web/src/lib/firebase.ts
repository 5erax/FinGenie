import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Validate required environment variables (must use static references for Turbopack)
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_FIREBASE_API_KEY. Check your .env.local file.",
  );
}
if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN. Check your .env.local file.",
  );
}
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID. Check your .env.local file.",
  );
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (singleton pattern for Next.js HMR)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { app, auth };
