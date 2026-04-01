import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCGqIOvnpw3CPpQfhz6UDVn3SzCxy8y2tM",
  authDomain: "fingenie-60788.firebaseapp.com",
  projectId: "fingenie-60788",
  storageBucket: "fingenie-60788.firebasestorage.app",
  messagingSenderId: "138677191377",
  appId: "1:138677191377:web:fa22c5d3fab08312cffbf0",
  measurementId: "G-RY2QZ1EV9P",
};

// Initialize Firebase (singleton pattern for Next.js HMR)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { app, auth };
