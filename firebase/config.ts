
// Reverted to actual Firebase imports and configuration.
// FIX: Updated Firebase imports to use the modular SDK (v9+).
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration object.
// You can find this object in your Firebase project settings -> "Your apps" section -> "Web app" -> "Config".
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// Initialize Firebase if it hasn't been initialized already
let app;
// FIX: Use getApps() to check if app is initialized and initializeApp/getApp for initialization.
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// FIX: Use getAuth and getFirestore from modular SDK.
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };